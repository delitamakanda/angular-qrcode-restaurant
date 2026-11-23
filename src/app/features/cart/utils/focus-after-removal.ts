/**
 * Moves the focus once a cart line is removed: to the "Remove" button now at the same
 * position (the next line, or the previous one when the last line was removed), or to
 * the empty state button when the cart is empty. Never leaves the focus on `<body>`.
 */
export function focusAfterRemoval(host: HTMLElement, removedIndex: number): void {
  const removeButtons = Array.from(host.querySelectorAll<HTMLButtonElement>('[data-cart-remove]'));
  const neighbour = removeButtons.at(Math.min(removedIndex, removeButtons.length - 1));
  const target = neighbour ?? host.querySelector<HTMLElement>('app-empty-state button');
  target?.focus();
}
