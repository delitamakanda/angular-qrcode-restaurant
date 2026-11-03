import { TestBed } from '@angular/core/testing';
import { provideTaiga } from '@taiga-ui/core';
import { CheckoutCoupon } from './checkout-coupon';

describe('CheckoutCoupon', () => {
  function render(inputs: Record<string, unknown> = {}) {
    TestBed.configureTestingModule({ imports: [CheckoutCoupon], providers: [provideTaiga()] });
    const fixture = TestBed.createComponent(CheckoutCoupon);
    for (const [key, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(key, value);
    }
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector<HTMLInputElement>('#coupon-code');
    if (!input) {
      throw new Error('Missing coupon input');
    }
    const button = (label: string) =>
      [...el.querySelectorAll<HTMLButtonElement>('button')].find(
        (b) => b.textContent.trim() === label,
      );
    const apply = vi.fn();
    const remove = vi.fn();
    fixture.componentInstance.apply.subscribe(apply);
    fixture.componentInstance.remove.subscribe(remove);
    const type = (value: string) => {
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    return { fixture, el, input, apply, remove, type, button };
  }

  it('emits apply with the trimmed, uppercased code on click', () => {
    const { button, apply, type } = render();
    type('  welcome10 ');
    button('Apply')?.click();

    expect(apply).toHaveBeenCalledWith('WELCOME10');
  });

  it('applies on Enter without submitting a form', () => {
    const { input, apply, type } = render();
    type('zen5');
    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    input.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(apply).toHaveBeenCalledWith('ZEN5');
  });

  it('uses non-submitting buttons and disables Apply while pending', () => {
    const { fixture, button } = render({ pending: true });
    const apply = button('Apply');

    expect(apply?.type).toBe('button');
    expect(apply?.disabled).toBe(true);
    fixture.componentRef.setInput('pending', false);
    fixture.detectChanges();
    expect(apply?.disabled).toBe(false);
  });

  it('shows the error with ARIA attributes', () => {
    const { el, input } = render({ error: 'Invalid or expired coupon code' });
    const alert = el.querySelector('[role="alert"]');

    expect(alert?.textContent).toContain('Invalid or expired coupon code');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('coupon-error');
    expect(alert?.id).toBe('coupon-error');
  });

  it('shows the success status, then emits remove and refocuses the input', () => {
    const { el, input, remove, button } = render({ appliedCode: 'WELCOME10', discount: 10 });

    expect(el.querySelector('[role="status"]')?.textContent).toContain(
      'WELCOME10 applied: −$10.00',
    );
    expect(input.getAttribute('aria-describedby')).toBe('coupon-success');
    expect(input.readOnly).toBe(true);

    button('Remove')?.click();

    expect(remove).toHaveBeenCalled();
    expect(document.activeElement).toBe(input);
  });
});
