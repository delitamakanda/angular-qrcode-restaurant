import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { provideTaiga } from '@taiga-ui/core';
import { OrderApiService } from '@app/core/api/order-api.service';
import { Order } from '@app/core/models/order.model';
import { OrderTrackingPage } from './order-tracking-page';

const ORDER = {
  id: 'order-1001',
  order_number: 'A001',
  status: 'accepted',
  total: 65,
  created_at: '2026-04-09T18:20:00.000Z',
  estimated_delivery_time: '2026-04-09T18:45:00.000Z',
} as Order;

describe('OrderTrackingPage', () => {
  const getOrder = vi.fn();

  async function render(url = '/store/demo/tracking/order-1001') {
    TestBed.configureTestingModule({
      providers: [
        provideTaiga(),
        provideRouter([{ path: 'store/:storeId/tracking/:orderId', component: OrderTrackingPage }]),
        { provide: OrderApiService, useValue: { getOrder } },
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    harness.detectChanges();
    return harness;
  }

  const el = (h: RouterTestingHarness) => h.fixture.nativeElement as HTMLElement;

  beforeEach(() => getOrder.mockReset());

  it('shows number, status label, total and a single h1', async () => {
    getOrder.mockReturnValue(of(ORDER));
    const root = el(await render());

    expect(getOrder).toHaveBeenCalledWith('order-1001');
    expect(root.querySelectorAll('h1')).toHaveLength(1);
    expect(root.textContent).toContain('A001');
    expect(root.textContent).toContain('Accepted');
    expect(root.textContent).toContain('$65.00');
    expect(root.textContent).toContain('Estimated Time');
    expect(root.querySelector('[aria-live="polite"][role="status"]')).not.toBeNull();
  });

  it('renders the status timeline with the current step', async () => {
    getOrder.mockReturnValue(of(ORDER));
    const root = el(await render());

    expect(root.querySelectorAll('app-order-status-timeline li')).toHaveLength(5);
    expect(root.querySelector('[aria-current="step"]')?.textContent).toContain('Accepted');
    expect(root.querySelectorAll('[role="status"]')).toHaveLength(1);
  });

  it('tolerates missing status, number, total and date', async () => {
    getOrder.mockReturnValue(of({ id: 'KKiF88EiUMA' } as Order));
    const root = el(await render());

    expect(root.textContent).toContain('KKiF88EiUMA');
    expect(root.textContent).toContain('Pending');
    expect(root.textContent).not.toContain('Total');
    expect(root.textContent).not.toContain('Placed');
  });

  it('shows the error state and retries', async () => {
    getOrder.mockReturnValueOnce(throwError(() => new Error('404')));
    const harness = await render('/store/demo/tracking/unknown');
    const root = el(harness);

    expect(root.querySelector('app-empty-state')).not.toBeNull();

    getOrder.mockReturnValue(of(ORDER));
    const retry = Array.from(root.querySelectorAll('button')).find((b) =>
      b.textContent.includes('Retry'),
    );
    retry?.click();
    harness.detectChanges();

    expect(getOrder).toHaveBeenCalledTimes(2);
    expect(root.textContent).toContain('A001');
  });

  it('reloads when the orderId param changes', async () => {
    getOrder.mockReturnValue(of(ORDER));
    const harness = await render();

    await harness.navigateByUrl('/store/demo/tracking/order-1002');

    expect(getOrder).toHaveBeenLastCalledWith('order-1002');
  });
});
