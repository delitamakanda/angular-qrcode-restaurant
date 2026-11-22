import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Order } from '@app/core/models/order.model';
import { OrderMode } from '@app/core/models/store.model';
import { CurrencyFormatPipe } from '@shared/pipes/currency-format.pipe';
import { OrderStatusLabelPipe } from '@shared/pipes/order-status-label.pipe';

@Component({
  selector: 'app-recent-orders',
  imports: [DatePipe, CurrencyFormatPipe, OrderStatusLabelPipe],
  templateUrl: './recent-orders.html',
  styleUrl: './recent-orders.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentOrders {
  readonly orders = input.required<readonly Order[]>();

  protected readonly modeLabels: Record<OrderMode, string> = {
    dine_in: 'Dine in',
    take_away: 'Take away',
    delivery: 'Delivery',
  };
}
