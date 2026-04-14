export type PromotionType = 'fixed' | 'percentage';

export interface Promotion {
  id: string;
  code: string;
  type: PromotionType;
  value: number;
  is_active: boolean;
}
