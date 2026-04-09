import { ModifierGroup } from './modifier.model';
import { OrderMode } from './store.model';

export interface MenuCategory {
  id: string;
  name: string;
  sort_order: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category_id: string;
  description?: string;
  image_url?: string;
  base_price: number;
  is_sold_out: boolean;
  tags?: string[];
  modifierGroups?: ModifierGroup[];
  mode_availability?: { [mode in OrderMode]: boolean };
}
