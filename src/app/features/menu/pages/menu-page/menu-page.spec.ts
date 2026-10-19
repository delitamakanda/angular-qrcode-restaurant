import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideTaiga } from '@taiga-ui/core';
import { MenuStore } from '@app/state/menu.store';
import { ShopStore } from '@app/state/shop.store';
import { MenuPage } from './menu-page';

describe('MenuPage search', () => {
  const setSearchTerm = vi.fn();

  function render(isLoading = false, items: unknown[] = []) {
    setSearchTerm.mockReset();
    TestBed.configureTestingModule({
      imports: [MenuPage],
      providers: [
        provideTaiga(),
        { provide: ActivatedRoute, useValue: {} },
        { provide: ShopStore, useValue: { selectedMode: signal(null) } },
        {
          provide: MenuStore,
          useValue: {
            searchTerm: signal(''),
            filteredItems: signal(items),
            isLoading: signal(isLoading),
            setSearchTerm,
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(MenuPage);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders a labelled Taiga textfield with a search icon', () => {
    const el = render();

    expect(el.querySelector('tui-textfield input#menu-search')).not.toBeNull();
    expect(el.querySelector('label[for="menu-search"]')?.textContent).toContain('Search a product');
    expect(el.querySelector('tui-icon')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('forwards typed text to the menu store', () => {
    const el = render();
    const input = el.querySelector<HTMLInputElement>('#menu-search');
    if (!input) {
      throw new Error('Missing search input');
    }

    input.value = 'pizza';
    input.dispatchEvent(new Event('input'));

    expect(setSearchTerm).toHaveBeenCalledWith('pizza');
  });

  it('shows 6 skeletons and a busy status while loading', () => {
    const el = render(true);
    const grid = el.querySelector('.menu-page__grid');

    expect(el.querySelectorAll('app-menu-item-card-skeleton').length).toBe(6);
    expect(el.querySelectorAll('app-menu-item-card').length).toBe(0);
    expect(grid?.getAttribute('aria-busy')).toBe('true');
    expect(grid?.querySelector('[role="status"]')?.textContent).toContain('Loading menu');
    expect(el.querySelector('#menu-search')).not.toBeNull();
  });

  it('loads the first two card images eagerly and the rest lazily', () => {
    const items = ['a', 'b', 'c', 'd'].map((id) => ({ id, name: id, base_price: 100 }));
    const el = render(false, items);

    expect(
      Array.from(el.querySelectorAll('app-menu-item-card img')).map((i) =>
        i.getAttribute('loading'),
      ),
    ).toEqual(['eager', 'eager', 'lazy', 'lazy']);
  });

  it('shows the cards and no skeleton once loaded', () => {
    const items = [{ id: 'a', name: 'Tea', description: '', base_price: 100 }];
    const el = render(false, items);

    expect(el.querySelectorAll('app-menu-item-card-skeleton').length).toBe(0);
    expect(el.querySelectorAll('app-menu-item-card').length).toBe(1);
    expect(el.querySelector('.menu-page__grid')?.getAttribute('aria-busy')).toBe('false');
  });
});
