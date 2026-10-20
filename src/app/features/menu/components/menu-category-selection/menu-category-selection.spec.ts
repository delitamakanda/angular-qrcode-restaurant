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

  async function render(activeId: string | null = null) {
    const fixture = TestBed.createComponent(MenuCategorySelection);
    fixture.componentRef.setInput('categories', categories);
    fixture.componentRef.setInput('activeId', activeId);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      el,
      buttons: Array.from(el.querySelectorAll<HTMLButtonElement>('button')),
    };
  }

  it('renders one chip per category in order inside a named nav', async () => {
    const { el, buttons } = await render();

    expect(buttons.map((b) => b.textContent.trim())).toEqual(['Tea', 'Snacks']);
    expect(el.querySelector('nav')?.getAttribute('aria-label')).toBe('Catégories du menu');
  });

  it('sets aria-current only on the active chip', async () => {
    const { buttons } = await render('snack');

    expect(buttons.map((b) => b.getAttribute('aria-current'))).toEqual([null, 'true']);
  });

  it('marks no chip as current when nothing is active', async () => {
    const { buttons } = await render(null);

    expect(buttons.map((b) => b.getAttribute('aria-current'))).toEqual([null, null]);
  });

  it('emits the category id on click', async () => {
    const { fixture, buttons } = await render('tea');
    const emitted: string[] = [];
    fixture.componentInstance.categorySelected.subscribe((id) => emitted.push(id));

    buttons[1].click();
    buttons[0].click();

    expect(emitted).toEqual(['snack', 'tea']);
  });

  it('scrolls the active chip into view', async () => {
    const { buttons } = await render('snack');

    expect(scrollIntoView).toHaveBeenCalled();
    expect(scrollIntoView.mock.contexts.at(-1)).toBe(buttons[1]);
    expect(scrollIntoView).toHaveBeenLastCalledWith(
      expect.objectContaining({ inline: 'center', block: 'nearest' }),
    );
  });
});
