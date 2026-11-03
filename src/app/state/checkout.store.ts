import { computed, inject, Injectable, signal } from '@angular/core';
import { CheckoutCustomer, PaymentMode } from '@app/core/models/checkout.model';
import { CartStore } from './cart.store';

@Injectable({
  providedIn: 'root',
})
export class CheckoutStore {
  private readonly cartStore = inject(CartStore);

  readonly customer = signal<CheckoutCustomer | null>(null);
  readonly paymentMethod = signal<PaymentMode>('cash');
  /** Code of the validated coupon (the promotion itself lives in `CartStore`). */
  readonly couponCode = computed(() => this.cartStore.appliedPromotion()?.code ?? null);
  readonly submitting = signal<boolean>(false);
  readonly hasPhone = computed(() => !!this.customer()?.phone);

  setCustomer(customer: CheckoutCustomer | null): void {
    this.customer.set(customer);
  }

  setPaymentMethod(method: PaymentMode): void {
    this.paymentMethod.set(method);
  }

  setSubmitting(submitting: boolean): void {
    this.submitting.set(submitting);
  }

  resetForm(): void {
    this.customer.set(null);
    this.paymentMethod.set('cash');
    this.cartStore.applyPromotion(null);
    this.submitting.set(false);
  }
}
