import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ProductBadgeType } from '@app/core/models/menu-item.model';

const LABELS: Record<ProductBadgeType, string> = {
  popular: 'Popular',
  new: 'New',
  'sold-out': 'Sold out',
};

@Component({
  selector: 'app-product-badge',
  templateUrl: './product-badge.html',
  styleUrl: './product-badge.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductBadge {
  readonly type = input.required<ProductBadgeType>();
  protected readonly label = computed(() => LABELS[this.type()]);
}
