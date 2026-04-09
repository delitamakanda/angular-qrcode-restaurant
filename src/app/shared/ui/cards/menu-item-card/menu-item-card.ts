import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MenuItem } from '../../../../core/models/menu-item.model';
import { CartStore } from '../../../../state/cart.store';
import { CurrencyFormatPipe } from '../../../pipes/currency-format.pipe';

@Component({
  selector: 'app-menu-item-card',
  imports: [
    CurrencyFormatPipe
  ],
  standalone: true,
  templateUrl: './menu-item-card.html',
  styleUrl: './menu-item-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuItemCard {
  readonly item = input.required<MenuItem>()
  private readonly cartStore = inject(CartStore);

  addToCart(): void {
    const product = this.item();

    if (product.is_sold_out) {
      return;
    }
    this.cartStore.addToCart({
      id: crypto.randomUUID(),
      menu_item_id: product.id,
      quantity: 1,
      name: product.name,
      note: '',
      unit_base_price: product.base_price,
      selected_options: [],
      total_price: product.base_price,
    })
  }
}
