import { expect, test } from '@playwright/test';

const order = (id: string, status: string, total: number, created_at: string) => ({
  id,
  store_id: 'demo',
  order_number: id,
  status,
  mode: 'take_away',
  items: [],
  total,
  discount: 0,
  fees: 0,
  subtotal: total,
  created_at,
});

test('admin dashboard shows KPIs, status counters and latest orders', async ({ page }) => {
  await page.route(/\/orders\?store_id=demo$/, (route) =>
    route.fulfill({
      json: [
        order('D-1', 'pending', 10, '2026-01-01T10:00:00Z'),
        order('D-2', 'cancelled', 99, '2026-01-01T11:00:00Z'),
      ],
    }),
  );
  await page.goto('/store/demo/admin');

  await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible({
    timeout: 15000,
  });
  for (const name of ['Key figures', 'Orders by status', 'Latest orders']) {
    await expect(page.getByRole('heading', { level: 2, name })).toBeVisible();
  }
  await expect(page.getByText('$10.00').first()).toBeVisible();
  await expect(page.getByText('D-1')).toBeVisible();
});

test('admin dashboard offers a retry on error', async ({ page }) => {
  let fail = true;
  await page.route(/\/orders\?store_id=demo$/, (route) =>
    fail ? route.fulfill({ status: 500, json: {} }) : route.fulfill({ json: [] }),
  );
  await page.goto('/store/demo/admin');
  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible({ timeout: 15000 });
  fail = false;
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(page.getByText('No orders')).toBeVisible();
});
