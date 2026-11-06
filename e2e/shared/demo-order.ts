/** Order returned by the stubbed `/orders` endpoints in the README screenshots and demo. */
export const demoOrder = {
  id: 'demo-order-1',
  store_id: 'demo',
  status: 'preparing',
  order_number: 'A042',
  mode: 'dine_in',
  items: [
    {
      id: 'cart-1',
      menu_item_id: 'item-classic-milk-tea',
      name: 'Classic Milk Tea',
      quantity: 1,
      unit_base_price: 450,
      total_price: 450,
    },
  ],
  created_at: '2026-01-01T12:00:00.000Z',
  total: 450,
  discount: 0,
  fees: 0,
  subtotal: 450,
};
