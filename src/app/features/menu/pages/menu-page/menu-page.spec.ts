import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideTaiga } from '@taiga-ui/core';
import { MenuStore } from '@app/state/menu.store';
import { ShopStore } from '@app/state/shop.store';
import { MenuPage } from './menu-page';

describe('MenuPage search', () => {
  const setSearchTerm = vi.fn();

  function render() {
    setSearchTerm.mockReset();
    TestBed.configureTestingModule({
      imports: [MenuPage],
      providers: [
        provideTaiga(),
        { provide: ActivatedRoute, useValue: {} },
        { provide: ShopStore, useValue: { selectedMode: signal(null) } },
        {
          provide: MenuStore,
          useValue: { searchTerm: signal(''), filteredItems: signal([]), setSearchTerm },
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
});
