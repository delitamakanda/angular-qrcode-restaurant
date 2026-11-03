import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TuiButton, TuiInput, TuiLabel, TuiTextfield } from '@taiga-ui/core';
import { CurrencyFormatPipe } from '@shared/pipes/currency-format.pipe';

@Component({
  selector: 'app-checkout-coupon',
  imports: [ReactiveFormsModule, TuiButton, TuiTextfield, TuiLabel, TuiInput, CurrencyFormatPipe],
  templateUrl: './checkout-coupon.html',
  styleUrl: './checkout-coupon.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutCoupon {
  /** Code of the coupon currently applied, if any. */
  readonly appliedCode = input<string | null>(null);
  readonly discount = input(0);
  readonly error = input<string | null>(null);
  readonly pending = input(false);

  readonly apply = output<string>();
  readonly remove = output();

  protected readonly code = new FormControl('', { nonNullable: true });
  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');
  protected readonly describedBy = computed(() =>
    this.error() ? 'coupon-error' : this.appliedCode() ? 'coupon-success' : null,
  );

  protected onApply(event?: Event): void {
    event?.preventDefault();
    if (this.pending() || this.appliedCode()) {
      return;
    }
    const normalized = this.code.value.trim().toUpperCase();
    this.code.setValue(normalized);
    this.apply.emit(normalized);
  }

  protected onRemove(): void {
    this.code.setValue('');
    this.remove.emit();
    this.field().nativeElement.focus();
  }
}
