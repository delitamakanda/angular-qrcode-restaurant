import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { MenuItemCard } from '@shared/ui/cards/menu-item-card/menu-item-card';
import { MenuItemCardSkeleton } from '@shared/ui/cards/menu-item-card-skeleton/menu-item-card-skeleton';
import { ActivatedRoute } from '@angular/router';
import { ShopStore } from '@app/state/shop.store';
import { MenuStore } from '@app/state/menu.store';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, EMPTY } from 'rxjs';
import { MenuCategorySelection } from '@app/features/menu/components/menu-category-selection/menu-category-selection';
import { ProductSearch } from '@app/features/menu/components/product-search/product-search';

@Component({
  selector: 'app-menu-page',
  imports: [MenuItemCard, MenuItemCardSkeleton, MenuCategorySelection, ProductSearch],
  templateUrl: './menu-page.html',
  styleUrl: './menu-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuPage {
  private readonly route = inject(ActivatedRoute);
  private readonly shopStore = inject(ShopStore);
  readonly menuStore = inject(MenuStore);

  protected readonly skeletonSlots = Array.from({ length: 6 });

  private readonly storeId = toSignal(
    (this.route.parent?.paramMap ?? EMPTY).pipe(map((params) => params.get('storeId'))),
  );

  private readonly search = viewChild(ProductSearch);

  protected readonly showNoResults = computed(
    () =>
      !this.menuStore.isLoading() &&
      this.menuStore.filteredItems().length === 0 &&
      this.menuStore.items().length > 0,
  );

  protected readonly resultsAnnouncement = computed(() => {
    if (this.menuStore.isLoading() || !this.menuStore.searchTerm().trim()) {
      return '';
    }
    const count = this.menuStore.filteredItems().length;
    return count === 0 ? 'No results' : `${String(count)} ${count === 1 ? 'result' : 'results'}`;
  });

  constructor() {
    effect(() => {
      const storeId = this.storeId() as string | null;
      const mode = this.shopStore.selectedMode();

      if (!storeId || !mode) {
        return;
      }
      void this.menuStore.loadMenu(storeId, mode);
    });
  }

  protected clearSearch(): void {
    this.menuStore.setSearchTerm('');
    this.search()?.focus();
  }
}
