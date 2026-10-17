import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CartStore } from '@app/state/cart.store';
import { CartPage } from './cart-page';

function setup() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const store = TestBed.inject(CartStore);
  store.items.set([
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
  return { store, fixture, el: fixture.nativeElement as HTMLElement };
}

function fire(el: HTMLElement, type: string, x: number, y: number): void {
  const event = new Event(type, { bubbles: true });
  Object.assign(event, { pointerId: 1, pointerType: 'touch', clientX: x, clientY: y });
  el.dispatchEvent(event);
}

describe('CartPage accessibility', () => {
  it('includes the product name in the remove button accessible name', () => {
    const { el } = setup();
    const button = Array.from(el.querySelectorAll('button')).find(
      (b) => b.textContent.trim() === 'Remove',
    );

    expect(button?.getAttribute('aria-label')).toBe('Remove Burger from cart');
  });
});

describe('CartPage swipe to remove', () => {
  it('removes the item and announces it when swiped left past the threshold', () => {
    const { store, fixture, el } = setup();
    const row = el.querySelectorAll<HTMLElement>('.cart-row').item(0);
    fire(row, 'pointerdown', 300, 10);
    fire(row, 'pointermove', 100, 10);
    fire(row, 'pointerup', 100, 10);
    fixture.detectChanges();

    expect(store.items()).toEqual([]);
    expect(el.querySelector('[aria-live="polite"]')?.textContent).toContain(
      'Burger retiré du panier',
    );
  });

  it('keeps the item on a short swipe, and the Remove button still works', () => {
    const { store, fixture, el } = setup();
    const row = el.querySelectorAll<HTMLElement>('.cart-row').item(0);
    fire(row, 'pointerdown', 300, 10);
    fire(row, 'pointermove', 280, 10);
    fire(row, 'pointerup', 280, 10);
    expect(store.items().length).toBe(1);

    el.querySelectorAll<HTMLButtonElement>('.cart-row button').item(0).click();
    fixture.detectChanges();
    expect(store.items()).toEqual([]);
  });
});
