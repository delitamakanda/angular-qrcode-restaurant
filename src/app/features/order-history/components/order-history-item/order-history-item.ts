import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Order, OrderStatus } from '@app/core/models/order.model';
import { OrderMode } from '@app/core/models/store.model';
import { CurrencyFormatPipe } from '@shared/pipes/currency-format.pipe';
import { OrderStatusLabelPipe } from '@shared/pipes/order-status-label.pipe';

const MODE_LABELS: Record<OrderMode, string> = {
  dine_in: 'Dine in',
  take_away: 'Take away',
  delivery: 'Delivery',
};

const IN_PROGRESS: readonly OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready'];

@Component({
  selector: 'app-order-history-item',
  imports: [RouterLink, DatePipe, CurrencyFormatPipe, OrderStatusLabelPipe],
  templateUrl: './order-history-item.html',
  styleUrl: './order-history-item.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderHistoryItem {
  readonly order = input.required<Order>();

  protected readonly modeLabel = computed(() => MODE_LABELS[this.order().mode]);
  protected readonly itemCount = computed(() =>
    this.order().items.reduce((sum, item) => sum + item.quantity, 0),
  );
  protected readonly link = computed(() => [
    IN_PROGRESS.includes(this.order().status) ? '../tracking' : '../confirmation',
    this.order().id,
  ]);
}
