import { effect, Injectable, signal } from '@angular/core';

const FAVORITES_STORAGE_KEY = 'cashier-favorites';

@Injectable({
  providedIn: 'root',
})
export class FavoritesStore {
  /** Favorite `menu_item_id`s; ids missing from the menu are simply ignored by consumers. */
  readonly ids = signal<string[]>([]);

  constructor() {
    this.restoreFavorites();

    effect(() => {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(this.ids()));
    });
  }

  isFavorite(id: string): boolean {
    return this.ids().includes(id);
  }

  toggle(id: string): void {
    this.ids.update((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  private restoreFavorites(): void {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!stored) {
      return;
    }
    try {
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        this.ids.set([...new Set(parsed.filter((id): id is string => typeof id === 'string'))]);
      }
    } catch {
      this.ids.set([]);
    }
  }
}
