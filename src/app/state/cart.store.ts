import { computed, effect, Injectable, signal } from '@angular/core';
import { CartItem } from '@app/core/models/cart.model';

const CART_STORAGE_KEY = 'cashier-cart';

@Injectable({
  providedIn: 'root',
})
export class CartStore {
  readonly items = signal<CartItem[]>([]);
  readonly discount = signal<number>(0);
  readonly fees = signal<number>(0);

  readonly count = computed(() => this.items().reduce((sum, item) => sum + item.quantity, 0));

  readonly subtotal = computed(() => this.items().reduce((sum, item) => sum + item.total_price, 0));

  readonly total = computed(() => this.subtotal() + this.fees() - this.discount());

  constructor() {
    this.restoreCart();

    effect(() => {
      this.persistCart();
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

  private restoreCart(): void {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (!stored) {
        return;
      }
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        this.items.set(parsed.filter(isCartItem));
      }
    } catch {
      this.items.set([]);
    }
  }

  private persistCart(): void {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items()));
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
