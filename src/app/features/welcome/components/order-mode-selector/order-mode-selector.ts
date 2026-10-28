import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { OrderMode } from '@app/core/models/store.model';
import { TuiButton, TuiIcon } from '@taiga-ui/core';

interface ModeOption {
  readonly label: string;
  readonly icon: string;
}

const MODE_OPTIONS: Record<OrderMode, ModeOption> = {
  dine_in: { label: 'Dine in', icon: '@tui.hand-platter' },
  take_away: { label: 'Take away', icon: '@tui.hamburger' },
  delivery: { label: 'Delivery', icon: '@tui.motorbike' },
};

@Component({
  selector: 'app-order-mode-selector',
  imports: [TuiButton, TuiIcon],
  templateUrl: './order-mode-selector.html',
  styleUrl: './order-mode-selector.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderModeSelector {
  readonly modes = input.required<readonly OrderMode[]>();
  readonly selected = input<OrderMode | null>(null);
  readonly disabled = input(false);
  readonly modeSelected = output<OrderMode>();

  protected readonly options = MODE_OPTIONS;
}
