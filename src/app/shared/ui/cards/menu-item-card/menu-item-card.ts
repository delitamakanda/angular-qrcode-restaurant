import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MenuItem, ProductBadgeType } from '@app/core/models/menu-item.model';
import { NotificationService } from '@app/core/services/notification.service';
import { CartStore } from '@app/state/cart.store';
import { CurrencyFormatPipe } from '@app/shared/pipes/currency-format.pipe';
import { ImgFallbackDirective } from '@shared/directives/img-fallback.directive';
import { ProductBadge } from '@shared/ui/chips/product-badge/product-badge';
import { TuiButton } from '@taiga-ui/core';

@Component({
  selector: 'app-menu-item-card',
  imports: [CurrencyFormatPipe, ImgFallbackDirective, ProductBadge, TuiButton],
  templateUrl: './menu-item-card.html',
  styleUrls: ['./menu-item-card.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuItemCard {
  readonly item = input.required<MenuItem>();
  protected readonly placeholder = '/images/placeholder-food.svg';
  protected readonly badge = computed<ProductBadgeType | null>(() => {
    const product = this.item();

    if (product.is_sold_out) {
      return 'sold-out';
    }
    if (product.tags?.includes('new')) {
      return 'new';
    }
    return product.tags?.includes('popular') ? 'popular' : null;
  });
  private readonly cartStore = inject(CartStore);
  private readonly notifications = inject(NotificationService);

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
    });
    this.notifications.success(`${product.name} added to cart`);
  }
}
