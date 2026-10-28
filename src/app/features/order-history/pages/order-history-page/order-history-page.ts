import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TuiButton } from '@taiga-ui/core';
import { Observable, catchError, forkJoin, map, of, startWith, switchMap } from 'rxjs';
import { OrderApiService } from '@app/core/api/order-api.service';
import { Order } from '@app/core/models/order.model';
import { OrderHistoryStore } from '@app/state/order-history.store';
import { ShopStore } from '@app/state/shop.store';
import { EmptyState } from '@shared/ui/layout/empty-state/empty-state';
import { OrderHistoryItem } from '../../components/order-history-item/order-history-item';

type HistoryState =
  | { readonly status: 'loading' }
  | { readonly status: 'error' }
  | { readonly status: 'loaded'; readonly orders: readonly Order[] };

const LOADING: HistoryState = { status: 'loading' };

/** `errorInterceptor` rewrites a 404 into this string before it reaches callers. */
const NOT_FOUND_MESSAGE = 'Page not found';

function isNotFound(error: unknown): boolean {
  return (
    error === NOT_FOUND_MESSAGE || (error instanceof HttpErrorResponse && error.status === 404)
  );
}

type FetchResult =
  | { readonly kind: 'order'; readonly order: Order }
  | { readonly kind: 'gone'; readonly id: string }
  | { readonly kind: 'error' };

@Component({
  selector: 'app-order-history-page',
  imports: [RouterLink, TuiButton, EmptyState, OrderHistoryItem],
  templateUrl: './order-history-page.html',
  styleUrl: './order-history-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderHistoryPage {
  private readonly orderApi = inject(OrderApiService);
  private readonly history = inject(OrderHistoryStore);
  private readonly shopStore = inject(ShopStore);

  private readonly attempt = signal(0);
  protected readonly confirmingClear = signal(false);
  private readonly cancelButton = viewChild<ElementRef<HTMLElement>>('cancelButton');
  private readonly clearButton = viewChild<ElementRef<HTMLElement>>('clearButton');

  private readonly state = toSignal(
    toObservable(this.attempt).pipe(
      switchMap(() => {
        const storeId = this.shopStore.store()?.id;
        const ids = untracked(this.history.entries)
          .filter((entry) => entry.store_id === storeId)
          .map((entry) => entry.id);
        if (ids.length === 0) {
          return of<HistoryState>({ status: 'loaded', orders: [] });
        }
        return forkJoin(ids.map((id) => this.fetch(id))).pipe(
          map((results): HistoryState => {
            for (const result of results) {
              if (result.kind === 'gone') {
                this.history.remove(result.id);
              }
            }
            if (results.some((result) => result.kind === 'error')) {
              return { status: 'error' };
            }
            const orders = results
              .flatMap((result) => (result.kind === 'order' ? [result.order] : []))
              .sort((a, b) => b.created_at.localeCompare(a.created_at));
            return { status: 'loaded', orders };
          }),
          startWith<HistoryState>({ status: 'loading' }),
        );
      }),
    ),
    { initialValue: LOADING },
  );

  protected readonly loading = computed(() => this.state().status === 'loading');
  protected readonly failed = computed(() => this.state().status === 'error');
  protected readonly orders = computed(() => {
    const state = this.state();
    return state.status === 'loaded' ? state.orders : [];
  });
  protected readonly loaded = computed(() => this.state().status === 'loaded');
  /** Orders still on screen after a clear or a purge of unknown ids. */
  protected readonly visibleOrders = computed(() => {
    const ids = new Set(this.history.entries().map((entry) => entry.id));
    return this.orders().filter((order) => ids.has(order.id));
  });

  private fetch(id: string): Observable<FetchResult> {
    return this.orderApi.getOrder(id).pipe(
      map((order): FetchResult => ({ kind: 'order', order })),
      catchError((error: unknown) =>
        of<FetchResult>(isNotFound(error) ? { kind: 'gone', id } : { kind: 'error' }),
      ),
    );
  }

  protected retry(): void {
    this.attempt.update((n) => n + 1);
  }

  protected askClear(): void {
    this.confirmingClear.set(true);
    setTimeout(() => this.cancelButton()?.nativeElement.focus());
  }

  protected cancelClear(): void {
    this.confirmingClear.set(false);
    setTimeout(() => this.clearButton()?.nativeElement.focus());
  }

  protected confirmClear(): void {
    this.history.clear();
    this.confirmingClear.set(false);
  }
}
