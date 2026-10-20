import { TestBed } from '@angular/core/testing';
import { MenuCategory } from '@app/core/models/menu-item.model';
import { MenuCategorySelection } from './menu-category-selection';

describe('MenuCategorySelection', () => {
  const categories: MenuCategory[] = [
    { id: 'tea', name: 'Tea', sort_order: 1 },
    { id: 'snack', name: 'Snacks', sort_order: 2 },
  ];
  const scrollIntoView = vi.fn();

  beforeEach(() => {
    scrollIntoView.mockReset();
    Element.prototype.scrollIntoView = scrollIntoView;
  });

  async function render(selectedId: string | null = null) {
    const fixture = TestBed.createComponent(MenuCategorySelection);
    fixture.componentRef.setInput('categories', categories);
    fixture.componentRef.setInput('selectedId', selectedId);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      el,
      buttons: Array.from(el.querySelectorAll<HTMLButtonElement>('button')),
    };
  }

  it('renders "Tout" followed by the categories in order inside a named group', async () => {
    const { el, buttons } = await render();

    expect(buttons.map((b) => b.textContent.trim())).toEqual(['Tout', 'Tea', 'Snacks']);
    expect(el.querySelector('[role="group"]')?.getAttribute('aria-label')).toBe(
      'Catégories du menu',
    );
  });

  it('marks "Tout" as the only pressed entry when nothing is selected', async () => {
    const { buttons } = await render(null);

    expect(buttons.map((b) => b.getAttribute('aria-pressed'))).toEqual(['true', 'false', 'false']);
  });

  it('marks the selected category as the only pressed entry', async () => {
    const { buttons } = await render('snack');

    expect(buttons.map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'false', 'true']);
  });

  it('emits null for "Tout" and the id for a category', async () => {
    const { fixture, buttons } = await render('tea');
    const emitted: (string | null)[] = [];
    fixture.componentInstance.selectionChange.subscribe((id) => emitted.push(id));

    buttons[0].click();
    buttons[2].click();

    expect(emitted).toEqual([null, 'snack']);
  });

  it('scrolls the active entry into view', async () => {
    const { buttons } = await render('snack');

    expect(scrollIntoView).toHaveBeenCalled();
    expect(scrollIntoView.mock.contexts.at(-1)).toBe(buttons[2]);
    expect(scrollIntoView).toHaveBeenLastCalledWith(
      expect.objectContaining({ inline: 'center', block: 'nearest' }),
    );
  });
});
