import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CartStore } from '../../../../state/cart.store';
import { CheckoutStore } from '../../../../state/checkout.store';
import { ShopStore } from '../../../../state/shop.store';
import { OrderApiService } from '../../../../core/api/order-api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-checkout-page',
  imports: [ReactiveFormsModule],
  standalone: true,
  templateUrl: './checkout-page.html',
  styleUrl: './checkout-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutPage {
  private readonly fb = inject(FormBuilder);
  private readonly cartStore = inject(CartStore);
  protected readonly checkoutStore = inject(CheckoutStore);
  private readonly shopStore = inject(ShopStore);
  private readonly orderApiService = inject(OrderApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly checkoutForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    phone: ['', [Validators.required, Validators.pattern(/^\+[1-9]\d{1,14}$/)]],
    paymentMethod: ['cash' as const, [Validators.required] ],
    couponCode: [''],
  })

  async submitForm(): Promise<void> {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    const store = this.shopStore.store();
    const mode = this.shopStore.selectedMode();
    if (!store ||!mode) {
      return;
    }
    this.checkoutStore.setSubmitting(true)

    try {
      const value = this.checkoutForm.getRawValue();
      const order = await firstValueFrom(
        this.orderApiService.createOrder(
          {
            store_id: store.id,
            mode,
            customer: {
              name: value.name,
              phone: value.phone,
            },
            coupon_code: value.couponCode || undefined,
            payment_mode: value.paymentMethod,
            items: this.cartStore.items(),
          }
        )
      )
      this.cartStore.clearCart();
      this.checkoutStore.resetForm();

      await this.router.navigate(['../confirmation', order.id], {
        relativeTo: this.route,
      });
    } finally {
      this.checkoutStore.setSubmitting(false)
    }
  }
}
