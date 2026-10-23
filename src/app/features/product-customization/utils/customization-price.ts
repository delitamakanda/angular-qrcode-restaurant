import { CartSelectedOption } from '@app/core/models/cart.model';
import { ModifierGroup } from '@app/core/models/modifier.model';

/** Selected option ids, keyed by modifier group id. */
export type Selection = Partial<Record<string, string[]>>;

export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 20;

/** `required: false` takes precedence over `min_select` (no minimum for optional groups). */
export function minSelect(group: ModifierGroup): number {
  return group.required ? Math.max(group.min_select ?? 1, 1) : 0;
}

export function maxSelect(group: ModifierGroup): number {
  return Math.max(group.max_select ?? group.options.length, 1);
}

export function isSingleChoice(group: ModifierGroup): boolean {
  return maxSelect(group) === 1;
}

export function missingGroups(groups: ModifierGroup[], selection: Selection): ModifierGroup[] {
  return groups.filter((group) => (selection[group.id]?.length ?? 0) < minSelect(group));
}

/** Toggles an option without ever exceeding `max_select` (single choice replaces the value). */
export function toggleOption(group: ModifierGroup, current: string[], optionId: string): string[] {
  if (isSingleChoice(group)) {
    return [optionId];
  }
  if (current.includes(optionId)) {
    return current.filter((id) => id !== optionId);
  }
  return current.length >= maxSelect(group) ? current : [...current, optionId];
}

export function toSelectedOptions(
  groups: ModifierGroup[],
  selection: Selection,
): CartSelectedOption[] {
  return groups.flatMap((group) =>
    group.options
      .filter((option) => option.is_available && selection[group.id]?.includes(option.id))
      .map((option) => ({
        group_id: group.id,
        option_id: option.id,
        label: option.name,
        price_delta: option.price_delta,
      })),
  );
}

export function unitPrice(basePrice: number, options: CartSelectedOption[]): number {
  return basePrice + options.reduce((sum, option) => sum + option.price_delta, 0);
}

export function totalPrice(
  basePrice: number,
  options: CartSelectedOption[],
  quantity: number,
): number {
  return unitPrice(basePrice, options) * quantity;
}

export function clampQuantity(quantity: number): number {
  return Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, quantity));
}
