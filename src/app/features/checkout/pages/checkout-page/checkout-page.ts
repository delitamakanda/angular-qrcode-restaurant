import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CartStore } from '../../../../state/cart.store';
import { CheckoutStore } from '../../../../state/checkout.store';
import { ShopStore } from '../../../../state/shop.store';
import { OrderHistoryStore } from '../../../../state/order-history.store';
import { OrderApiService } from '../../../../core/api/order-api.service';
import { PromotionApiService } from '../../../../core/api/promotion-api.service';
import { CheckoutCoupon } from '../../components/checkout-coupon/checkout-coupon';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, map } from 'rxjs';
import { normalizePhone, phoneValidator } from '@shared/validators/phone.validator';
import {
  TuiButton,
  TuiError,
  TuiLabel,
  TuiTextfield,
  TuiInput,
  tuiValidationErrorsProvider,
} from '@taiga-ui/core';
import { CartSummary } from '../../../cart/components/cart-summary/cart-summary';
import { PhoneInput } from '@shared/ui/forms/phone-input/phone-input';
import { PaymentMode } from '../../../../core/models/checkout.model';
import { CheckoutPaymentMethods } from '../../components/checkout-payment-methods/checkout-payment-methods';

const NOTE_MAX_LENGTH = 200;

@Component({
  selector: 'app-checkout-page',
  imports: [
    ReactiveFormsModule,
    PhoneInput,
    CartSummary,
    CheckoutCoupon,
    CheckoutPaymentMethods,
    TuiButton,
    TuiTextfield,
    TuiLabel,
    TuiError,
    TuiInput,
  ],
  templateUrl: './checkout-page.html',
  styleUrl: './checkout-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    tuiValidationErrorsProvider({
      required: 'Required field',
    }),
  ],
})
export class CheckoutPage {
  private readonly fb = inject(FormBuilder);
  protected readonly cartStore = inject(CartStore);
  protected readonly checkoutStore = inject(CheckoutStore);
  private readonly shopStore = inject(ShopStore);
  private readonly orderHistoryStore = inject(OrderHistoryStore);
  private readonly orderApiService = inject(OrderApiService);
  private readonly promotionApiService = inject(PromotionApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly checkoutForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    phone: ['', [Validators.required, phoneValidator()]],
    paymentMethod: ['cash' as PaymentMode, [Validators.required]],
    note: ['', [Validators.maxLength(NOTE_MAX_LENGTH)]],
  });

  protected readonly noteMaxLength = NOTE_MAX_LENGTH;
  protected readonly noteLength = toSignal(
    this.checkoutForm.controls.note.valueChanges.pipe(map((note) => note.length)),
    { initialValue: 0 },
  );

  protected readonly couponError = signal<string | null>(null);
  protected readonly couponPending = signal(false);

  protected async applyCoupon(code: string): Promise<void> {
    const store = this.shopStore.store();
    if (!store) {
      return;
    }
    if (!code) {
      this.couponError.set('Enter a coupon code');
      return;
    }
    this.couponError.set(null);
    this.couponPending.set(true);
    try {
      const promotion = await firstValueFrom(
        this.promotionApiService.getActivePromotion(store.id, code),
      );
      if (promotion) {
        this.cartStore.applyPromotion(promotion);
      } else {
        this.couponError.set('Invalid or expired coupon code');
      }
    } catch {
      this.couponError.set('Could not check the coupon code, please try again');
    } finally {
      this.couponPending.set(false);
    }
  }

  protected removeCoupon(): void {
    this.cartStore.applyPromotion(null);
    this.couponError.set(null);
  }

  protected readonly phoneError = toSignal(
    this.checkoutForm.controls.phone.events.pipe(map(() => this.getPhoneError())),
    { initialValue: null },
  );

  private getPhoneError(): string | null {
    const control = this.checkoutForm.controls.phone;
    if (!control.touched) {
      return null;
    }
    if (control.hasError('required')) {
      return 'Phone number is required';
    }
    return control.hasError('invalidPhone')
      ? 'Enter a valid phone number, e.g. +33606787045'
      : null;
  }

  async submitForm(): Promise<void> {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    const store = this.shopStore.store();
    const mode = this.shopStore.selectedMode();
    if (!store || !mode) {
      return;
    }
    this.checkoutStore.setSubmitting(true);

    try {
      const value = this.checkoutForm.getRawValue();
      const note = value.note.trim();
      const order = await firstValueFrom(
        this.orderApiService.createOrder({
          store_id: store.id,
          mode,
          customer: {
            name: value.name,
            phone: normalizePhone(value.phone),
          },
          coupon_code: this.checkoutStore.couponCode() ?? undefined,
          ...(note ? { note } : {}),
          payment_mode: value.paymentMethod,
          items: this.cartStore.items(),
          order_number: `A${String(this.orderHistoryStore.entries().length + 1).padStart(3, '0')}`,
          status: 'pending',
          subtotal: this.cartStore.subtotal(),
          discount: this.cartStore.discount(),
          fees: this.cartStore.fees(),
          total: this.cartStore.total(),
          created_at: new Date().toISOString(),
        }),
      );
      this.orderHistoryStore.add({
        id: order.id,
        store_id: store.id,
        created_at: order.created_at,
        order,
      });
      this.cartStore.clearCart();
      this.checkoutStore.resetForm();

      await this.router.navigate(['../confirmation', order.id], {
        relativeTo: this.route,
      });
    } finally {
      this.checkoutStore.setSubmitting(false);
    }
  }
}
