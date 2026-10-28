import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CartItem } from '@app/core/models/cart.model';
import { Order } from '@app/core/models/order.model';
import { OrderMode } from '@app/core/models/store.model';
import { CurrencyFormatPipe } from '@shared/pipes/currency-format.pipe';
import { OrderStatusLabelPipe } from '@shared/pipes/order-status-label.pipe';

const MODE_LABELS: Record<OrderMode, string> = {
  dine_in: 'Dine in',
  take_away: 'Take away',
  delivery: 'Delivery',
};

@Component({
  selector: 'app-order-confirmation-card',
  imports: [CurrencyFormatPipe, OrderStatusLabelPipe, DatePipe],
  templateUrl: './order-confirmation-card.html',
  styleUrl: './order-confirmation-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderConfirmationCard {
  readonly order = input.required<Order>();

  protected readonly modeLabels = MODE_LABELS;

  protected optionsLabel(item: CartItem): string {
    return (item.selected_options ?? []).map((option) => option.label).join(', ');
  }
}
