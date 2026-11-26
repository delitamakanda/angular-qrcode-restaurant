import { CartItem } from '@app/core/models/cart.model';

/**
 * Identity key of a cart line: same product, same trimmed note and same set of
 * chosen options (order-insensitive) give the same key.
 */
export function cartLineKey(item: CartItem): string {
  const options = (item.selected_options ?? [])
    .map((option) => `${option.group_id}:${option.option_id}`)
    .sort();
  return JSON.stringify([item.menu_item_id, (item.note ?? '').trim(), options]);
}
