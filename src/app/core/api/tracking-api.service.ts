import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, takeWhile } from 'rxjs';
import { OrderApiService } from '@app/core/api/order-api.service';
import { APP_TOKEN_CONFIG } from '@app/core/config/app.token';
import { Order } from '@app/core/models/order.model';

export const POLL_INTERVAL_MS = 5_000;
export const MAX_POLL_BACKOFF_MS = 30_000;

const isTerminal = (order: Order): boolean =>
  order.status === 'completed' || order.status === 'cancelled';

@Injectable({
  providedIn: 'root',
})
export class TrackingApiService {
  private readonly orderApi = inject(OrderApiService);
  private readonly config = inject(APP_TOKEN_CONFIG);
  private readonly document = inject(DOCUMENT);

  /**
   * Streams an order until it reaches a terminal status (`completed` / `cancelled`).
   * Tries Server-Sent Events first and falls back to HTTP polling when the endpoint is
   * missing, `EventSource` is unavailable or the stream fails. Transient network errors
   * never reach the consumer: polling retries with a capped exponential backoff.
   * With `immediate: false` the first poll waits one interval (the caller already has the order).
   */
  watchOrder(orderId: string, options: { immediate?: boolean } = {}): Observable<Order> {
    const polling$ = this.poll(orderId, options.immediate ?? true);
    const source$ =
      typeof EventSource === 'undefined'
        ? polling$
        : this.stream(orderId).pipe(catchError(() => polling$));
    return source$.pipe(takeWhile((order) => !isTerminal(order), true));
  }

  private stream(orderId: string): Observable<Order> {
    return new Observable<Order>((subscriber) => {
      const source = new EventSource(`${this.config.BASE_API_URL}/orders/${orderId}/events`);
      source.onmessage = (event: MessageEvent<string>) => {
        try {
          subscriber.next(JSON.parse(event.data) as Order);
        } catch (error) {
          subscriber.error(error);
        }
      };
      source.onerror = () => {
        subscriber.error(new Error('Order event stream unavailable'));
      };
      return () => {
        source.close();
      };
    });
  }

  private poll(orderId: string, immediate: boolean): Observable<Order> {
    return new Observable<Order>((subscriber) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      let request: { unsubscribe(): void } | undefined;
      let failures = 0;
      let paused = false;

      const schedule = (delay: number): void => {
        timer = setTimeout(tick, delay);
      };

      const tick = (): void => {
        timer = undefined;
        if (this.document.visibilityState === 'hidden') {
          paused = true;
          return;
        }
        request = this.orderApi.getOrder(orderId, { silent: true }).subscribe({
          next: (order) => {
            failures = 0;
            subscriber.next(order);
            if (!isTerminal(order)) schedule(POLL_INTERVAL_MS);
          },
          error: () => {
            failures++;
            schedule(Math.min(POLL_INTERVAL_MS * 2 ** failures, MAX_POLL_BACKOFF_MS));
          },
        });
      };

      const onVisibilityChange = (): void => {
        if (!paused || this.document.visibilityState === 'hidden') return;
        paused = false;
        tick();
      };

      this.document.addEventListener('visibilitychange', onVisibilityChange);
      if (immediate) tick();
      else schedule(POLL_INTERVAL_MS);

      return () => {
        this.document.removeEventListener('visibilitychange', onVisibilityChange);
        if (timer !== undefined) clearTimeout(timer);
        request?.unsubscribe();
      };
    });
  }
}
