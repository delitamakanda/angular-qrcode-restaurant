import { computed, inject, Injectable, signal } from '@angular/core';
import { MenuApiService } from '@app/core/api/menu-api.service';
import { MenuCategory, MenuItem } from '@app/core/models/menu-item.model';
import { OrderMode } from '@app/core/models/store.model';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MenuStore {
  private readonly menuApiService = inject(MenuApiService);

  readonly categories = signal<MenuCategory[]>([]);
  readonly items = signal<MenuItem[]>([]);
  readonly searchTerm = signal<string>('');
  readonly selectedCategoryId = signal<string | null>(null);
  readonly activeCategoryId = signal<string | null>(null);
  readonly isLoading = signal<boolean>(false);

  readonly filteredItems = computed(() => {
    const search = this.searchTerm().toLowerCase();
    const categoryId = this.selectedCategoryId();
    return this.items().filter((item) => {
      const matchesSearchTerm =
        item.name.toLowerCase().includes(search) ||
        !search ||
        (item.tags?.some((tag) => tag.toLowerCase().includes(search)) ?? false) ||
        (item.description?.toLowerCase().includes(search) ?? false);
      const matchesCategoryId = !categoryId || item.category_id === categoryId;
      return matchesSearchTerm && matchesCategoryId;
    });
  });

  readonly itemsByCategory = computed(() => {
    const items = this.filteredItems();
    return this.categories()
      .map((category) => ({
        category,
        items: items.filter((item) => item.category_id === category.id),
      }))
      .filter((section) => section.items.length > 0);
  });

  private loadedStoreId: string | null = null;

  async loadMenu(storeId: string, mode: OrderMode): Promise<void> {
    if (this.loadedStoreId !== storeId) {
      this.reset();
      this.loadedStoreId = storeId;
    }
    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(this.menuApiService.getMenu(storeId, mode));
      if (this.loadedStoreId !== storeId) {
        return; // a newer load for another store superseded this one
      }
      this.categories.set([...response.categories].sort((a, b) => a.sort_order - b.sort_order));
      this.items.set(response.items);
    } finally {
      this.isLoading.set(false);
    }
  }

  /** Drop the previous restaurant's menu and filters. */
  private reset(): void {
    this.categories.set([]);
    this.items.set([]);
    this.searchTerm.set('');
    this.selectedCategoryId.set(null);
    this.activeCategoryId.set(null);
  }

  setSearchTerm(term: string): void {
    this.searchTerm.set(term);
  }

  setSelectedCategory(categoryId: string | null): void {
    this.selectedCategoryId.set(categoryId);
  }
}
