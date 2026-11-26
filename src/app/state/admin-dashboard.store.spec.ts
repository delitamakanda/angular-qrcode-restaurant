import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { OrderApiService } from '@app/core/api/order-api.service';
import { Order, OrderStatus } from '@app/core/models/order.model';
import { AdminDashboardStore } from './admin-dashboard.store';

function order(id: string, status: OrderStatus, total: number, created_at: string): Order {
  return {
    id,
    store_id: 'demo',
    status,
    order_number: id,
    mode: 'take_away',
    items: [],
    created_at,
    total,
    discount: 0,
    fees: 0,
    subtotal: total,
  };
}

describe('AdminDashboardStore', () => {
  const getOrders = vi.fn();

  function setup() {
    TestBed.configureTestingModule({
      providers: [{ provide: OrderApiService, useValue: { getOrders } }],
    });
    return TestBed.inject(AdminDashboardStore);
  }

  beforeEach(() => getOrders.mockReset());

  it('computes KPIs excluding cancelled orders from revenue and basket', () => {
    getOrders.mockReturnValue(
      of([
        order('a', 'pending', 10, '2026-01-01T10:00:00Z'),
        order('b', 'completed', 20, '2026-01-01T11:00:00Z'),
        order('c', 'cancelled', 100, '2026-01-01T12:00:00Z'),
      ]),
    );
    const store = setup();
    store.load('demo');
    expect(getOrders).toHaveBeenCalledWith('demo');
    expect(store.kpis()).toEqual({
      orderCount: 3,
      revenue: 30,
      averageBasket: 15,
      inProgressCount: 1,
    });
  });

  it('never yields NaN when orders have no total (falls back to subtotal, then items)', () => {
    const line = { total_price: 60 } as Order['items'][number];
    const noTotal = { ...order('x', 'pending', 0, '2026-01-01T10:00:00Z'), items: [line, line] };
    delete (noTotal as { total?: number }).total;
    delete (noTotal as { subtotal?: number }).subtotal;
    const noTotalButSubtotal = { ...order('y', 'pending', 40, '2026-01-01T11:00:00Z') };
    delete (noTotalButSubtotal as { total?: number }).total;
    getOrders.mockReturnValue(of([noTotal, noTotalButSubtotal]));
    const store = setup();
    store.load('demo');
    expect(store.kpis().revenue).toBe(160);
    expect(store.kpis().averageBasket).toBe(80);
  });

  it('does not divide by zero without orders', () => {
    getOrders.mockReturnValue(of([]));
    const store = setup();
    store.load('demo');
    expect(store.kpis().averageBasket).toBe(0);
  });

  it('counts every status, including empty ones', () => {
    getOrders.mockReturnValue(of([order('a', 'ready', 1, '2026-01-01T10:00:00Z')]));
    const store = setup();
    store.load('demo');
    expect(store.statusCounts()).toHaveLength(6);
    expect(store.statusCounts().find((s) => s.status === 'ready')?.count).toBe(1);
    expect(store.statusCounts().find((s) => s.status === 'completed')?.count).toBe(0);
  });

  it('keeps the 5 most recent orders, undated ones last, missing status as pending', () => {
    const undated = { ...order('x', 'ready', 1, ''), created_at: undefined, status: undefined };
    getOrders.mockReturnValue(
      of([
        undated,
        ...['1', '2', '3', '4', '5'].map((n) => order(n, 'ready', 1, `2026-01-0${n}T00:00:00Z`)),
      ]),
    );
    const store = setup();
    store.load('demo');
    expect(store.recentOrders().map((o) => o.id)).toEqual(['5', '4', '3', '2', '1']);
    expect(store.statusCounts().find((s) => s.status === 'pending')?.count).toBe(1);
  });

  it('ignores orders of another store', () => {
    getOrders.mockReturnValue(
      of([
        order('a', 'ready', 1, '2026-01-01T00:00:00Z'),
        { ...order('b', 'ready', 1, ''), store_id: 'x' },
      ]),
    );
    const store = setup();
    store.load('demo');
    expect(store.orders()).toHaveLength(1);
  });

  it('exposes loading and error states', () => {
    const response = new Subject<Order[]>();
    getOrders.mockReturnValueOnce(response);
    const store = setup();
    store.load('demo');
    expect(store.loading()).toBe(true);
    response.error(new Error('boom'));
    expect(store.loading()).toBe(false);
    expect(store.error()).not.toBeNull();

    getOrders.mockReturnValueOnce(throwError(() => new Error('x')));
    getOrders.mockReturnValueOnce(of([]));
    store.load('demo');
    store.load('demo');
    expect(store.error()).toBeNull();
  });
});
