import { OrderStatus } from '@app/core/models/order.model';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready',
  cancelled: 'Cancelled',
  completed: 'Completed',
};
