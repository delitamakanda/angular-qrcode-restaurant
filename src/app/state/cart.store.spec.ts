import { TestBed } from '@angular/core/testing';
import { CartItem } from '@app/core/models/cart.model';
import { Store } from '@app/core/models/store.model';
import { CartStore } from './cart.store';
import { ShopStore } from './shop.store';

const LEGACY_KEY = 'cashier-cart';
const KEY = 'cashier-cart:demo';

const makeItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  id: 'c1',
  menu_item_id: 'm1',
  name: 'Burger',
  quantity: 2,
  unit_base_price: 5,
  total_price: 10,
  ...overrides,
});

const makeStore = (id: string): Store => ({
  id,
  name: id,
  currency: 'EUR',
  is_open: true,
  supported_modes: ['dine_in'],
});

const stored = (key = KEY): CartItem[] =>
  JSON.parse(localStorage.getItem(key) ?? 'null') as CartItem[];

/** Injects the cart with a loaded store, like the app does after `storeLoadedGuard`. */
function createCart(storeId: string | null = 'demo') {
  const shop = TestBed.inject(ShopStore);
  const cart = TestBed.inject(CartStore);
  const switchTo = (id: string) => {
    shop.store.set(makeStore(id));
    TestBed.tick();
  };
  if (storeId) {
    switchTo(storeId);
  }
  return { cart, shop, switchTo };
}

describe('CartStore persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes the cart to localStorage after addToCart', () => {
    const { cart } = createCart();
    cart.addToCart(makeItem());
    TestBed.tick();

    expect(stored()).toEqual([makeItem()]);
  });

  it('restores a valid stored cart', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify([makeItem(), makeItem({ id: 'c2', quantity: 1, total_price: 5 })]),
    );

    const { cart } = createCart();

    expect(cart.items().length).toBe(2);
    expect(cart.count()).toBe(3);
    expect(cart.subtotal()).toBe(15);
  });

  it('starts empty without stored data', () => {
    expect(createCart().cart.items()).toEqual([]);
  });

  it.each(['not json', '42', '{}', 'null'])('falls back to an empty cart for %s', (value) => {
    localStorage.setItem(KEY, value);

    expect(createCart().cart.items()).toEqual([]);
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

    expect(createCart().cart.items()).toEqual([makeItem()]);
  });

  it('persists quantity updates and removals', () => {
    const { cart } = createCart();
    cart.addToCart(makeItem());
    cart.addToCart(makeItem({ id: 'c2' }));
    cart.updateQuantity('c1', 4);
    TestBed.tick();
    expect(stored()[0]).toMatchObject({ id: 'c1', quantity: 4, total_price: 20 });

    cart.removeFromCart('c2');
    TestBed.tick();
    expect(stored().map((i) => i.id)).toEqual(['c1']);
  });

  it('clearCart empties the cart and the stored value', () => {
    const { cart } = createCart();
    cart.addToCart(makeItem());
    cart.discount.set(3);
    cart.fees.set(2);
    TestBed.tick();

    cart.clearCart();
    TestBed.tick();

    expect(cart.items()).toEqual([]);
    expect(cart.discount()).toBe(0);
    expect(cart.fees()).toBe(0);
    expect(stored()).toEqual([]);

    TestBed.resetTestingModule();
    expect(createCart().cart.items()).toEqual([]);
  });

  it('does not throw when localStorage reads fail', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });

    expect(createCart().cart.items()).toEqual([]);
  });

  it('does not throw when localStorage writes fail', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    const { cart } = createCart();
    cart.addToCart(makeItem());

    expect(() => {
      TestBed.tick();
    }).not.toThrow();
    expect(cart.items().length).toBe(1);
  });
});

describe('CartStore per restaurant', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('gives each restaurant its own cart and restores it when coming back', () => {
    const { cart, switchTo } = createCart('demo');
    cart.addToCart(makeItem());
    TestBed.tick();

    switchTo('sushi-zen');
    expect(cart.items()).toEqual([]);

    cart.addToCart(makeItem({ id: 'z1' }));
    TestBed.tick();
    expect(stored('cashier-cart:sushi-zen').map((i) => i.id)).toEqual(['z1']);
    expect(stored().map((i) => i.id)).toEqual(['c1']);

    switchTo('demo');
    expect(cart.items().map((i) => i.id)).toEqual(['c1']);
  });

  it('resets discount and fees when switching restaurant', () => {
    const { cart, switchTo } = createCart('demo');
    cart.discount.set(3);
    cart.fees.set(2);

    switchTo('sushi-zen');

    expect(cart.discount()).toBe(0);
    expect(cart.fees()).toBe(0);
  });

  it('migrates the legacy cart to the demo restaurant', () => {
    localStorage.setItem(LEGACY_KEY, JSON.stringify([makeItem()]));

    const { cart } = createCart('demo');
    TestBed.tick();

    expect(cart.items()).toEqual([makeItem()]);
    expect(stored()).toEqual([makeItem()]);
    expect(localStorage.getItem(LEGACY_KEY)).toBeNull();
  });

  it('does not hand the legacy cart to another restaurant', () => {
    localStorage.setItem(LEGACY_KEY, JSON.stringify([makeItem()]));

    expect(createCart('sushi-zen').cart.items()).toEqual([]);
    expect(localStorage.getItem(LEGACY_KEY)).not.toBeNull();
  });

  it('does not persist anything before a store is loaded', () => {
    const { cart } = createCart(null);
    cart.addToCart(makeItem());
    TestBed.tick();

    expect(localStorage.length).toBe(0);
  });
});
