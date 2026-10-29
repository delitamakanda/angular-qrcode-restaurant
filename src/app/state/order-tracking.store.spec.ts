import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { OrderApiService } from '@app/core/api/order-api.service';
import { TrackingApiService } from '@app/core/api/tracking-api.service';
import { Order } from '@app/core/models/order.model';
import { OrderTrackingStore } from './order-tracking.store';

const ORDER = { id: 'order-1', order_number: 'A001', status: 'accepted' } as Order;

describe('OrderTrackingStore', () => {
  const getOrder = vi.fn();
  const watchOrder = vi.fn();

  function setup() {
    TestBed.configureTestingModule({
      providers: [
        { provide: OrderApiService, useValue: { getOrder } },
        { provide: TrackingApiService, useValue: { watchOrder } },
      ],
    });
    return TestBed.inject(OrderTrackingStore);
  }

  beforeEach(() => {
    getOrder.mockReset();
    watchOrder.mockReset();
    watchOrder.mockReturnValue(new Subject<Order>());
  });

  it('loads an order and resets loading', () => {
    getOrder.mockReturnValue(of(ORDER));
    const store = setup();

    store.load('order-1');

    expect(getOrder).toHaveBeenCalledWith('order-1');
    expect(store.order()).toEqual(ORDER);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('exposes an error and no order on HTTP failure', () => {
    getOrder.mockReturnValue(throwError(() => new Error('404')));
    const store = setup();

    store.load('unknown');

    expect(store.order()).toBeNull();
    expect(store.loading()).toBe(false);
    expect(store.error()).not.toBeNull();
  });

  it('reloads with another id and ignores stale responses', () => {
    const first = new Subject<Order>();
    getOrder.mockReturnValueOnce(first).mockReturnValueOnce(of({ ...ORDER, id: 'order-2' }));
    const store = setup();

    store.load('order-1');
    expect(store.loading()).toBe(true);
    store.load('order-2');
    first.next(ORDER);

    expect(store.order()?.id).toBe('order-2');
  });

  it('updates the order on each live emission', () => {
    const updates = new Subject<Order>();
    getOrder.mockReturnValue(of(ORDER));
    watchOrder.mockReturnValue(updates);
    const store = setup();

    store.load('order-1');
    updates.next({ ...ORDER, status: 'preparing' });

    expect(watchOrder).toHaveBeenCalledWith('order-1', { immediate: false });
    expect(store.order()?.status).toBe('preparing');
  });

  it('stop() unsubscribes from live updates', () => {
    const updates = new Subject<Order>();
    getOrder.mockReturnValue(of(ORDER));
    watchOrder.mockReturnValue(updates);
    const store = setup();

    store.load('order-1');
    expect(updates.observed).toBe(true);
    store.stop();

    expect(updates.observed).toBe(false);
  });

  it('switches the live stream when the orderId changes', () => {
    const first = new Subject<Order>();
    const second = new Subject<Order>();
    getOrder.mockReturnValue(of(ORDER));
    watchOrder.mockReturnValueOnce(first).mockReturnValueOnce(second);
    const store = setup();

    store.load('order-1');
    store.load('order-2');

    expect(first.observed).toBe(false);
    expect(second.observed).toBe(true);
  });

  it('keeps the loaded order when the live stream errors', () => {
    getOrder.mockReturnValue(of(ORDER));
    watchOrder.mockReturnValue(throwError(() => new Error('offline')));
    const store = setup();

    store.load('order-1');

    expect(store.order()).toEqual(ORDER);
    expect(store.error()).toBeNull();
  });
});
