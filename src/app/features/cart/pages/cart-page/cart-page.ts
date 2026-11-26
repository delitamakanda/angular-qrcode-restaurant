import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { CartStore } from '../../../../state/cart.store';
import { ActivatedRoute, Router } from '@angular/router';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { SwipeActionDirective } from '@shared/directives/swipe-action.directive';
import { TuiButton } from '@taiga-ui/core';
import { EmptyState } from '@shared/ui/layout/empty-state/empty-state';
import { QuantityStepper } from '@shared/ui/forms/quantity-stepper/quantity-stepper';
import { CartSummary } from '../../components/cart-summary/cart-summary';
import { focusAfterRemoval } from '../../utils/focus-after-removal';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cart-page.html',
  styleUrl: './cart-page.css',
  imports: [
    CurrencyFormatPipe,
    SwipeActionDirective,
    TuiButton,
    EmptyState,
    CartSummary,
    QuantityStepper,
  ],
})
export class CartPage {
  protected readonly cartStore = inject(CartStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly announcement = signal('');

  /** Single removal path (Remove button, swipe, stepper at 1 then "−"). */
  protected onRemove(itemId: string, name: string): void {
    const index = this.cartStore.items().findIndex((item) => item.id === itemId);
    this.cartStore.removeFromCart(itemId);
    this.announcement.set(`${name} retiré du panier`);
    afterNextRender(
      () => {
        focusAfterRemoval(this.host.nativeElement, index);
      },
      { injector: this.injector },
    );
  }

  protected onQuantityChange(itemId: string, name: string, quantity: number): void {
    if (quantity <= 0) {
      this.onRemove(itemId, name);
      return;
    }
    this.cartStore.updateQuantity(itemId, quantity);
  }

  goToMenu(): void {
    void this.router.navigate(['../menu'], { relativeTo: this.route });
  }

  goToCheckout(): void {
    void this.router.navigate(['../checkout'], { relativeTo: this.route });
  }
}
