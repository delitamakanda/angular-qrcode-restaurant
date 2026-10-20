import { TestBed } from '@angular/core/testing';
import { MenuApiService } from '@app/core/api/menu-api.service';
import { MenuItem } from '@app/core/models/menu-item.model';
import { MenuStore } from './menu.store';

const item = (id: string, extra: Partial<MenuItem>): MenuItem =>
  ({ id, name: id, base_price: 100, category_id: 'c1', ...extra }) as MenuItem;

describe('MenuStore filteredItems', () => {
  let store: MenuStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: MenuApiService, useValue: {} }],
    });
    store = TestBed.inject(MenuStore);
    store.items.set([
      item('Pizza', { description: 'Cheesy', tags: ['italian'] }),
      item('Latte', { description: 'Milky coffee', category_id: 'c2' }),
      item('Soup', { tags: ['Vegan'], category_id: 'c2' }),
    ]);
  });

  const names = () => store.filteredItems().map((i) => i.id);

  it('returns every item for an empty term', () => {
    expect(names()).toEqual(['Pizza', 'Latte', 'Soup']);
  });

  it('matches name, description and tags case-insensitively', () => {
    store.setSearchTerm('PIZ');
    expect(names()).toEqual(['Pizza']);
    store.setSearchTerm('coffee');
    expect(names()).toEqual(['Latte']);
    store.setSearchTerm('vegan');
    expect(names()).toEqual(['Soup']);
  });

  it('combines the search with the selected category', () => {
    store.setSearchTerm('i');
    store.setSelectedCategory('c2');
    expect(names()).toEqual(['Latte']);
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
