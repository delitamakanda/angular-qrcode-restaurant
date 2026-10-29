import { OrderStatus } from '@app/core/models/order.model';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

/** Statuses of an order that is still being handled. */
export const IN_PROGRESS_ORDER_STATUSES: readonly OrderStatus[] = [
  'pending',
  'accepted',
  'preparing',
  'ready',
];

/** Nominal order journey, in display order (`cancelled` is outside the flow). */
export const ORDER_STATUS_FLOW: readonly OrderStatus[] = [
  'pending',
  'accepted',
  'preparing',
  'ready',
  'completed',
];
