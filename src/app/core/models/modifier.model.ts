export interface ModifierOption {
  id: string;
  name: string;
  price_delta: number;
  is_available: boolean;
}

export interface ModifierGroup {
  id: string;
  name: string;
  required: boolean;
  min_select?: number;
  max_select?: number;
  options: ModifierOption[];
}
