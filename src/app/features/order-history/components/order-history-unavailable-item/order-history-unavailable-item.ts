import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { OrderHistoryEntry } from '@app/state/order-history.store';

/** History row for an order the API no longer knows: only the local entry is shown. */
@Component({
  selector: 'app-order-history-unavailable-item',
  imports: [DatePipe],
  templateUrl: './order-history-unavailable-item.html',
  styleUrl: './order-history-unavailable-item.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderHistoryUnavailableItem {
  readonly entry = input.required<OrderHistoryEntry>();
  readonly removed = output<string>();

  protected readonly shortId = computed(() => this.entry().id.slice(-8));
}
