import { Injectable, inject, signal } from '@angular/core';
import { OrderApiService } from '@app/core/api/order-api.service';
import { Order } from '@app/core/models/order.model';

@Injectable({ providedIn: 'root' })
export class OrderTrackingStore {
  private readonly orderApi = inject(OrderApiService);

  private readonly _order = signal<Order | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private requestId = 0;

  readonly order = this._order.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  load(orderId: string): void {
    const currentRequest = ++this.requestId;
    this._order.set(null);
    this._error.set(null);
    this._loading.set(true);

    this.orderApi.getOrder(orderId).subscribe({
      next: (order) => {
        if (currentRequest !== this.requestId) return;
        this._order.set(order);
        this._loading.set(false);
      },
      error: () => {
        if (currentRequest !== this.requestId) return;
        this._error.set('Order not found or network error.');
        this._loading.set(false);
      },
    });
  }
}
