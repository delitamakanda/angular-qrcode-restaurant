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
