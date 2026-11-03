import { ChangeDetectionStrategy, Component, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { PaymentMode } from '@app/core/models/checkout.model';

interface PaymentOption {
  readonly value: PaymentMode;
  readonly label: string;
}

@Component({
  selector: 'app-checkout-payment-methods',
  templateUrl: './checkout-payment-methods.html',
  styleUrl: './checkout-payment-methods.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckoutPaymentMethods),
      multi: true,
    },
  ],
})
export class CheckoutPaymentMethods implements ControlValueAccessor {
  protected readonly options: readonly PaymentOption[] = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Visa/Mastercard' },
  ];

  protected readonly value = signal<PaymentMode>('cash');
  protected readonly disabled = signal(false);

  private onChange: (value: PaymentMode) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: PaymentMode | null): void {
    this.value.set(value ?? 'cash');
  }

  registerOnChange(fn: (value: PaymentMode) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected select(value: PaymentMode): void {
    this.value.set(value);
    this.onChange(value);
  }

  protected touch(): void {
    this.onTouched();
  }
}
