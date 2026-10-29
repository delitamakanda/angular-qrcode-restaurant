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
import { OrderHistoryEntry, OrderHistoryStore } from '@app/state/order-history.store';
import { ShopStore } from '@app/state/shop.store';
import { EmptyState } from '@shared/ui/layout/empty-state/empty-state';
import { OrderHistoryItem } from '../../components/order-history-item/order-history-item';
import { OrderHistoryUnavailableItem } from '../../components/order-history-unavailable-item/order-history-unavailable-item';

/** A local history entry, with its order when the API still knows it. */
interface HistoryRow {
  readonly entry: OrderHistoryEntry;
  readonly order: Order | null;
}

type HistoryState =
  | { readonly status: 'loading' }
  | { readonly status: 'error' }
  | { readonly status: 'loaded'; readonly rows: readonly HistoryRow[] };

const LOADING: HistoryState = { status: 'loading' };

/** `errorInterceptor` rewrites a 404 into this string before it reaches callers. */
const NOT_FOUND_MESSAGE = 'Page not found';

function isNotFound(error: unknown): boolean {
  return (
    error === NOT_FOUND_MESSAGE || (error instanceof HttpErrorResponse && error.status === 404)
  );
}

function dateOf(row: HistoryRow): string {
  return row.order?.created_at ?? row.entry.created_at;
}

type FetchResult =
  | { readonly kind: 'order'; readonly entry: OrderHistoryEntry; readonly order: Order }
  | { readonly kind: 'unavailable'; readonly entry: OrderHistoryEntry }
  | { readonly kind: 'error' };

@Component({
  selector: 'app-order-history-page',
  imports: [RouterLink, TuiButton, EmptyState, OrderHistoryItem, OrderHistoryUnavailableItem],
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
        const entries = untracked(this.history.entries).filter(
          (entry) => entry.store_id === storeId,
        );
        if (entries.length === 0) {
          return of<HistoryState>({ status: 'loaded', rows: [] });
        }
        return forkJoin(entries.map((entry) => this.fetch(entry))).pipe(
          map((results): HistoryState => {
            if (results.some((result) => result.kind === 'error')) {
              return { status: 'error' };
            }
            const rows = results
              .flatMap((result) =>
                result.kind === 'error'
                  ? []
                  : [
                      {
                        entry: result.entry,
                        order: result.kind === 'order' ? result.order : null,
                      },
                    ],
              )
              .sort((a, b) => dateOf(b).localeCompare(dateOf(a)));
            return { status: 'loaded', rows };
          }),
          startWith<HistoryState>({ status: 'loading' }),
        );
      }),
    ),
    { initialValue: LOADING },
  );

  protected readonly loading = computed(() => this.state().status === 'loading');
  protected readonly failed = computed(() => this.state().status === 'error');
  protected readonly rows = computed(() => {
    const state = this.state();
    return state.status === 'loaded' ? state.rows : [];
  });
  protected readonly loaded = computed(() => this.state().status === 'loaded');
  /** Rows still on screen after a clear or an explicit removal. */
  protected readonly visibleRows = computed(() => {
    const ids = new Set(this.history.entries().map((entry) => entry.id));
    return this.rows().filter((row) => ids.has(row.entry.id));
  });

  /** A 404 is expected (the mock API may lose orders): it never purges the local entry. */
  private fetch(entry: OrderHistoryEntry): Observable<FetchResult> {
    return this.orderApi.getOrder(entry.id, { silent: true }).pipe(
      map((order): FetchResult => ({ kind: 'order', entry, order })),
      catchError((error: unknown) =>
        of<FetchResult>(isNotFound(error) ? { kind: 'unavailable', entry } : { kind: 'error' }),
      ),
    );
  }

  protected remove(id: string): void {
    this.history.remove(id);
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
