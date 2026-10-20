import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideTaiga } from '@taiga-ui/core';
import { MenuStore } from '@app/state/menu.store';
import { ShopStore } from '@app/state/shop.store';
import { MenuPage } from './menu-page';

describe('MenuPage search', () => {
  const setSearchTerm = vi.fn();
  const setSelectedCategory = vi.fn();

  function render(
    isLoading = false,
    items: unknown[] = [],
    allItems: unknown[] = items,
    term = '',
  ) {
    setSearchTerm.mockReset();
    setSelectedCategory.mockReset();
    Element.prototype.scrollIntoView = vi.fn();
    TestBed.configureTestingModule({
      imports: [MenuPage],
      providers: [
        provideTaiga(),
        { provide: ActivatedRoute, useValue: {} },
        { provide: ShopStore, useValue: { selectedMode: signal(null) } },
        {
          provide: MenuStore,
          useValue: {
            searchTerm: signal(term),
            items: signal(allItems),
            filteredItems: signal(items),
            isLoading: signal(isLoading),
            categories: signal([{ id: 'tea', name: 'Tea', sort_order: 1 }]),
            selectedCategoryId: signal<string | null>(null),
            setSearchTerm,
            setSelectedCategory,
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(MenuPage);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders a labelled search field through app-product-search', () => {
    const el = render();

    expect(el.querySelector('app-product-search input#menu-search')).not.toBeNull();
    expect(el.querySelector('label[for="menu-search"]')?.textContent).toContain('Search a product');
    expect(el.querySelector('tui-icon')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('wraps the search field in a nav container placed before the grid', () => {
    const el = render();
    const nav = el.querySelector('.menu-page__nav');
    const grid = el.querySelector('.menu-page__grid');

    expect(nav?.querySelector('#menu-search')).not.toBeNull();
    expect(grid).not.toBeNull();
    expect(nav?.compareDocumentPosition(grid as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('forwards typed text to the menu store after the debounce', () => {
    vi.useFakeTimers();
    try {
      const el = render();
      const input = el.querySelector<HTMLInputElement>('#menu-search');
      if (!input) {
        throw new Error('Missing search input');
      }

      input.value = 'pizza';
      input.dispatchEvent(new Event('input'));
      expect(setSearchTerm).not.toHaveBeenCalled();
      vi.advanceTimersByTime(250);

      expect(setSearchTerm).toHaveBeenCalledWith('pizza');
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows the no-results state when a loaded menu has no match, and clears the search', () => {
    const all = [{ id: 'a', name: 'Tea', base_price: 100 }];
    const el = render(false, [], all, 'xyz');
    const empty = el.querySelector('.menu-page__empty');

    expect(empty?.textContent).toContain('No results for “xyz”');
    expect(el.querySelector('[aria-live="polite"]')?.textContent).toContain('No results');
    el.querySelector<HTMLButtonElement>('.menu-page__empty-action')?.click();

    expect(setSearchTerm).toHaveBeenCalledWith('');
    expect(document.activeElement?.id).toBe('menu-search');
  });

  it('does not show the no-results state while loading or when the menu is empty', () => {
    expect(render(true, [], [{ id: 'a' }], 'xyz').querySelector('.menu-page__empty')).toBeNull();
    TestBed.resetTestingModule();
    expect(render(false, [], [], 'xyz').querySelector('.menu-page__empty')).toBeNull();
  });

  it('announces the number of results when a term is set', () => {
    const items = [{ id: 'a', name: 'Tea', description: '', base_price: 100 }];
    const el = render(false, items, items, 'tea');

    expect(el.querySelector('[aria-live="polite"]')?.textContent).toContain('1 result');
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

  it('renders the category selection and forwards the chosen category to the store', () => {
    const el = render();
    const buttons = el.querySelectorAll<HTMLButtonElement>('app-menu-category-selection button');

    expect(buttons.length).toBe(2);
    buttons[1].click();

    expect(setSelectedCategory).toHaveBeenCalledWith('tea');
  });

  it('shows the cards and no skeleton once loaded', () => {
    const items = [{ id: 'a', name: 'Tea', description: '', base_price: 100 }];
    const el = render(false, items);

    expect(el.querySelectorAll('app-menu-item-card-skeleton').length).toBe(0);
    expect(el.querySelectorAll('app-menu-item-card').length).toBe(1);
    expect(el.querySelector('.menu-page__grid')?.getAttribute('aria-busy')).toBe('false');
  });
});
