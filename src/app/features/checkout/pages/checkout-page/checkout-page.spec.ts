import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { APP_TOKEN_CONFIG } from '@app/core/config/app.token';
import { CheckoutStore } from '@app/state/checkout.store';
import { CheckoutPage } from './checkout-page';

describe('CheckoutPage submit button', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: APP_TOKEN_CONFIG, useValue: {} },
      ],
    });
    const fixture = TestBed.createComponent(CheckoutPage);
    fixture.detectChanges();
    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'button[type="submit"]',
    );
    return { fixture, button };
  }

  it('is a Taiga button and enabled by default', () => {
    const { button } = setup();

    expect(button?.hasAttribute('tuiButton')).toBe(true);
    expect(button?.disabled).toBe(false);
  });

  it('is disabled while submitting', () => {
    const { fixture, button } = setup();
    TestBed.inject(CheckoutStore).setSubmitting(true);
    fixture.detectChanges();

    expect(button?.disabled).toBe(true);
  });
});
