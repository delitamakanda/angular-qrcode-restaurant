import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FavoritesStore } from '../../../../state/favorites.store';
import { MenuStore } from '../../../../state/menu.store';
import { MenuItemCard } from '../../../../shared/ui/cards/menu-item-card/menu-item-card';

@Component({
  selector: 'app-favorites-page',
  imports: [MenuItemCard],
  templateUrl: './favorites-page.html',
  styleUrl: './favorites-page.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoritesPage {
  readonly favoritesStore = inject(FavoritesStore);
  readonly menuStore = inject(MenuStore);

  readonly favoriteItems = computed(() =>
    this.menuStore.items().filter(item =>
      this.favoritesStore.isFavorite(item.id)
    )
  );
}
