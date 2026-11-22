import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { provideTaiga } from '@taiga-ui/core';
import { OrderApiService } from '@app/core/api/order-api.service';
import { Order } from '@app/core/models/order.model';
import { AdminDashboardPage } from './admin-dashboard-page';

const sample = (id: string, status: Order['status'], total: number, at: string): Order => ({
  id,
  store_id: 'demo',
  status,
  order_number: id,
  mode: 'dine_in',
  items: [],
  created_at: at,
  total,
  discount: 0,
  fees: 0,
  subtotal: total,
});

describe('AdminDashboardPage', () => {
  const getOrders = vi.fn();

  async function render() {
    TestBed.configureTestingModule({
      imports: [AdminDashboardPage],
      providers: [
        provideTaiga(),
        provideRouter([]),
        { provide: OrderApiService, useValue: { getOrders } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'demo' } } },
        },
      ],
    });
    const fixture = TestBed.createComponent(AdminDashboardPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => getOrders.mockReset());

  it('renders KPIs, 6 status counters and latest orders', async () => {
    getOrders.mockReturnValue(
      of([
        sample('A1', 'pending', 10, '2026-01-01T10:00:00Z'),
        sample('A2', 'cancelled', 5, '2026-01-01T11:00:00Z'),
      ]),
    );
    const el = await render();
    expect(el.querySelector('h1')?.textContent).toContain('Dashboard');
    expect(el.querySelectorAll('app-kpi-card')).toHaveLength(4);
    expect(el.textContent).toContain('$10.00');
    expect(el.querySelectorAll('.status-breakdown__item')).toHaveLength(6);
    expect(el.querySelectorAll('.recent-orders__item')).toHaveLength(2);
  });

  it('shows the empty state', async () => {
    getOrders.mockReturnValue(of([]));
    const el = await render();
    expect(el.textContent).toContain('No orders');
    expect(el.querySelector('app-kpi-card')).toBeNull();
  });

  it('shows the error and retries', async () => {
    getOrders.mockReturnValueOnce(throwError(() => new Error('x')));
    const el = await render();
    expect(el.querySelector('[role="alert"]')).not.toBeNull();
    getOrders.mockReturnValue(of([sample('A1', 'ready', 10, '2026-01-01T10:00:00Z')]));
    el.querySelector<HTMLButtonElement>('[role="alert"] button')?.click();
    expect(getOrders).toHaveBeenCalledTimes(2);
  });
});
