import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { TuiButton, type TuiDialogContext } from '@taiga-ui/core';
import { injectContext } from '@taiga-ui/polymorpheus';
import { CartStore } from '@app/state/cart.store';
import { SwipeActionDirective } from '@shared/directives/swipe-action.directive';
import { CurrencyFormatPipe } from '@shared/pipes/currency-format.pipe';
import { EmptyState } from '@shared/ui/layout/empty-state/empty-state';

export type CartSheetResult = 'checkout' | 'menu' | undefined;

@Component({
  selector: 'app-cart-bottom-sheet',
  imports: [CurrencyFormatPipe, SwipeActionDirective, TuiButton, EmptyState],
  templateUrl: './cart-bottom-sheet.html',
  styleUrl: './cart-bottom-sheet.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartBottomSheet {
  protected readonly cartStore = inject(CartStore);
  private readonly context = injectContext<TuiDialogContext<CartSheetResult>>();

  protected readonly announcement = signal('');

  constructor() {
    effect(() => {
      if (this.cartStore.items().length === 0) {
        this.context.completeWith(undefined);
      }
    });
  }

  protected onSwiped(itemId: string, name: string): void {
    this.cartStore.removeFromCart(itemId);
    this.announcement.set(`${name} retiré du panier`);
  }

  protected goToMenu(): void {
    this.context.completeWith('menu');
  }

  protected checkout(): void {
    this.context.completeWith('checkout');
  }
}
