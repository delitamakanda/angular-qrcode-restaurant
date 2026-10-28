import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MenuItem, ProductBadgeType } from '@app/core/models/menu-item.model';
import { CurrencyFormatPipe } from '@app/shared/pipes/currency-format.pipe';
import { ImgFallbackDirective } from '@shared/directives/img-fallback.directive';
import { ProductBadge } from '@shared/ui/chips/product-badge/product-badge';
import { FavoritesStore } from '@app/state/favorites.store';
import { TuiButton, TuiIcon } from '@taiga-ui/core';

@Component({
  selector: 'app-menu-item-card',
  imports: [CurrencyFormatPipe, ImgFallbackDirective, ProductBadge, TuiButton, TuiIcon],
  templateUrl: './menu-item-card.html',
  styleUrls: ['./menu-item-card.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuItemCard {
  private readonly favorites = inject(FavoritesStore);
  readonly item = input.required<MenuItem>();
  /** Above-the-fold card: its image loads eagerly instead of lazily. */
  readonly priority = input(false);
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
  protected readonly isFavorite = computed(() => this.favorites.ids().includes(this.item().id));
  /** Emitted when the customer wants to add the product; the parent opens the customization flow. */
  readonly customize = output<MenuItem>();

  toggleFavorite(): void {
    this.favorites.toggle(this.item().id);
  }

  addToCart(): void {
    const product = this.item();

    if (!product.is_sold_out) {
      this.customize.emit(product);
    }
  }
}
