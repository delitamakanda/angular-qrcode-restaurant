import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { TuiButton, type TuiDialogContext } from '@taiga-ui/core';
import { injectContext } from '@taiga-ui/polymorpheus';
import { CartStore } from '@app/state/cart.store';
import { SwipeActionDirective } from '@shared/directives/swipe-action.directive';
import { CurrencyFormatPipe } from '@shared/pipes/currency-format.pipe';
import { QuantityStepper } from '@shared/ui/forms/quantity-stepper/quantity-stepper';
import { EmptyState } from '@shared/ui/layout/empty-state/empty-state';
import { focusAfterRemoval } from '../../utils/focus-after-removal';

export type CartSheetResult = 'checkout' | 'menu' | undefined;

@Component({
  selector: 'app-cart-bottom-sheet',
  imports: [CurrencyFormatPipe, SwipeActionDirective, TuiButton, EmptyState, QuantityStepper],
  templateUrl: './cart-bottom-sheet.html',
  styleUrl: './cart-bottom-sheet.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartBottomSheet {
  protected readonly cartStore = inject(CartStore);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly context = injectContext<TuiDialogContext<CartSheetResult>>();

  protected readonly announcement = signal('');

  constructor() {
    effect(() => {
      if (this.cartStore.items().length === 0) {
        this.context.completeWith(undefined);
      }
    });
  }

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

  protected goToMenu(): void {
    this.context.completeWith('menu');
  }

  protected checkout(): void {
    this.context.completeWith('checkout');
  }
}
