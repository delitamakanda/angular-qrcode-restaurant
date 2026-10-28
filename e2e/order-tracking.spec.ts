import { expect, test } from '@playwright/test';

test('tracking page shows the order status', async ({ page }) => {
  await page.goto('/store/demo/tracking/order-1001');

  await expect(page.getByRole('heading', { level: 1, name: 'Order tracking' })).toBeVisible();
  await expect(page.getByText('A001')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to Menu' })).toHaveAttribute(
    'href',
    '/store/demo/menu',
  );
});

test('tracking page shows an error state with retry', async ({ page }) => {
  await page.route('**/orders/unknown-order', (route) =>
    route.fulfill({ status: 404, json: { message: 'Not found' } }),
  );

  await page.goto('/store/demo/tracking/unknown-order');

  await expect(page.getByRole('heading', { name: 'Order not found' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to Menu' })).toBeVisible();
});
