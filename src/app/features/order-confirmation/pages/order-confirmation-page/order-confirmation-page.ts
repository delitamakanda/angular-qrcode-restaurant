import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TuiButton } from '@taiga-ui/core';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { OrderApiService } from '@app/core/api/order-api.service';
import { Order } from '@app/core/models/order.model';
import { isNotFound } from '@app/core/utils/http-error.util';
import { OrderHistoryStore } from '@app/state/order-history.store';
import { OrderConfirmationCard } from '../../components/order-confirmation-card/order-confirmation-card';

type OrderState =
  | { readonly status: 'loading' }
  | { readonly status: 'error' }
  | { readonly status: 'loaded'; readonly order: Order };

@Component({
  selector: 'app-order-confirmation-page',
  imports: [RouterLink, TuiButton, OrderConfirmationCard],
  templateUrl: './order-confirmation-page.html',
  styleUrl: './order-confirmation-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderConfirmationPage {
  private readonly route = inject(ActivatedRoute);
  private readonly orderApi = inject(OrderApiService);
  private readonly history = inject(OrderHistoryStore);

  private readonly title = viewChild<ElementRef<HTMLElement>>('title');

  private readonly state = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) => {
        const orderId = params.get('orderId');
        if (!orderId) {
          return of<OrderState>({ status: 'error' });
        }
        return this.orderApi.getOrder(orderId, { silent: true }).pipe(
          map((order): OrderState => ({ status: 'loaded', order })),
          catchError((error: unknown) => {
            const snapshot = isNotFound(error)
              ? this.history.entries().find((entry) => entry.id === orderId)?.order
              : undefined;
            return of<OrderState>(
              snapshot ? { status: 'loaded', order: snapshot } : { status: 'error' },
            );
          }),
          startWith<OrderState>({ status: 'loading' }),
        );
      }),
    ),
    { initialValue: { status: 'loading' } },
  );

  protected readonly loading = computed(() => this.state().status === 'loading');
  protected readonly failed = computed(() => this.state().status === 'error');
  protected readonly order = computed(() => {
    const state = this.state();
    return state.status === 'loaded' ? state.order : null;
  });

  constructor() {
    effect(() => {
      if (this.order()) {
        this.title()?.nativeElement.focus();
      }
    });
  }
}
