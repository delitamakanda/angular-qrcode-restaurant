import { effect, Injectable, signal } from '@angular/core';
import { Order } from '@app/core/models/order.model';

const ORDER_HISTORY_STORAGE_KEY = 'cashier-order-history';
export const ORDER_HISTORY_LIMIT = 50;

export interface OrderHistoryEntry {
  id: string;
  store_id: string;
  created_at: string;
  /** Copy of the order taken at payment time, used when the API no longer knows it. */
  order?: Order;
}

@Injectable({
  providedIn: 'root',
})
export class OrderHistoryStore {
  /** Orders placed on this device, most recent first, capped at `ORDER_HISTORY_LIMIT`. */
  readonly entries = signal<OrderHistoryEntry[]>([]);

  constructor() {
    this.restore();

    effect(() => {
      localStorage.setItem(ORDER_HISTORY_STORAGE_KEY, JSON.stringify(this.entries()));
    });
  }

  add(entry: OrderHistoryEntry): void {
    this.entries.update((entries) =>
      [entry, ...entries.filter((e) => e.id !== entry.id)].slice(0, ORDER_HISTORY_LIMIT),
    );
  }

  remove(id: string): void {
    this.entries.update((entries) => entries.filter((e) => e.id !== id));
  }

  clear(): void {
    this.entries.set([]);
  }

  private restore(): void {
    const stored = localStorage.getItem(ORDER_HISTORY_STORAGE_KEY);
    if (!stored) {
      return;
    }
    try {
      const parsed: unknown = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        return;
      }
      const seen = new Set<string>();
      const entries: OrderHistoryEntry[] = [];
      for (const item of parsed as unknown[]) {
        const entry = toEntry(item);
        if (entry && !seen.has(entry.id)) {
          seen.add(entry.id);
          entries.push(entry);
        }
      }
      this.entries.set(entries.slice(0, ORDER_HISTORY_LIMIT));
    } catch {
      this.entries.set([]);
    }
  }
}

function toEntry(value: unknown): OrderHistoryEntry | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const { id, store_id, created_at, order } = value as Record<string, unknown>;
  if (typeof id !== 'string' || typeof store_id !== 'string' || typeof created_at !== 'string') {
    return null;
  }
  return isOrderSnapshot(order, id)
    ? { id, store_id, created_at, order }
    : { id, store_id, created_at };
}

function isOrderSnapshot(value: unknown, id: string): value is Order {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const order = value as Record<string, unknown>;
  return order['id'] === id && Array.isArray(order['items']) && typeof order['total'] === 'number';
}
