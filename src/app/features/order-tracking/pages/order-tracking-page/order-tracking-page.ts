import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TuiButton } from '@taiga-ui/core';
import { ORDER_STATUS_LABELS } from '@app/core/constants/order.constants';
import { OrderStatus } from '@app/core/models/order.model';
import { OrderStatusTimeline } from '@app/features/order-tracking/components/order-status-timeline/order-status-timeline';
import { OrderTrackingStore } from '@app/state/order-tracking.store';
import { CurrencyFormatPipe } from '@shared/pipes/currency-format.pipe';
import { EmptyState } from '@shared/ui/layout/empty-state/empty-state';

@Component({
  selector: 'app-order-tracking-page',
  imports: [RouterLink, TuiButton, DatePipe, CurrencyFormatPipe, EmptyState, OrderStatusTimeline],
  templateUrl: './order-tracking-page.html',
  styleUrl: './order-tracking-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderTrackingPage {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(OrderTrackingStore);

  private readonly orderId = signal<string | null>(null);

  protected readonly order = this.store.order;
  protected readonly loading = this.store.loading;
  protected readonly failed = computed(() => !this.loading() && !this.order());

  protected readonly displayNumber = computed(() => {
    const order = this.order();
    return order ? order.order_number || order.id : '';
  });
  protected readonly statusLabel = computed(() => {
    // Orders created through checkout may lack a status in the mock data.
    const status: OrderStatus | undefined = this.order()?.status;
    return ORDER_STATUS_LABELS[status ?? 'pending'];
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const orderId = params.get('orderId');
      this.orderId.set(orderId);
      if (orderId) this.store.load(orderId);
    });
  }

  protected retry(): void {
    const orderId = this.orderId();
    if (orderId) this.store.load(orderId);
  }
}
