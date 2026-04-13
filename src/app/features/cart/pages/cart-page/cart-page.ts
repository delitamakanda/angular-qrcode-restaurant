import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CartStore } from '../../../../state/cart.store';
import { ActivatedRoute, Router } from '@angular/router';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cart-page.html',
  styleUrl: './cart-page.css',
  imports: [
    CurrencyFormatPipe
  ]
})
export class CartPage {
  protected readonly cartStore = inject(CartStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  goToCheckout(): void {
    void this.router.navigate(['../checkout'], { relativeTo: this.route });
  }
}
