import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PaymentMode } from '@app/core/models/checkout.model';
import { CheckoutPaymentMethods } from './checkout-payment-methods';

@Component({
  imports: [ReactiveFormsModule, CheckoutPaymentMethods],
  template: `<app-checkout-payment-methods [formControl]="control" />`,
})
class Host {
  readonly control = new FormControl<PaymentMode>('cash', { nonNullable: true });
}

describe('CheckoutPaymentMethods', () => {
  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const radios = Array.from(el.querySelectorAll<HTMLInputElement>('input[type="radio"]'));
    return { fixture, el, radios };
  }

  it('renders the Cash and Visa/Mastercard options with cash selected', () => {
    const { el, radios } = render();

    expect(radios.map((r) => r.value)).toEqual(['cash', 'card']);
    expect(el.textContent).toContain('Cash');
    expect(el.textContent).toContain('Visa/Mastercard');
    expect(radios[0].checked).toBe(true);
    expect(radios[1].checked).toBe(false);
  });

  it('is a named radiogroup', () => {
    const { el } = render();

    expect(el.querySelector('[role="radiogroup"]')).not.toBeNull();
    expect(el.querySelector('legend')?.textContent).toContain('Payment method');
  });

  it('propagates the selected value to the form control', () => {
    const { fixture, radios } = render();

    radios[1].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.control.value).toBe('card');
    expect(radios[1].checked).toBe(true);
  });

  it('reflects programmatic value changes', () => {
    const { fixture, radios } = render();

    fixture.componentInstance.control.setValue('card');
    fixture.detectChanges();

    expect(radios[1].checked).toBe(true);
  });

  it('disables the options when the control is disabled', () => {
    const { fixture, radios } = render();

    fixture.componentInstance.control.disable();
    fixture.detectChanges();

    expect(radios.every((r) => r.matches(':disabled'))).toBe(true);
  });
});
