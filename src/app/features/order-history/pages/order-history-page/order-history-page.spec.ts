import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { provideTaiga } from '@taiga-ui/core';
import { routes } from '@app/app.routes';
import { OrderApiService } from '@app/core/api/order-api.service';
import { Order, OrderStatus } from '@app/core/models/order.model';
import { OrderHistoryStore } from '@app/state/order-history.store';
import { ShopStore } from '@app/state/shop.store';
import { OrderHistoryPage } from './order-history-page';

function order(id: string, status: OrderStatus, created_at: string): Order {
  return {
    id,
    store_id: 'demo',
    status,
    order_number: `N-${id}`,
    mode: 'take_away',
    items: [{ quantity: 2 }, { quantity: 1 }] as Order['items'],
    created_at,
    total: 12.5,
    discount: 0,
    fees: 0,
    subtotal: 12.5,
  };
}

// The errorInterceptor turns a 404 into this string.
const notFound = () => throwError(() => 'Page not found');
const networkError = () => throwError(() => new HttpErrorResponse({ status: 0 }));

describe('OrderHistoryPage', () => {
  const getOrder = vi.fn();

  async function render(ids: string[]) {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [OrderHistoryPage],
      providers: [
        provideTaiga(),
        provideRouter([]),
        { provide: OrderApiService, useValue: { getOrder } },
        { provide: ShopStore, useValue: { store: signal({ id: 'demo' }) } },
      ],
    });
    const history = TestBed.inject(OrderHistoryStore);
    for (const id of [...ids].reverse()) {
      history.add({ id, store_id: 'demo', created_at: '2026-01-01T00:00:00Z' });
    }
    history.add({ id: 'other', store_id: 'elsewhere', created_at: '2026-01-01T00:00:00Z' });
    const fixture = TestBed.createComponent(OrderHistoryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement, history };
  }

  beforeEach(() => getOrder.mockReset());

  it('shows the empty state with a link to the menu', async () => {
    const { el } = await render([]);

    expect(el.textContent).toContain('No orders yet');
    expect(el.querySelector('a[href$="menu"]')).not.toBeNull();
    expect(getOrder).not.toHaveBeenCalled();
  });

  it('lists orders of the current store, newest first, with the right links', async () => {
    const orders: Record<string, Order> = {
      a: order('a', 'completed', '2026-01-01T10:00:00Z'),
      b: order('b', 'preparing', '2026-01-02T10:00:00Z'),
    };
    getOrder.mockImplementation((id: string) => of(orders[id]));

    const { el } = await render(['a', 'b']);
    const links = Array.from(el.querySelectorAll<HTMLAnchorElement>('ul li a'));

    expect(getOrder).not.toHaveBeenCalledWith('other');
    expect(links.map((l) => l.textContent)).toEqual([
      expect.stringContaining('N-b'),
      expect.stringContaining('N-a'),
    ]);
    expect(links[0].getAttribute('href')).toMatch(/tracking\/b$/);
    expect(links[1].getAttribute('href')).toMatch(/confirmation\/a$/);
    expect(links[0].getAttribute('aria-label')).toContain('N-b');
    expect(links[0].textContent).toContain('3 items');
    expect(links[0].textContent).toContain('Take away');
    expect(links[0].textContent).toContain('Preparing');
    expect(links[0].textContent).toContain('$12.50');
  });

  it('keeps an order that is not found as an "unavailable" row', async () => {
    getOrder.mockImplementation((id: string) =>
      id === 'gone' ? notFound() : of(order(id, 'ready', '2026-01-02T10:00:00Z')),
    );

    const { el, history } = await render(['gone', 'ok1', 'ok2']);

    expect(history.entries().map((e) => e.id)).toEqual(
      expect.arrayContaining(['gone', 'ok1', 'ok2']),
    );
    expect(el.querySelectorAll('ul li')).toHaveLength(3);
    expect(el.querySelectorAll('ul li a')).toHaveLength(2);
    expect(el.textContent).toContain('Details unavailable');
    expect(el.textContent).toContain('Order gone');
    expect(el.querySelector('[role=alert]')).toBeNull();
    expect(getOrder).toHaveBeenCalledWith('gone', { silent: true });
  });

  it('lists unavailable rows instead of the empty state when every order is 404', async () => {
    getOrder.mockImplementation(() => notFound());

    const { el } = await render(['a', 'b']);

    expect(el.querySelectorAll('ul li')).toHaveLength(2);
    expect(el.textContent).not.toContain('No orders yet');
  });

  it('removes an unavailable row only on explicit request', async () => {
    getOrder.mockImplementation(() => notFound());
    const { fixture, el, history } = await render(['a', 'b']);

    el.querySelector<HTMLButtonElement>('ul li button')?.click();
    fixture.detectChanges();

    expect(el.querySelectorAll('ul li')).toHaveLength(1);
    expect(history.entries().map((e) => e.id)).toHaveLength(2); // one left + "other"
  });

  it('shows an error and reloads on retry', async () => {
    getOrder.mockImplementation(() => networkError());
    const { fixture, el, history } = await render(['a']);

    expect(el.querySelector('[role=alert]')?.textContent).toContain('could not load');
    expect(history.entries().map((e) => e.id)).toContain('a');

    getOrder.mockImplementation(() => of(order('a', 'completed', '2026-01-01T10:00:00Z')));
    el.querySelector<HTMLButtonElement>('[role=alert] button')?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(el.querySelector('[role=alert]')).toBeNull();
    expect(el.querySelectorAll('ul li')).toHaveLength(1);
  });

  it('clears the history only after confirmation', async () => {
    getOrder.mockImplementation((id: string) => of(order(id, 'completed', '2026-01-01T10:00:00Z')));
    const { fixture, el, history } = await render(['a']);
    const click = (text: string) => {
      Array.from(el.querySelectorAll('button'))
        .find((b) => b.textContent.trim() === text)
        ?.click();
      fixture.detectChanges();
    };

    click('Clear history');
    expect(el.querySelector('[role=alertdialog]')).not.toBeNull();
    click('Cancel');
    expect(history.entries().length).toBeGreaterThan(0);

    click('Clear history');
    click('Clear');
    expect(history.entries()).toEqual([]);
    expect(el.textContent).toContain('No orders yet');
  });

  it('is registered as a lazy child route of store/:storeId', async () => {
    const shop = routes.find((r) => r.path === 'store/:storeId');
    const child = shop?.children?.find((r) => r.path === 'orders');
    const load = child?.loadComponent as () => Promise<unknown>;

    expect(await load()).toBe(OrderHistoryPage);
  });
});
