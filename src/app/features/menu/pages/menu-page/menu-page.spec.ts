import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideTaiga } from '@taiga-ui/core';
import { MenuApiService } from '@app/core/api/menu-api.service';
import { MenuStore } from '@app/state/menu.store';
import { ShopStore } from '@app/state/shop.store';
import { MenuPage } from './menu-page';

interface TestItem {
  id: string;
  name: string;
  category_id: string;
  base_price: number;
}

describe('MenuPage', () => {
  const setSearchTerm = vi.fn();
  const scrollIntoView = vi.fn();
  const categories = [
    { id: 'tea', name: 'Tea', sort_order: 1 },
    { id: 'snack', name: 'Snacks', sort_order: 2 },
  ];

  const item = (id: string, category_id: string): TestItem => ({
    id,
    name: id,
    category_id,
    base_price: 100,
  });

  function sectionsOf(items: TestItem[]) {
    return categories
      .map((category) => ({ category, items: items.filter((i) => i.category_id === category.id) }))
      .filter((s) => s.items.length > 0);
  }

  async function render(
    isLoading = false,
    items: TestItem[] = [],
    allItems: TestItem[] = items,
    term = '',
  ) {
    setSearchTerm.mockReset();
    scrollIntoView.mockReset();
    Element.prototype.scrollIntoView = scrollIntoView;
    const activeCategoryId = signal<string | null>(null);
    TestBed.configureTestingModule({
      imports: [MenuPage],
      providers: [
        provideTaiga(),
        { provide: ActivatedRoute, useValue: {} },
        { provide: MenuApiService, useValue: {} },
        { provide: ShopStore, useValue: { selectedMode: signal(null) } },
        {
          provide: MenuStore,
          useValue: {
            searchTerm: signal(term),
            items: signal(allItems),
            filteredItems: signal(items),
            itemsByCategory: signal(sectionsOf(items)),
            isLoading: signal(isLoading),
            activeCategoryId,
            setSearchTerm,
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(MenuPage);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement, activeCategoryId };
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders a labelled Taiga textfield with a search icon', async () => {
    const { el } = await render();

    expect(el.querySelector('app-product-search input#menu-search')).not.toBeNull();
    expect(el.querySelector('label[for="menu-search"]')?.textContent).toContain('Search a product');
    expect(el.querySelector('tui-icon')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('wraps the search field in a nav container placed before the sections', async () => {
    const { el } = await render();
    const nav = el.querySelector('.menu-page__nav');
    const sections = el.querySelector('.menu-page__sections');

    expect(nav?.querySelector('#menu-search')).not.toBeNull();
    expect(sections).not.toBeNull();
    expect(nav?.compareDocumentPosition(sections as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('forwards typed text to the menu store after the debounce', async () => {
    const { el } = await render();
    const input = el.querySelector<HTMLInputElement>('#menu-search');
    if (!input) {
      throw new Error('Missing search input');
    }
    vi.useFakeTimers();
    try {
      input.value = 'pizza';
      input.dispatchEvent(new Event('input'));
      expect(setSearchTerm).not.toHaveBeenCalled();
      vi.advanceTimersByTime(250);

      expect(setSearchTerm).toHaveBeenCalledWith('pizza');
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows the no-results state when a loaded menu has no match, and clears the search', async () => {
    const { el } = await render(false, [], [item('a', 'tea')], 'xyz');
    const empty = el.querySelector('.menu-page__empty');

    expect(empty?.textContent).toContain('No results for “xyz”');
    expect(el.querySelector('[aria-live="polite"]')?.textContent).toContain('No results');
    el.querySelector<HTMLButtonElement>('.menu-page__empty-action')?.click();

    expect(setSearchTerm).toHaveBeenCalledWith('');
    expect(document.activeElement?.id).toBe('menu-search');
  });

  it('does not show the no-results state while loading or when the menu is empty', async () => {
    const loading = await render(true, [], [item('a', 'tea')], 'xyz');
    expect(loading.el.querySelector('.menu-page__empty')).toBeNull();
    TestBed.resetTestingModule();
    const empty = await render(false, [], [], 'xyz');
    expect(empty.el.querySelector('.menu-page__empty')).toBeNull();
  });

  it('announces the number of results when a term is set', async () => {
    const { el } = await render(false, [item('a', 'tea')], undefined, 'tea');

    expect(el.querySelector('[aria-live="polite"]')?.textContent).toContain('1 result');
  });

  it('shows 6 skeletons and a busy status while loading', async () => {
    const { el } = await render(true);
    const sections = el.querySelector('.menu-page__sections');

    expect(el.querySelectorAll('app-menu-item-card-skeleton').length).toBe(6);
    expect(el.querySelectorAll('app-menu-item-card').length).toBe(0);
    expect(sections?.getAttribute('aria-busy')).toBe('true');
    expect(sections?.querySelector('[role="status"]')?.textContent).toContain('Loading menu');
    expect(el.querySelector('#menu-search')).not.toBeNull();
  });

  it('loads the first two card images eagerly and the rest lazily', async () => {
    const { el } = await render(false, [
      item('a', 'tea'),
      item('b', 'tea'),
      item('c', 'snack'),
      item('d', 'snack'),
    ]);

    expect(
      Array.from(el.querySelectorAll('app-menu-item-card img')).map((i) =>
        i.getAttribute('loading'),
      ),
    ).toEqual(['eager', 'eager', 'lazy', 'lazy']);
  });

  it('renders one titled section with an anchor id per non-empty category', async () => {
    const { el } = await render(false, [item('a', 'snack'), item('b', 'snack')]);
    const sections = Array.from(el.querySelectorAll('section.menu-page__section'));

    expect(sections.map((s) => s.id)).toEqual(['category-snack']);
    expect(sections[0].querySelector('h2')?.textContent).toContain('Snacks');
    expect(sections[0].querySelectorAll('app-menu-item-card').length).toBe(2);
  });

  it('lists only the rendered categories in the navigation', async () => {
    const { el } = await render(false, [item('a', 'snack')]);
    const buttons = el.querySelectorAll('app-menu-category-selection button');

    expect(Array.from(buttons).map((b) => b.textContent.trim())).toEqual(['Snacks']);
  });

  it('scrolls to the section and marks it active when a chip is clicked', async () => {
    const { el, activeCategoryId } = await render(false, [item('a', 'tea'), item('b', 'snack')]);
    scrollIntoView.mockClear();

    el.querySelectorAll<HTMLButtonElement>('app-menu-category-selection button')[1].click();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.contexts[0]).toBe(el.querySelector('#category-snack'));
    expect(scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'smooth', block: 'start' }),
    );
    expect(activeCategoryId()).toBe('snack');
  });

  it('scrolls instantly when reduced motion is preferred', async () => {
    const original = window.matchMedia.bind(window);
    const spy = vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => {
      const mql = original(query);
      return query.includes('prefers-reduced-motion')
        ? new Proxy(mql, {
            get: (t, p) => (p === 'matches' ? true : (Reflect.get(t, p) as unknown)),
          })
        : mql;
    });
    try {
      const { el } = await render(false, [item('a', 'tea')]);
      scrollIntoView.mockClear();

      el.querySelector<HTMLButtonElement>('app-menu-category-selection button')?.click();

      expect(scrollIntoView).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'auto' }));
    } finally {
      spy.mockRestore();
    }
  });

  describe('scroll-spy', () => {
    type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void;

    function stubObserver() {
      const instances: { callback: Callback; observe: () => void; disconnect: () => void }[] = [];
      class FakeObserver {
        observe = vi.fn();
        disconnect = vi.fn();
        constructor(public callback: Callback) {
          instances.push(this);
        }
      }
      vi.stubGlobal('IntersectionObserver', FakeObserver);
      return instances;
    }

    it('sets the active category from intersecting sections', async () => {
      const instances = stubObserver();
      const { el, activeCategoryId } = await render(false, [item('a', 'tea'), item('b', 'snack')]);

      instances.at(-1)?.callback([
        { target: el.querySelector<HTMLElement>('#category-tea') ?? el, isIntersecting: false },
        { target: el.querySelector<HTMLElement>('#category-snack') ?? el, isIntersecting: true },
      ]);

      expect(activeCategoryId()).toBe('snack');
    });

    it('disconnects the observer on destroy', async () => {
      const instances = stubObserver();
      const { fixture } = await render(false, [item('a', 'tea')]);

      expect(instances.length).toBeGreaterThan(0);
      fixture.destroy();

      expect(instances.at(-1)?.disconnect).toHaveBeenCalled();
    });

    it('does not fail when IntersectionObserver is unavailable', async () => {
      vi.stubGlobal('IntersectionObserver', undefined);

      const { el } = await render(false, [item('a', 'tea')]);

      expect(el.querySelectorAll('section.menu-page__section').length).toBe(1);
    });
  });

  it('shows the cards and no skeleton once loaded', async () => {
    const { el } = await render(false, [item('a', 'tea')]);

    expect(el.querySelectorAll('app-menu-item-card-skeleton').length).toBe(0);
    expect(el.querySelectorAll('app-menu-item-card').length).toBe(1);
    expect(el.querySelector('.menu-page__sections')?.getAttribute('aria-busy')).toBe('false');
  });
});
