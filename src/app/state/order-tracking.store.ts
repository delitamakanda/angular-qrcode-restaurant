import { Injectable, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { OrderApiService } from '@app/core/api/order-api.service';
import { TrackingApiService } from '@app/core/api/tracking-api.service';
import { Order } from '@app/core/models/order.model';

@Injectable({ providedIn: 'root' })
export class OrderTrackingStore {
  private readonly orderApi = inject(OrderApiService);
  private readonly trackingApi = inject(TrackingApiService);

  private readonly _order = signal<Order | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private requestId = 0;
  private watch: Subscription | null = null;

  readonly order = this._order.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  load(orderId: string): void {
    this.stop();
    const currentRequest = ++this.requestId;
    this._order.set(null);
    this._error.set(null);
    this._loading.set(true);

    this.orderApi.getOrder(orderId).subscribe({
      next: (order) => {
        if (currentRequest !== this.requestId) return;
        this._order.set(order);
        this._loading.set(false);
        this.watchUpdates(orderId, currentRequest);
      },
      error: () => {
        if (currentRequest !== this.requestId) return;
        this._error.set('Order not found or network error.');
        this._loading.set(false);
      },
    });
  }

  /** Stops live updates (timers, event stream). Safe to call repeatedly. */
  stop(): void {
    this.watch?.unsubscribe();
    this.watch = null;
  }

  private watchUpdates(orderId: string, currentRequest: number): void {
    this.watch = this.trackingApi.watchOrder(orderId, { immediate: false }).subscribe({
      next: (order) => {
        if (currentRequest !== this.requestId) return;
        this._order.set(order);
      },
      // Transient failures are retried by the service: the displayed order is kept.
      error: () => undefined,
    });
  }
}
