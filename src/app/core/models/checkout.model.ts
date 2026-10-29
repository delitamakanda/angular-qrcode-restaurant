import { OrderMode } from './store.model';
import { CartItem } from './cart.model';
import type { OrderStatus } from './order.model';

export type PaymentMode = 'card' | 'cash' | 'paypal' | 'applePay';

export interface CheckoutCustomer {
  name?: string;
  phone?: string;
}

export interface CheckoutPayload {
  store_id: string;
  mode: OrderMode;
  customer?: CheckoutCustomer;
  coupon_code?: string;
  payment_mode: PaymentMode;
  items: CartItem[];
  /**
   * Fields json-server does not compute. The Cloudflare Function accepts them too
   * (`payload.x ?? default`), so both backends return the same order shape.
   */
  order_number?: string;
  status?: OrderStatus;
  subtotal?: number;
  discount?: number;
  fees?: number;
  total?: number;
  created_at?: string;
}
