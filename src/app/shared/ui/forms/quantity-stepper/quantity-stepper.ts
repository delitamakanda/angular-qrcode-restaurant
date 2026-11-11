import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TuiButton } from '@taiga-ui/core';

export const QUANTITY_STEPPER_MAX = 99;

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
  readonly max = input(QUANTITY_STEPPER_MAX);
  readonly changed = output<number>();
}
