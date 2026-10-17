import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CartStore } from '../../../../state/cart.store';
import { ActivatedRoute, Router } from '@angular/router';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { SwipeActionDirective } from '@shared/directives/swipe-action.directive';
import { TuiButton } from '@taiga-ui/core';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cart-page.html',
  styleUrl: './cart-page.css',
  imports: [CurrencyFormatPipe, SwipeActionDirective, TuiButton],
})
export class CartPage {
  protected readonly cartStore = inject(CartStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly announcement = signal('');

  protected onSwiped(itemId: string, name: string): void {
    this.cartStore.removeFromCart(itemId);
    this.announcement.set(`${name} retiré du panier`);
  }

  goToCheckout(): void {
    void this.router.navigate(['../checkout'], { relativeTo: this.route });
  }
}
