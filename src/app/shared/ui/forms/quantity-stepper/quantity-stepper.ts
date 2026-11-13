import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MAX_QUANTITY } from '@app/core/constants/quantity.constants';
import { TuiButton } from '@taiga-ui/core';

@Component({
  selector: 'app-quantity-stepper',
  imports: [TuiButton],
  templateUrl: './quantity-stepper.html',
  styleUrl: './quantity-stepper.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuantityStepper {
  readonly value = input.required<number>();
  /** Product name, used in the accessible names of the buttons. */
  readonly label = input.required<string>();
  /** Lowest value the stepper can emit: 0 lets "−" at 1 remove the line, 1 disables it. */
  readonly min = input(0);
  readonly max = input(MAX_QUANTITY);
  readonly changed = output<number>();
}
