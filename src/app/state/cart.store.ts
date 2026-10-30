import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { CartItem } from '@app/core/models/cart.model';
import { ShopStore } from './shop.store';

/** Legacy single-cart key, migrated to the `demo` restaurant on first load. */
const LEGACY_CART_STORAGE_KEY = 'cashier-cart';
const LEGACY_STORE_ID = 'demo';
const cartStorageKey = (storeId: string): string => `${LEGACY_CART_STORAGE_KEY}:${storeId}`;

@Injectable({
  providedIn: 'root',
})
export class CartStore {
  private readonly shopStore = inject(ShopStore);
  private activeStoreId: string | null = null;

  readonly items = signal<CartItem[]>([]);
  readonly discount = signal<number>(0);
  readonly fees = signal<number>(0);

  readonly count = computed(() => this.items().reduce((sum, item) => sum + item.quantity, 0));

  readonly subtotal = computed(() => this.items().reduce((sum, item) => sum + item.total_price, 0));

  readonly total = computed(() => this.subtotal() + this.fees() - this.discount());

  constructor() {
    effect(() => {
      const storeId = this.shopStore.store()?.id ?? null;
      untracked(() => {
        this.switchStore(storeId);
      });
    });

    effect(() => {
      this.persistCart(this.items());
    });
  }

  addToCart(item: CartItem): void {
    this.items.update((items) => [...items, item]);
  }

  removeFromCart(itemId: string): void {
    this.items.update((items) => items.filter((item) => item.id !== itemId));
  }

  updateQuantity(itemId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(itemId);
      return;
    }
    this.items.update((items) =>
      items.map((item) => {
        if (item.id !== itemId) {
          return item;
        }
        const oldUnit = item.total_price / item.quantity;
        return {
          ...item,
          quantity,
          total_price: oldUnit * quantity,
        };
      }),
    );
  }

  clearCart(): void {
    this.items.set([]);
    this.discount.set(0);
    this.fees.set(0);
  }

  /** Each restaurant owns its cart: swap the in-memory items when the store changes. */
  private switchStore(storeId: string | null): void {
    if (storeId === this.activeStoreId) {
      return;
    }
    this.activeStoreId = storeId;
    this.discount.set(0);
    this.fees.set(0);
    this.items.set(storeId ? this.restoreCart(storeId) : []);
  }

  private restoreCart(storeId: string): CartItem[] {
    try {
      let stored = localStorage.getItem(cartStorageKey(storeId));
      if (stored === null && storeId === LEGACY_STORE_ID) {
        stored = localStorage.getItem(LEGACY_CART_STORAGE_KEY);
        localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
      }
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed.filter(isCartItem) : [];
    } catch {
      return [];
    }
  }

  private persistCart(items: CartItem[]): void {
    const storeId = this.activeStoreId;
    if (!storeId) {
      return;
    }
    try {
      localStorage.setItem(cartStorageKey(storeId), JSON.stringify(items));
    } catch {
      // Storage unavailable or quota exceeded: the cart simply stays in memory.
    }
  }
}

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const item = value as Record<string, unknown>;
  return (
    typeof item['id'] === 'string' &&
    typeof item['menu_item_id'] === 'string' &&
    typeof item['name'] === 'string' &&
    Number.isInteger(item['quantity']) &&
    (item['quantity'] as number) > 0 &&
    Number.isFinite(item['unit_base_price']) &&
    Number.isFinite(item['total_price'])
  );
}
