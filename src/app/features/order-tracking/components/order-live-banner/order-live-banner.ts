import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  IN_PROGRESS_ORDER_STATUSES,
  ORDER_STATUS_LABELS,
} from '@app/core/constants/order.constants';
import { OrderStatus } from '@app/core/models/order.model';

@Component({
  selector: 'app-order-live-banner',
  templateUrl: './order-live-banner.html',
  styleUrl: './order-live-banner.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderLiveBanner {
  /** Orders created through checkout may lack a status: treated as `pending`. */
  readonly status = input<OrderStatus | undefined>();

  private readonly effectiveStatus = computed(() => this.status() ?? 'pending');

  protected readonly isLive = computed(() =>
    IN_PROGRESS_ORDER_STATUSES.includes(this.effectiveStatus()),
  );
  protected readonly label = computed(() =>
    this.isLive() ? 'Live' : ORDER_STATUS_LABELS[this.effectiveStatus()],
  );
}
