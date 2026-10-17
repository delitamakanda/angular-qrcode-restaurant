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
  });

  it('adds to the cart and notifies the user', () => {
    (create().nativeElement as HTMLElement).querySelector('button')?.click();

    expect(addToCart).toHaveBeenCalledTimes(1);
    expect(success).toHaveBeenCalledWith('Burger added to cart');
  });
});
