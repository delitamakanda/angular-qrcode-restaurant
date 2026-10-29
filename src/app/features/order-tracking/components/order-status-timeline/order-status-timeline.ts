import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TuiIcon } from '@taiga-ui/core';
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS } from '@app/core/constants/order.constants';
import { OrderStatus } from '@app/core/models/order.model';

type StepState = 'done' | 'current' | 'upcoming' | 'error';

interface TimelineStep {
  status: OrderStatus;
  label: string;
  state: StepState;
  stateLabel: string;
}

const STATE_LABELS: Record<StepState, string> = {
  done: 'Completed',
  current: 'Current',
  upcoming: 'Upcoming',
  error: 'Cancelled',
};

@Component({
  selector: 'app-order-status-timeline',
  imports: [TuiIcon],
  templateUrl: './order-status-timeline.html',
  styleUrl: './order-status-timeline.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderStatusTimeline {
  readonly status = input<OrderStatus | undefined>();

  protected readonly steps = computed<TimelineStep[]>(() => {
    // Orders created through checkout may lack a status: treat them as pending.
    const status = this.status() ?? 'pending';
    if (status === 'cancelled') {
      return [this.step('cancelled', 'error')];
    }
    const currentIndex = ORDER_STATUS_FLOW.indexOf(status);
    return ORDER_STATUS_FLOW.map((step, index) =>
      this.step(
        step,
        index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'upcoming',
      ),
    );
  });

  private step(status: OrderStatus, state: StepState): TimelineStep {
    return { status, label: ORDER_STATUS_LABELS[status], state, stateLabel: STATE_LABELS[state] };
  }
}
