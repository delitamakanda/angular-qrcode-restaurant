import { TestBed } from '@angular/core/testing';
import { CartItem } from '@app/core/models/cart.model';
import { CartStore } from './cart.store';

const KEY = 'cashier-cart';

const makeItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  id: 'c1',
  menu_item_id: 'm1',
  name: 'Burger',
  quantity: 2,
  unit_base_price: 5,
  total_price: 10,
  ...overrides,
});

const stored = (): CartItem[] => JSON.parse(localStorage.getItem(KEY) ?? 'null') as CartItem[];

describe('CartStore persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes the cart to localStorage after addToCart', () => {
    const store = TestBed.inject(CartStore);
    store.addToCart(makeItem());
    TestBed.tick();

    expect(stored()).toEqual([makeItem()]);
  });

  it('restores a valid stored cart', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify([makeItem(), makeItem({ id: 'c2', quantity: 1, total_price: 5 })]),
    );

    const store = TestBed.inject(CartStore);

    expect(store.items().length).toBe(2);
    expect(store.count()).toBe(3);
    expect(store.subtotal()).toBe(15);
  });

  it('starts empty without stored data', () => {
    expect(TestBed.inject(CartStore).items()).toEqual([]);
  });

  it.each(['not json', '42', '{}', 'null'])('falls back to an empty cart for %s', (value) => {
    localStorage.setItem(KEY, value);

    expect(TestBed.inject(CartStore).items()).toEqual([]);
  });

  it('ignores malformed lines and keeps valid ones', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify([
        makeItem(),
        null,
        'x',
        { ...makeItem(), id: 5 },
        makeItem({ quantity: 0 }),
        makeItem({ quantity: 1.5 }),
        { ...makeItem(), total_price: '10' },
        { ...makeItem(), unit_base_price: null },
        { id: 'c9' },
      ]),
    );

    expect(TestBed.inject(CartStore).items()).toEqual([makeItem()]);
  });

  it('persists quantity updates and removals', () => {
    const store = TestBed.inject(CartStore);
    store.addToCart(makeItem());
    store.addToCart(makeItem({ id: 'c2' }));
    store.updateQuantity('c1', 4);
    TestBed.tick();
    expect(stored()[0]).toMatchObject({ id: 'c1', quantity: 4, total_price: 20 });

    store.removeFromCart('c2');
    TestBed.tick();
    expect(stored().map((i) => i.id)).toEqual(['c1']);
  });

  it('clearCart empties the cart and the stored value', () => {
    const store = TestBed.inject(CartStore);
    store.addToCart(makeItem());
    store.discount.set(3);
    store.fees.set(2);
    TestBed.tick();

    store.clearCart();
    TestBed.tick();

    expect(store.items()).toEqual([]);
    expect(store.discount()).toBe(0);
    expect(store.fees()).toBe(0);
    expect(stored()).toEqual([]);

    TestBed.resetTestingModule();
    expect(TestBed.inject(CartStore).items()).toEqual([]);
  });

  it('does not throw when localStorage reads fail', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });

    expect(TestBed.inject(CartStore).items()).toEqual([]);
  });

  it('does not throw when localStorage writes fail', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    const store = TestBed.inject(CartStore);
    store.addToCart(makeItem());

    expect(() => {
      TestBed.tick();
    }).not.toThrow();
    expect(store.items().length).toBe(1);
  });
});
