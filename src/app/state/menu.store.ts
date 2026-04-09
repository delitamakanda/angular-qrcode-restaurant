import { computed, inject, Injectable, signal } from '@angular/core';
import { MenuApiService } from '../core/api/menu-api.service';
import { MenuCategory, MenuItem } from '../core/models/menu-item.model';
import { OrderMode } from '../core/models/store.model';
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
  readonly isLoading = signal<boolean>(false);

  readonly filteredItems = computed(() => {
    const search = this.searchTerm().toLowerCase();
    const categoryId = this.selectedCategoryId();
    return this.items().filter(item => {
      const matchesSearchTerm = item.name.toLowerCase().includes(search) || !search || item.tags?.some(tag => tag.toLowerCase().includes(search)) || item.description?.toLowerCase().includes(search);
      const matchesCategoryId = ! categoryId || item.category_id === categoryId;
      return matchesSearchTerm && matchesCategoryId;
    })
  })

  async loadMenu(storeId: string, mode: OrderMode) : Promise<void> {
    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(this.menuApiService.getMenu(storeId, mode));
      this.categories.set([...response.categories].sort((a, b) => a.sort_order - b.sort_order));
      this.items.set(response.items)
      if (!this.selectedCategoryId() && response.categories.length > 0) {
        this.selectedCategoryId.set(response.categories[0].id);
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  setSearchTerm(term: string): void {
    this.searchTerm.set(term);
  }

  setSelectedCategory(categoryId: string | null): void {
    this.selectedCategoryId.set(categoryId);
  }

}
