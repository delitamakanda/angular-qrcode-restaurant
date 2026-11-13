/** Single quantity rule shared by the customization dialog, the cart and the stepper. */
export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 20;

export function clampQuantity(quantity: number): number {
  return Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, quantity));
}
