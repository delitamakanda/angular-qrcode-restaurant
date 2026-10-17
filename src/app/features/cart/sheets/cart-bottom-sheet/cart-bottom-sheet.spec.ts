import { TestBed } from '@angular/core/testing';
import { provideTaiga } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { CartStore } from '@app/state/cart.store';
import { CartBottomSheet } from './cart-bottom-sheet';

const item = {
  id: '1',
  menu_item_id: 'm1',
  quantity: 2,
  name: 'Burger',
  note: '',
  unit_base_price: 5,
  selected_options: [],
  total_price: 10,
};

function setup() {
  const completeWith = vi.fn();
  TestBed.configureTestingModule({
    providers: [provideTaiga(), { provide: POLYMORPHEUS_CONTEXT, useValue: { completeWith } }],
  });
  const cart = TestBed.inject(CartStore);
  cart.items.set([item]);
  const fixture = TestBed.createComponent(CartBottomSheet);
  fixture.detectChanges();
  return { fixture, cart, completeWith, el: fixture.nativeElement as HTMLElement };
}

describe('CartBottomSheet', () => {
  it('renders the lines and the total from the cart store', () => {
    const { el } = setup();

    expect(el.textContent).toContain('Burger');
    expect(el.textContent).toContain('2 x');
    expect(el.querySelector('footer')?.textContent).toContain('Total:');
  });

  it('removes a line and closes once the cart is empty', async () => {
    const { fixture, completeWith, el } = setup();

    const remove = el.querySelector<HTMLButtonElement>('[aria-label="Remove Burger from cart"]');
    remove?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(el.textContent).not.toContain('Burger');
    expect(completeWith).toHaveBeenCalledWith(undefined);
  });

  it('updates the quantity through the store', () => {
    const { fixture, cart, el } = setup();

    el.querySelector<HTMLButtonElement>('[aria-label="Increase quantity of Burger"]')?.click();
    fixture.detectChanges();

    expect(cart.items()[0].quantity).toBe(3);
  });

  it('closes with the checkout result', () => {
    const { completeWith, el } = setup();

    const checkout = Array.from(el.querySelectorAll('button')).find(
      (b) => b.textContent.trim() === 'Checkout',
    );
    checkout?.click();

    expect(completeWith).toHaveBeenCalledWith('checkout');
  });
});
