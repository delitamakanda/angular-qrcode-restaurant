export type OrderStatus = 'pending' | 'accepted' | 'preparing'| 'ready'| 'cancelled' | 'completed';


export interface Order {
  id: string;
  store_id: string;
  status: OrderStatus;
  order_number: string;
  estimated_delivery_time?: string;
  created_at: string;
  total: number;
  discount: number;
  fees: number;
  subtotal: number;
}
