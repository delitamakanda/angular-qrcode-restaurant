import { TestBed } from '@angular/core/testing';
import { Order } from '@app/core/models/order.model';
import { OrderConfirmationCard } from './order-confirmation-card';

const ORDER: Order = {
  id: 'order-1',
  store_id: 'demo',
  order_number: 'A003',
  status: 'accepted',
  mode: 'take_away',
  items: [
    {
      id: 'cart-1',
      menu_item_id: 'item-1',
      name: 'Classic Milk Tea',
      quantity: 2,
      unit_base_price: 55,
      selected_options: [
        { group_id: 'g1', option_id: 'o1', label: 'Large', price_delta: 10 },
        { group_id: 'g2', option_id: 'o2', label: 'Less ice', price_delta: 0 },
      ],
      total_price: 130,
    },
  ],
  subtotal: 130,
  discount: 10,
  fees: 5,
  total: 125,
  created_at: '2026-04-09T18:20:00.000Z',
};

function render(order: Order) {
  const fixture = TestBed.createComponent(OrderConfirmationCard);
  fixture.componentRef.setInput('order', order);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('OrderConfirmationCard', () => {
  it('renders order number, status, mode, items, options and totals', () => {
    const text = render(ORDER).textContent;

    expect(text).toContain('A003');
    expect(text).toContain('Accepted');
    expect(text).toContain('Take away');
    expect(text).toContain('2 × Classic Milk Tea');
    expect(text).toContain('Large, Less ice');
    expect(text).toContain('$130.00');
    expect(text).toContain('$10.00');
    expect(text).toContain('$5.00');
    expect(text).toContain('$125.00');
  });

  it('hides the estimated time when absent and shows it when present', () => {
    expect(render(ORDER).textContent).not.toContain('Estimated Time');

    TestBed.resetTestingModule();
    const withEta = render({ ...ORDER, estimated_delivery_time: '2026-04-09T18:45:00.000Z' });
    expect(withEta.textContent).toContain('Estimated Time');
  });
});
