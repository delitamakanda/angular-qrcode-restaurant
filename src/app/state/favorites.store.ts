import { computed, effect, Injectable, signal } from '@angular/core';

export const FAVORITES_STORAGE_KEY = 'restaurant-favorites';

@Injectable({
  providedIn: 'root',
})
export class FavoritesStore {
  readonly favoriteIds = signal<string[]>([]);

  readonly count = computed(() => this.favoriteIds().length);

  private readonly favoriteSet = computed(() => new Set(this.favoriteIds()));

  constructor() {
    this.restoreFavorites();

    effect(() => {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(this.favoriteIds()));
    });
  }

  isFavorite(itemId: string): boolean {
    return this.favoriteSet().has(itemId);
  }

  toggleFavorite(itemId: string): void {
    if (this.isFavorite(itemId)) {
      this.favoriteIds.update(ids => ids.filter(id => id !== itemId));
    } else {
      this.favoriteIds.update(ids => [...ids, itemId]);
    }
  }

  private restoreFavorites(): void {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!stored) {
      return;
    }
    try {
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
        this.favoriteIds.set(parsed);
      }
    } catch {
      this.favoriteIds.set([]);
    }
  }
}
