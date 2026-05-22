import { TestBed } from '@angular/core/testing';
import { FavoritesStore, FAVORITES_STORAGE_KEY } from './favorites.store';

describe('FavoritesStore', () => {
  let store: FavoritesStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    store = TestBed.inject(FavoritesStore);
  });

  it('should start with no favorites', () => {
    expect(store.favoriteIds()).toEqual([]);
    expect(store.count()).toBe(0);
  });

  it('should add an item to favorites', () => {
    store.toggleFavorite('item-1');
    expect(store.favoriteIds()).toContain('item-1');
    expect(store.count()).toBe(1);
  });

  it('should remove an item from favorites when toggled again', () => {
    store.toggleFavorite('item-1');
    store.toggleFavorite('item-1');
    expect(store.favoriteIds()).not.toContain('item-1');
    expect(store.count()).toBe(0);
  });

  it('should correctly report isFavorite', () => {
    expect(store.isFavorite('item-1')).toBe(false);
    store.toggleFavorite('item-1');
    expect(store.isFavorite('item-1')).toBe(true);
  });

  it('should handle multiple favorites', () => {
    store.toggleFavorite('item-1');
    store.toggleFavorite('item-2');
    expect(store.count()).toBe(2);
    expect(store.isFavorite('item-1')).toBe(true);
    expect(store.isFavorite('item-2')).toBe(true);
  });

  it('should restore favorites from localStorage', () => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(['item-99']));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const freshStore = TestBed.inject(FavoritesStore);
    expect(freshStore.isFavorite('item-99')).toBe(true);
  });

  it('should ignore invalid localStorage data', () => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, 'not-json');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const freshStore = TestBed.inject(FavoritesStore);
    expect(freshStore.favoriteIds()).toEqual([]);
  });

  it('should ignore non-string array localStorage data', () => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([1, 2, 3]));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const freshStore = TestBed.inject(FavoritesStore);
    expect(freshStore.favoriteIds()).toEqual([]);
  });
});
