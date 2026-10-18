import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { provideTaiga } from '@taiga-ui/core';
import { OrderApiService } from '@app/core/api/order-api.service';
import { CartStore } from '@app/state/cart.store';
import { CheckoutStore } from '@app/state/checkout.store';
import { ShopStore } from '@app/state/shop.store';
import { CheckoutPage } from './checkout-page';

describe('CheckoutPage', () => {
  const createOrder = vi.fn();
  const navigate = vi.fn();

  function render() {
    createOrder.mockReset().mockReturnValue(of({ id: 'order-1' }));
    navigate.mockReset().mockResolvedValue(true);
    TestBed.configureTestingModule({
      imports: [CheckoutPage],
      providers: [
        provideTaiga(),
        { provide: OrderApiService, useValue: { createOrder } },
        { provide: Router, useValue: { navigate } },
        { provide: ActivatedRoute, useValue: {} },
        {
          provide: ShopStore,
          useValue: { store: signal({ id: 'demo' }), selectedMode: signal('dine_in') },
        },
        { provide: CartStore, useValue: { items: signal([]), clearCart: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(CheckoutPage);
    fixture.detectChanges();
    return fixture;
  }

  it('uses a Taiga submit button and disables it while submitting', () => {
    const fixture = render();
    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'button[type="submit"]',
    );

    expect(button?.hasAttribute('tuiButton')).toBe(true);
    expect(button?.disabled).toBe(false);

    TestBed.inject(CheckoutStore).setSubmitting(true);
    fixture.detectChanges();

    expect(button?.disabled).toBe(true);
  });

  function setValue(el: HTMLElement, selector: string, value: string): void {
    const input = el.querySelector<HTMLInputElement>(selector);
    if (!input) {
      throw new Error(`Missing input ${selector}`);
    }
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  it('uses Taiga textfields with the expected autocomplete attributes', () => {
    const el = render().nativeElement as HTMLElement;

    expect(el.querySelectorAll('tui-textfield').length).toBe(4);
    expect(el.querySelector('select')).toBeNull();
    expect(el.querySelector('input#payment-method')).not.toBeNull();
    expect(el.querySelector('#name')?.getAttribute('autocomplete')).toBe('name');
    expect(el.querySelector('#phone')?.getAttribute('autocomplete')).toBe('tel');
    expect(el.querySelector('#phone')?.getAttribute('inputmode')).toBe('tel');
  });

  it('shows errors and does not call createOrder when submitting an empty form', async () => {
    const fixture = render();
    const el = fixture.nativeElement as HTMLElement;

    await fixture.componentInstance.submitForm();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(createOrder).not.toHaveBeenCalled();
    expect(el.querySelectorAll('tui-error').length).toBe(1);
    expect(el.textContent).toContain('Required field');
    expect(el.querySelector('#phone-error')?.textContent).toContain('Phone number is required');
    expect(el.querySelector('#phone')?.getAttribute('aria-invalid')).toBe('true');
    expect(el.querySelector('#phone')?.getAttribute('aria-describedby')).toBe('phone-error');
  });

  it('shows no phone error before the field is touched', () => {
    const el = render().nativeElement as HTMLElement;

    expect(el.querySelector('#phone-error')).toBeNull();
    expect(el.querySelector('#phone')?.getAttribute('aria-invalid')).toBe('false');
  });

  it('shows the phone error once the field is touched', () => {
    const fixture = render();
    const el = fixture.nativeElement as HTMLElement;
    setValue(el, '#phone', '0606787045');
    fixture.componentInstance.checkoutForm.controls.phone.markAsTouched();
    fixture.detectChanges();

    expect(el.querySelector('#phone-error')?.textContent).toContain(
      'Enter a valid phone number, e.g. +33606787045',
    );
  });

  it('sends the normalized phone number', async () => {
    const fixture = render();
    const el = fixture.nativeElement as HTMLElement;
    setValue(el, '#name', 'Jane');
    setValue(el, '#phone', '+33 6 06 78 70 45');

    await fixture.componentInstance.submitForm();

    expect(createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ customer: { name: 'Jane', phone: '+33606787045' } }),
    );
  });

  it('shows a format error for an invalid phone number', async () => {
    const fixture = render();
    const el = fixture.nativeElement as HTMLElement;
    setValue(el, '#name', 'Jane');
    setValue(el, '#phone', '0612345678');

    await fixture.componentInstance.submitForm();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(createOrder).not.toHaveBeenCalled();
    expect(el.textContent).toContain('Enter a valid phone number, e.g. +33606787045');
  });

  it('calls createOrder with the expected payload for valid values', async () => {
    const fixture = render();
    const el = fixture.nativeElement as HTMLElement;
    setValue(el, '#name', 'Jane');
    setValue(el, '#phone', '+33612345678');

    await fixture.componentInstance.submitForm();

    expect(createOrder).toHaveBeenCalledWith({
      store_id: 'demo',
      mode: 'dine_in',
      customer: { name: 'Jane', phone: '+33612345678' },
      coupon_code: undefined,
      payment_mode: 'cash',
      items: [],
    });
    expect(navigate).toHaveBeenCalled();
  });

  it('defaults the payment method to cash and displays its label', () => {
    const fixture = render();
    const el = fixture.nativeElement as HTMLElement;

    expect(fixture.componentInstance.checkoutForm.controls.paymentMethod.value).toBe('cash');
    expect(el.querySelector<HTMLInputElement>('#payment-method')?.value).toBe('Cash');
  });

  it('sends payment_mode card when card is selected', async () => {
    const fixture = render();
    const el = fixture.nativeElement as HTMLElement;
    setValue(el, '#name', 'Jane');
    setValue(el, '#phone', '+33612345678');
    fixture.componentInstance.checkoutForm.controls.paymentMethod.setValue('card');

    await fixture.componentInstance.submitForm();

    expect(createOrder).toHaveBeenCalledWith(expect.objectContaining({ payment_mode: 'card' }));
  });
});
