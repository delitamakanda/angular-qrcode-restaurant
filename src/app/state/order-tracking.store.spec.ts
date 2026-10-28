import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { OrderApiService } from '@app/core/api/order-api.service';
import { Order } from '@app/core/models/order.model';
import { OrderTrackingStore } from './order-tracking.store';

const ORDER = { id: 'order-1', order_number: 'A001', status: 'accepted' } as Order;

describe('OrderTrackingStore', () => {
  const getOrder = vi.fn();

  function setup() {
    TestBed.configureTestingModule({
      providers: [{ provide: OrderApiService, useValue: { getOrder } }],
    });
    return TestBed.inject(OrderTrackingStore);
  }

  beforeEach(() => getOrder.mockReset());

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
});
