import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTaiga } from '@taiga-ui/core';
import { CartStore } from '@app/state/cart.store';
import { CartPage } from './cart-page';

function setup(empty = false) {
  TestBed.configureTestingModule({ providers: [provideRouter([]), provideTaiga()] });
  const store = TestBed.inject(CartStore);
  store.items.set(
    empty
      ? []
      : [
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
        ],
  );
  const fixture = TestBed.createComponent(CartPage);
  fixture.detectChanges();
  return { store, fixture, el: fixture.nativeElement as HTMLElement };
}

function removeButton(el: HTMLElement): HTMLButtonElement {
  const button = el.querySelector<HTMLButtonElement>('[aria-label="Remove Burger from cart"]');
  if (!button) {
    throw new Error('Remove button not found');
  }
  return button;
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

  it('renders stepper, Remove and Checkout as Taiga buttons', () => {
    const { el } = setup();
    const buttons = Array.from(el.querySelectorAll('button'));

    expect(buttons.length).toBe(4);
    expect(buttons.every((b) => b.hasAttribute('tuiButton'))).toBe(true);
  });
});

describe('CartPage empty state', () => {
  it('shows the empty state without total nor Checkout when the cart is empty', () => {
    const { el } = setup(true);

    expect(el.querySelector('app-empty-state')?.textContent).toContain('Your cart is empty');
    expect(el.querySelector('app-cart-summary')).toBeNull();
    expect(el.textContent).not.toContain('Checkout');
    expect(el.textContent).toContain('View menu');
  });

  it('does not show the empty state when the cart has items', () => {
    const { el } = setup();

    expect(el.querySelector('app-empty-state')).toBeNull();
    expect(el.textContent).toContain('Checkout');
  });
});

describe('CartPage summary', () => {
  it('shows the item count and total, and updates after a removal', () => {
    const { fixture, el } = setup();
    const summary = el.querySelector('app-cart-summary');

    expect(summary?.textContent).toContain('1 item');
    expect(summary?.textContent).toContain('$5.00');

    removeButton(el).click();
    fixture.detectChanges();

    expect(el.querySelector('app-cart-summary')).toBeNull();
  });

  it('navigates to checkout from the Checkout button', () => {
    const { fixture, el } = setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    el.querySelector<HTMLButtonElement>('app-cart-summary button')?.click();
    fixture.detectChanges();

    expect(navigate).toHaveBeenCalledWith(['../checkout'], expect.anything());
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

    removeButton(el).click();
    fixture.detectChanges();
    expect(store.items()).toEqual([]);
  });
});

describe('CartPage quantity stepper', () => {
  it('increments the quantity and updates the line, count and total', () => {
    const { store, fixture, el } = setup();

    el.querySelector<HTMLButtonElement>('[aria-label="Increase quantity of Burger"]')?.click();
    fixture.detectChanges();

    expect(store.items()[0]).toMatchObject({ quantity: 2, total_price: 10 });
    expect(el.querySelector('.cart-row')?.textContent).toContain('$10.00');
    expect(el.querySelector('app-cart-summary')?.textContent).toContain('2 items');
    expect(el.querySelector('app-cart-summary')?.textContent).toContain('$10.00');
  });

  it('decrements the quantity above 1', () => {
    const { store, fixture, el } = setup();
    store.updateQuantity('1', 3);
    fixture.detectChanges();

    el.querySelector<HTMLButtonElement>('[aria-label="Decrease quantity of Burger"]')?.click();
    fixture.detectChanges();

    expect(store.items()[0]).toMatchObject({ quantity: 2, total_price: 10 });
  });

  it('removes the line and announces it when decreasing from 1', () => {
    const { store, fixture, el } = setup();

    el.querySelector<HTMLButtonElement>('[aria-label="Decrease quantity of Burger"]')?.click();
    fixture.detectChanges();

    expect(store.items()).toEqual([]);
    expect(el.querySelector('.cart-page__live')?.textContent).toContain('Burger retiré du panier');
  });
});
