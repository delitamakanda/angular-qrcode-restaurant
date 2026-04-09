export interface CartSelectedOption {
  group_id: string;
  option_id: string;
  label: string;
  price_delta: number;
}

export interface CartItem {
  id: string;
  menu_item_id: string;
  quantity: number;
  name: string;
  note?: string;
  unit_base_price: number;
  selected_options?: CartSelectedOption[];
  total_price: number;
}
