export type OrderMode = 'dine_in' | 'take_away' | 'delivery';

export interface Store {
  id: string;
  name: string;
  logo_url?: string;
  cover_image_url?: string;
  currency: string;
  is_open: boolean;
  estimated_wait_minutes?: number;
  supported_modes: OrderMode[];
}
