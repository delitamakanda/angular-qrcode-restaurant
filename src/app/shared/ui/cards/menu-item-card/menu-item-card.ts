import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MenuItem, ProductBadgeType } from '@app/core/models/menu-item.model';
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
  /** Emitted when the customer wants to add the product; the parent opens the customization flow. */
  readonly customize = output<MenuItem>();

  addToCart(): void {
    const product = this.item();

    if (!product.is_sold_out) {
      this.customize.emit(product);
    }
  }
}
