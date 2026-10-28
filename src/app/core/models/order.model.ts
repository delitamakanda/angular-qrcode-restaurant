import { CartItem } from './cart.model';
import { CheckoutCustomer, PaymentMode } from './checkout.model';
import { OrderMode } from './store.model';

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'cancelled'
  | 'completed';

export interface Order {
  id: string;
  store_id: string;
  status: OrderStatus;
  order_number: string;
  mode: OrderMode;
  customer?: CheckoutCustomer;
  payment_mode?: PaymentMode;
  items: CartItem[];
  estimated_delivery_time?: string;
  created_at: string;
  total: number;
  discount: number;
  fees: number;
  subtotal: number;
}
