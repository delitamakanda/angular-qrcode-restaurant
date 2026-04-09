import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CartStore } from '../../../../state/cart.store';
import { CurrencyFormatPipe } from '../../../pipes/currency-format.pipe';

@Component({
  selector: 'app-bottom-cart-bar',
  imports: [
    RouterLink,
    CurrencyFormatPipe
  ],
  standalone: true,
  templateUrl: './bottom-cart-bar.html',
  styleUrl: './bottom-cart-bar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomCartBar {
  private readonly cartStore = inject(CartStore);
  private readonly router = inject(Router);
  readonly count = this.cartStore.count;
  readonly total = this.cartStore.total;
  readonly isVisible = computed(() => this.count() > 0);

  goToCart(): void {
    void this.router.navigate(['./cart']);
  }
}
