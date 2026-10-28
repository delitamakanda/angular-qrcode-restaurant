import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Subject, of, throwError } from 'rxjs';
import { provideTaiga } from '@taiga-ui/core';
import { OrderApiService } from '@app/core/api/order-api.service';
import { Order } from '@app/core/models/order.model';
import { OrderConfirmationPage } from './order-confirmation-page';

const ORDER: Order = {
  id: 'order-1',
  store_id: 'demo',
  order_number: 'A003',
  status: 'pending',
  mode: 'dine_in',
  items: [],
  subtotal: 65,
  discount: 0,
  fees: 0,
  total: 65,
  created_at: '2026-04-09T18:20:00.000Z',
};

describe('OrderConfirmationPage', () => {
  const getOrder = vi.fn();

  async function render() {
    TestBed.configureTestingModule({
      providers: [
        provideTaiga(),
        provideRouter([
          { path: 'store/:storeId/confirmation/:orderId', component: OrderConfirmationPage },
        ]),
        { provide: OrderApiService, useValue: { getOrder } },
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/store/demo/confirmation/order-1');
    harness.detectChanges();
    return harness;
  }

  beforeEach(() => getOrder.mockReset());

  it('shows a loading status, then the order', async () => {
    const response = new Subject<Order>();
    getOrder.mockReturnValue(response);
    const harness = await render();
    const el = harness.fixture.nativeElement as HTMLElement;

    expect(el.querySelector('[role="status"]')).not.toBeNull();

    response.next(ORDER);
    harness.detectChanges();

    expect(getOrder).toHaveBeenCalledWith('order-1');
    expect(el.querySelector('[role="status"]')).toBeNull();
    expect(el.querySelector('h1')?.textContent).toContain('Order Confirmed');
    expect(el.textContent).toContain('A003');
    expect(el.textContent).toContain('Pending');
    expect(el.textContent).toContain('$65.00');
  });

  it('links to tracking and back to the menu', async () => {
    getOrder.mockReturnValue(of(ORDER));
    const harness = await render();
    const el = harness.fixture.nativeElement as HTMLElement;
    const hrefs = new Map(
      Array.from(el.querySelectorAll('a')).map((a) => [
        a.textContent.trim(),
        a.getAttribute('href'),
      ]),
    );

    expect(hrefs.get('Track My Order')).toBe('/store/demo/tracking/order-1');
    expect(hrefs.get('Back to Menu')).toBe('/store/demo/menu');
  });

  it('shows an alert with a menu link when the request fails', async () => {
    getOrder.mockReturnValue(throwError(() => new Error('404')));
    const harness = await render();
    const el = harness.fixture.nativeElement as HTMLElement;

    expect(el.querySelector('[role="alert"]')).not.toBeNull();
    expect(el.querySelector('h1')).toBeNull();
    expect(el.querySelector('a')?.getAttribute('href')).toBe('/store/demo/menu');
  });
});
