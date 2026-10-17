import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CartStore } from '@app/state/cart.store';
import { CartPage } from './cart-page';

describe('CartPage accessibility', () => {
  it('includes the product name in the remove button accessible name', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    TestBed.inject(CartStore).items.set([
      {
        id: '1',
        menu_item_id: 'm1',
        quantity: 1,
        name: 'Burger',
        note: '',
        unit_base_price: 5,
        selected_options: [],
        total_price: 5,
      },
    ]);
    const fixture = TestBed.createComponent(CartPage);
    fixture.detectChanges();

    const button = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((b) => b.textContent.trim() === 'Remove');

    expect(button?.getAttribute('aria-label')).toBe('Remove Burger from cart');
  });
});
