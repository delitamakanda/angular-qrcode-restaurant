import { OrderMode } from './store.model';
import { CartItem} from './cart.model';

export type PaymentMode = 'card' | 'cash'  | 'paypal' | 'applePay';

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
}
