import { computed, effect, Injectable, signal } from '@angular/core';
import { CartItem } from '../core/models/cart.model';


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
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items()));
    });
  }

  addToCart(item: CartItem): void {
    this.items.update(items => [...items, item]);
  }

  removeFromCart(itemId: string): void {
    this.items.update(items => items.filter(item => item.id!== itemId));
  }

  updateQuantity(itemId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(itemId);
      return;
    }
    this.items.update(items => items.map(item => {
      if (item.id !== itemId) {
        return item;
      }
      const oldUnit = item.total_price / item.quantity;
      return {
        ...item,
        quantity,
        total_price: oldUnit * quantity,
      };
    }))
  }

  clearCart(): void {
    this.items.set([]);
    this.discount.set(0);
    this.fees.set(0);
  }

  restoreCart(): void {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!storedCart) {
      return;
    }
    try {
      const cartItems = JSON.parse(storedCart);
      this.items.set(cartItems);
    } catch {
      this.items.set([]);
    }
  }
}
