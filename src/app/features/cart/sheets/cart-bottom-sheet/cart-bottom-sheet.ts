import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { TuiButton, type TuiDialogContext } from '@taiga-ui/core';
import { injectContext } from '@taiga-ui/polymorpheus';
import { CartStore } from '@app/state/cart.store';
import { CurrencyFormatPipe } from '@shared/pipes/currency-format.pipe';

export type CartSheetResult = 'checkout' | undefined;

@Component({
  selector: 'app-cart-bottom-sheet',
  imports: [CurrencyFormatPipe, TuiButton],
  templateUrl: './cart-bottom-sheet.html',
  styleUrl: './cart-bottom-sheet.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartBottomSheet {
  protected readonly cartStore = inject(CartStore);
  private readonly context = injectContext<TuiDialogContext<CartSheetResult>>();

  constructor() {
    effect(() => {
      if (this.cartStore.items().length === 0) {
        this.context.completeWith(undefined);
      }
    });
  }

  protected checkout(): void {
    this.context.completeWith('checkout');
  }
}
