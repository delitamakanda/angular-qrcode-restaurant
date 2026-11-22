import { Injectable, computed, inject, signal } from '@angular/core';
import { OrderApiService } from '@app/core/api/order-api.service';
import {
  IN_PROGRESS_ORDER_STATUSES,
  ORDER_STATUS_LABELS,
} from '@app/core/constants/order.constants';
import { Order, OrderStatus } from '@app/core/models/order.model';

export const RECENT_ORDERS_LIMIT = 5;

export interface DashboardKpis {
  readonly orderCount: number;
  readonly revenue: number;
  readonly averageBasket: number;
  readonly inProgressCount: number;
}

/** Demo data may lack `status` / `created_at`: they are defaulted, never trusted. */
function statusOf(order: { readonly status?: OrderStatus }): OrderStatus {
  return order.status ?? 'pending';
}

@Injectable({ providedIn: 'root' })
export class AdminDashboardStore {
  private readonly orderApi = inject(OrderApiService);

  private readonly _orders = signal<readonly Order[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private requestId = 0;

  readonly orders = this._orders.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly kpis = computed<DashboardKpis>(() => {
    const orders = this._orders();
    const billable = orders.filter((order) => statusOf(order) !== 'cancelled');
    const revenue = billable.reduce((sum, order) => sum + order.total, 0);
    return {
      orderCount: orders.length,
      revenue,
      averageBasket: billable.length === 0 ? 0 : revenue / billable.length,
      inProgressCount: orders.filter((order) =>
        IN_PROGRESS_ORDER_STATUSES.includes(statusOf(order)),
      ).length,
    };
  });

  readonly statusCounts = computed(() => {
    const counts = Object.fromEntries(
      (Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((status) => [status, 0]),
    ) as Record<OrderStatus, number>;
    for (const order of this._orders()) counts[statusOf(order)]++;
    return (Object.keys(counts) as OrderStatus[]).map((status) => ({
      status,
      count: counts[status],
    }));
  });

  /** Most recent first; orders without a date come last. */
  readonly recentOrders = computed(() =>
    [...this._orders()]
      .sort((a, b) => {
        const left: string | undefined = a.created_at;
        const right: string | undefined = b.created_at;
        if (!left || !right) return left ? -1 : right ? 1 : 0;
        return right.localeCompare(left);
      })
      .slice(0, RECENT_ORDERS_LIMIT)
      .map((order) => ({ ...order, status: statusOf(order) })),
  );

  load(storeId: string): void {
    const currentRequest = ++this.requestId;
    this._error.set(null);
    this._loading.set(true);
    this.orderApi.getOrders(storeId).subscribe({
      next: (orders) => {
        if (currentRequest !== this.requestId) return;
        // Defensive: only count the orders of the requested store.
        this._orders.set(orders.filter((order) => order.store_id === storeId));
        this._loading.set(false);
      },
      error: () => {
        if (currentRequest !== this.requestId) return;
        this._orders.set([]);
        this._error.set('Could not load the orders.');
        this._loading.set(false);
      },
    });
  }
}
