import { OrderStatus } from '@app/core/models/order.model';
import { ORDER_STATUS_LABELS } from './order.constants';

describe('ORDER_STATUS_LABELS', () => {
  it('has a readable label for every order status', () => {
    const statuses: OrderStatus[] = [
      'pending',
      'accepted',
      'preparing',
      'ready',
      'cancelled',
      'completed',
    ];

    expect(Object.keys(ORDER_STATUS_LABELS).sort()).toEqual([...statuses].sort());
    for (const status of statuses) {
      expect(ORDER_STATUS_LABELS[status]).toMatch(/^[A-Z][a-z]+$/);
    }
  });
});
