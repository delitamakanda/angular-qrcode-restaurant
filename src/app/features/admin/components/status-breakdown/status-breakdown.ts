import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { OrderStatus } from '@app/core/models/order.model';
import { OrderStatusLabelPipe } from '@shared/pipes/order-status-label.pipe';

export interface StatusCount {
  readonly status: OrderStatus;
  readonly count: number;
}

@Component({
  selector: 'app-status-breakdown',
  imports: [OrderStatusLabelPipe],
  template: `
    <ul class="status-breakdown">
      @for (item of counts(); track item.status) {
        <li class="status-breakdown__item" [attr.data-status]="item.status">
          <span>{{ item.status | orderStatusLabel }}</span>
          <strong>{{ item.count }}</strong>
        </li>
      }
    </ul>
  `,
  styleUrl: './status-breakdown.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBreakdown {
  readonly counts = input.required<readonly StatusCount[]>();
}
