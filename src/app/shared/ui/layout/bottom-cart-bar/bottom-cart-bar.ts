import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { CartStore } from '@app/state/cart.store';
import { CurrencyFormatPipe } from '@shared/pipes/currency-format.pipe';
import { TuiButton } from '@taiga-ui/core';

@Component({
  selector: 'app-bottom-cart-bar',
  imports: [CurrencyFormatPipe, TuiButton],
  templateUrl: './bottom-cart-bar.html',
  styleUrl: './bottom-cart-bar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomCartBar {
  private readonly cartStore = inject(CartStore);
  readonly count = this.cartStore.count;
  readonly total = this.cartStore.total;
  readonly isVisible = computed(() => this.count() > 0);
  readonly openCart = output();

  goToCart(): void {
    this.openCart.emit();
  }
}
