import { expect, test } from '@playwright/test';

test('confirmation page shows an error when the order is not found', async ({ page }) => {
  await page.route('**/orders/unknown-order', (route) =>
    route.fulfill({ status: 404, json: { message: 'Not found' } }),
  );

  await page.goto('/store/demo/confirmation/unknown-order');

  await expect(
    page.getByText('Order not found or network error. Please try again later.'),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to Menu' })).toHaveAttribute(
    'href',
    '/store/demo/menu',
  );
});

test('confirmation page falls back to the local copy when the order is gone', async ({ page }) => {
  const order = {
    id: 'lost-order',
    store_id: 'demo',
    status: 'pending',
    order_number: 'A042',
    mode: 'take_away',
    items: [],
    subtotal: 65,
    discount: 0,
    fees: 0,
    total: 65,
    created_at: '2026-05-01T10:00:00.000Z',
  };
  await page.addInitScript(
    (entry) => {
      localStorage.setItem('cashier-order-history', JSON.stringify([entry]));
    },
    { id: order.id, store_id: 'demo', created_at: order.created_at, order },
  );
  await page.route('**/orders/lost-order', (route) =>
    route.fulfill({ status: 404, json: { message: 'Not found' } }),
  );

  await page.goto('/store/demo/confirmation/lost-order');

  await expect(page.getByText('A042')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});
