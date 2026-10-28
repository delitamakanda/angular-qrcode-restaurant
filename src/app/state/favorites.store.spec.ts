import { TestBed } from '@angular/core/testing';
import { FavoritesStore } from './favorites.store';

const KEY = 'cashier-favorites';

describe('FavoritesStore', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('toggles an id on and off', () => {
    const store = TestBed.inject(FavoritesStore);

    store.toggle('m1');
    expect(store.isFavorite('m1')).toBe(true);
    expect(store.ids()).toEqual(['m1']);

    store.toggle('m1');
    expect(store.isFavorite('m1')).toBe(false);
    expect(store.ids()).toEqual([]);
  });

  it('never stores duplicates', () => {
    const store = TestBed.inject(FavoritesStore);

    store.toggle('m1');
    store.toggle('m2');
    store.toggle('m1');
    store.toggle('m1');

    expect(store.ids()).toEqual(['m2', 'm1']);
  });

  it('persists to localStorage', () => {
    const store = TestBed.inject(FavoritesStore);
    store.toggle('m1');
    TestBed.tick();

    expect(JSON.parse(localStorage.getItem(KEY) ?? 'null')).toEqual(['m1']);
  });

  it('restores from localStorage without duplicates', () => {
    localStorage.setItem(KEY, JSON.stringify(['m1', 'm1', 'm2']));

    expect(TestBed.inject(FavoritesStore).ids()).toEqual(['m1', 'm2']);
  });

  it('falls back to an empty list on invalid JSON', () => {
    localStorage.setItem(KEY, 'not json');

    expect(TestBed.inject(FavoritesStore).ids()).toEqual([]);
  });

  it('ignores stored values that are not an array', () => {
    localStorage.setItem(KEY, '42');

    expect(TestBed.inject(FavoritesStore).ids()).toEqual([]);
  });

  it('starts empty without stored data', () => {
    expect(TestBed.inject(FavoritesStore).ids()).toEqual([]);
  });
});
