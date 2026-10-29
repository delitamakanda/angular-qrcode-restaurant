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

test('tracking page shows the status timeline', async ({ page }) => {
  await page.route('**/orders/order-1001', (route) =>
    route.fulfill({ json: { id: 'order-1001', order_number: 'A001', status: 'preparing' } }),
  );

  await page.goto('/store/demo/tracking/order-1001');

  const timeline = page.getByRole('list', { name: 'Order progress' });
  await expect(timeline.getByRole('listitem')).toHaveCount(5);
  await expect(timeline.getByRole('listitem').filter({ hasText: 'Preparing' })).toHaveAttribute(
    'aria-current',
    'step',
  );
});

test('tracking page updates the status automatically', async ({ page }) => {
  let status = 'accepted';
  await page.route('**/orders/order-1001', (route) =>
    route.fulfill({ json: { id: 'order-1001', order_number: 'A001', status } }),
  );
  await page.clock.install();

  await page.goto('/store/demo/tracking/order-1001');
  const statusText = page.getByRole('status').filter({ hasText: /Accepted|Preparing/ });
  await expect(statusText).toHaveText('Accepted');

  status = 'preparing';
  await page.clock.runFor(6000);

  await expect(statusText).toHaveText('Preparing');
});

test('tracking page shows a Live badge for an in-progress order only', async ({ page }) => {
  await page.route('**/orders/order-1001', (route) =>
    route.fulfill({ json: { id: 'order-1001', order_number: 'A001', status: 'preparing' } }),
  );
  await page.route('**/orders/order-1002', (route) =>
    route.fulfill({ json: { id: 'order-1002', order_number: 'A002', status: 'completed' } }),
  );

  await page.goto('/store/demo/tracking/order-1001');
  await expect(page.locator('app-order-live-banner')).toHaveText('Live');

  await page.goto('/store/demo/tracking/order-1002');
  await expect(page.locator('app-order-live-banner')).toHaveText('Completed');
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
