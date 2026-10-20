import { TestBed } from '@angular/core/testing';
import { MenuApiService } from '@app/core/api/menu-api.service';
import { MenuItem } from '@app/core/models/menu-item.model';
import { MenuStore } from './menu.store';

describe('MenuStore filteredItems', () => {
  const item = (id: string, name: string, category_id: string): MenuItem => ({
    id,
    name,
    category_id,
    base_price: 100,
    is_sold_out: false,
  });

  function setup() {
    TestBed.configureTestingModule({
      providers: [{ provide: MenuApiService, useValue: {} }],
    });
    const store = TestBed.inject(MenuStore);
    store.items.set([
      item('1', 'Milk Tea', 'tea'),
      item('2', 'Green Tea', 'tea'),
      item('3', 'Tea Egg', 'snack'),
      item('4', 'Fries', 'snack'),
    ]);
    return store;
  }

  it('returns everything when no category is selected', () => {
    expect(setup().filteredItems().length).toBe(4);
  });

  it('filters by category alone', () => {
    const store = setup();
    store.setSelectedCategory('snack');

    expect(store.filteredItems().map((i) => i.id)).toEqual(['3', '4']);
  });

  it('combines category and search', () => {
    const store = setup();
    store.setSelectedCategory('snack');
    store.setSearchTerm('tea');

    expect(store.filteredItems().map((i) => i.id)).toEqual(['3']);
  });

  it('returns to the full list when the category is reset to null', () => {
    const store = setup();
    store.setSelectedCategory('tea');
    store.setSelectedCategory(null);

    expect(store.filteredItems().length).toBe(4);
  });
});

describe('MenuStore itemsByCategory', () => {
  const item = (id: string, name: string, category_id: string): MenuItem => ({
    id,
    name,
    category_id,
    base_price: 100,
    is_sold_out: false,
  });

  function setup() {
    TestBed.configureTestingModule({
      providers: [{ provide: MenuApiService, useValue: {} }],
    });
    const store = TestBed.inject(MenuStore);
    store.categories.set([
      { id: 'tea', name: 'Tea', sort_order: 1 },
      { id: 'empty', name: 'Empty', sort_order: 2 },
      { id: 'snack', name: 'Snacks', sort_order: 3 },
    ]);
    store.items.set([
      item('1', 'Fries', 'snack'),
      item('2', 'Milk Tea', 'tea'),
      item('3', 'Tea Egg', 'snack'),
    ]);
    return store;
  }

  it('groups items by category following the categories order and skips empty ones', () => {
    const sections = setup().itemsByCategory();

    expect(sections.map((s) => s.category.id)).toEqual(['tea', 'snack']);
    expect(sections[1].items.map((i) => i.id)).toEqual(['1', '3']);
  });

  it('respects the search term and drops sections that become empty', () => {
    const store = setup();
    store.setSearchTerm('egg');

    expect(store.itemsByCategory().map((s) => [s.category.id, s.items.length])).toEqual([
      ['snack', 1],
    ]);
  });
});
