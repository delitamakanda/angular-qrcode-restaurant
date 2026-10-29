import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CartStore } from '../../../../state/cart.store';
import { CheckoutStore } from '../../../../state/checkout.store';
import { ShopStore } from '../../../../state/shop.store';
import { OrderHistoryStore } from '../../../../state/order-history.store';
import { OrderApiService } from '../../../../core/api/order-api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, map } from 'rxjs';
import { normalizePhone, phoneValidator } from '@shared/validators/phone.validator';
import {
  TuiButton,
  TuiDropdown,
  TuiError,
  TuiLabel,
  TuiTextfield,
  TuiInput,
  tuiItemsHandlersProvider,
  tuiValidationErrorsProvider,
} from '@taiga-ui/core';
import { TuiChevron, TuiDataListWrapper, TuiSelect } from '@taiga-ui/kit';
import { CartSummary } from '../../../cart/components/cart-summary/cart-summary';
import { PhoneInput } from '@shared/ui/forms/phone-input/phone-input';
import { PaymentMode } from '../../../../core/models/checkout.model';

const PAYMENT_LABELS: Partial<Record<PaymentMode, string>> = {
  cash: 'Cash',
  card: 'Visa/Mastercard',
};

@Component({
  selector: 'app-checkout-page',
  imports: [
    ReactiveFormsModule,
    PhoneInput,
    CartSummary,
    TuiButton,
    TuiTextfield,
    TuiLabel,
    TuiError,
    TuiInput,
    TuiSelect,
    TuiChevron,
    TuiDataListWrapper,
    TuiDropdown,
  ],
  templateUrl: './checkout-page.html',
  styleUrl: './checkout-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    tuiValidationErrorsProvider({
      required: 'Required field',
    }),
    tuiItemsHandlersProvider<PaymentMode>({
      stringify: signal((mode: PaymentMode) => PAYMENT_LABELS[mode] ?? mode),
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
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly paymentOptions: readonly PaymentMode[] = ['cash', 'card'];

  readonly checkoutForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    phone: ['', [Validators.required, phoneValidator()]],
    paymentMethod: ['cash' as PaymentMode, [Validators.required]],
    couponCode: [''],
  });

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
      const order = await firstValueFrom(
        this.orderApiService.createOrder({
          store_id: store.id,
          mode,
          customer: {
            name: value.name,
            phone: normalizePhone(value.phone),
          },
          coupon_code: value.couponCode || undefined,
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
