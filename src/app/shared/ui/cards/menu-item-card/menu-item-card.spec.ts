import { TestBed } from '@angular/core/testing';
import { NotificationService } from '@app/core/services/notification.service';
import { CartStore } from '@app/state/cart.store';
import { MenuItemCard } from './menu-item-card';

const item = {
  id: 'm1',
  name: 'Burger',
  category_id: 'c1',
  base_price: 5,
  is_sold_out: false,
};

describe('MenuItemCard', () => {
  const addToCart = vi.fn();
  const success = vi.fn();

  beforeEach(() => {
    addToCart.mockClear();
    success.mockClear();
    TestBed.configureTestingModule({
      providers: [
        { provide: CartStore, useValue: { addToCart } },
        { provide: NotificationService, useValue: { success } },
      ],
    });
  });

  function create() {
    const fixture = TestBed.createComponent(MenuItemCard);
    fixture.componentRef.setInput('item', item);
    fixture.detectChanges();
    return fixture;
  }

  it('includes the product name in the add button accessible name', () => {
    const button = (create().nativeElement as HTMLElement).querySelector('button');

    expect(button?.getAttribute('aria-label')).toBe('Add to cart: Burger');
    expect(button?.hasAttribute('tuiButton')).toBe(true);
  });

  describe('badge', () => {
    function render(overrides: Record<string, unknown>) {
      const fixture = TestBed.createComponent(MenuItemCard);
      fixture.componentRef.setInput('item', { ...item, ...overrides });
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      return {
        badges: Array.from(el.querySelectorAll('app-product-badge')).map((b) =>
          b.textContent.trim(),
        ),
        button: el.querySelector('button'),
      };
    }

    it('shows Popular', () => {
      expect(render({ tags: ['popular'] }).badges).toEqual(['Popular']);
    });

    it('shows New', () => {
      expect(render({ tags: ['new'] }).badges).toEqual(['New']);
    });

    it('shows Sold out without the sold-out tag and hides the button', () => {
      const { badges, button } = render({ is_sold_out: true });

      expect(badges).toEqual(['Sold out']);
      expect(button).toBeNull();
    });

    it('prioritises Sold out over New', () => {
      expect(render({ is_sold_out: true, tags: ['new'] }).badges).toEqual(['Sold out']);
    });

    it('prioritises New over Popular', () => {
      expect(render({ tags: ['popular', 'new'] }).badges).toEqual(['New']);
    });

    it('shows no badge for empty or missing tags', () => {
      expect(render({ tags: [] }).badges).toEqual([]);
      expect(render({}).badges).toEqual([]);
    });

    it('keeps the add button for available products', () => {
      expect(render({ tags: ['popular'] }).button).not.toBeNull();
    });
  });

  it('adds to the cart and notifies the user', () => {
    (create().nativeElement as HTMLElement).querySelector('button')?.click();

    expect(addToCart).toHaveBeenCalledTimes(1);
    expect(success).toHaveBeenCalledWith('Burger added to cart');
  });
});
