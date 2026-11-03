import { computed, Injectable, signal } from '@angular/core';
import { CheckoutCustomer } from '@app/core/models/checkout.model';

@Injectable({
  providedIn: 'root',
})
export class CheckoutStore {
  readonly customer = signal<CheckoutCustomer | null>(null);
  readonly couponCode = signal<string | null>(null);
  readonly submitting = signal<boolean>(false);
  readonly hasPhone = computed(() => !!this.customer()?.phone);

  setCustomer(customer: CheckoutCustomer | null): void {
    this.customer.set(customer);
  }

  setCouponCode(code: string | null): void {
    this.couponCode.set(code);
  }

  setSubmitting(submitting: boolean): void {
    this.submitting.set(submitting);
  }

  resetForm(): void {
    this.customer.set(null);
    this.couponCode.set(null);
    this.submitting.set(false);
  }
}
