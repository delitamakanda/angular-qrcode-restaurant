import { expect, test, type Page } from '@playwright/test';

const baseOrder = {
  store_id: 'demo',
  mode: 'take_away',
  items: [{ id: 'c1', menu_item_id: 'm1', name: 'Tea', quantity: 2, total_price: 900 }],
  total: 900,
  discount: 0,
  fees: 0,
  subtotal: 900,
};
const orders = {
  'hist-1': {
    ...baseOrder,
    id: 'hist-1',
    order_number: 'H-1',
    status: 'completed',
    created_at: '2026-01-01T10:00:00.000Z',
  },
  'hist-2': {
    ...baseOrder,
    id: 'hist-2',
    order_number: 'H-2',
    status: 'preparing',
    created_at: '2026-01-02T10:00:00.000Z',
  },
};

async function seedHistory(page: Page, ids: string[]): Promise<void> {
  const entries = ids.map((id) => ({ id, store_id: 'demo', created_at: '2026-01-01T00:00:00Z' }));
  await page.addInitScript((value) => {
    if (!localStorage.getItem('cashier-order-history')) {
      localStorage.setItem('cashier-order-history', JSON.stringify(value));
    }
  }, entries);
  await page.route(/\/orders\/[^/?]+$/, async (route) => {
    const id = route.request().url().split('/').pop() ?? '';
    const order = orders[id as keyof typeof orders];
    await (order ? route.fulfill({ json: order }) : route.fulfill({ status: 404, json: {} }));
  });
}

test('history lists orders newest first, keeps unknown ids as unavailable and links by status', async ({
  page,
}) => {
  await seedHistory(page, ['hist-1', 'gone', 'hist-2']);
  await page.goto('/store/demo/settings');

  await page.getByRole('link', { name: 'My orders' }).click({ timeout: 15000 });
  await expect(page).toHaveURL(/\/store\/demo\/orders$/);
  await expect(page.getByRole('heading', { level: 1, name: 'My orders' })).toBeVisible();

  const links = page.getByRole('list').getByRole('link');
  await expect(links).toHaveCount(2);
  await expect(page.getByRole('listitem')).toHaveCount(3);
  await expect(page.getByText('Details unavailable')).toBeVisible();
  await expect(page.getByText('Page not found')).toHaveCount(0);
  await expect(links.nth(0)).toHaveAccessibleName(/H-2/);
  await expect(links.nth(1)).toHaveAccessibleName(/H-1/);
  await expect(links.nth(0)).toHaveAttribute('href', '/store/demo/tracking/hist-2');
  await expect(links.nth(1)).toHaveAttribute('href', '/store/demo/confirmation/hist-1');
  await expect(links.nth(0)).toContainText('Preparing');
  await expect(links.nth(0)).toContainText('2 items');

  await page.screenshot({ path: '.agent-out/playwright/2-history-list.png' });

  const stored = await page.evaluate(() => localStorage.getItem('cashier-order-history'));
  expect(stored).toContain('gone');

  await page.reload();
  await expect(page.getByRole('listitem')).toHaveCount(3, { timeout: 15000 });
});

test('clearing the history asks for confirmation and shows the empty state', async ({ page }) => {
  await seedHistory(page, ['hist-1']);
  await page.goto('/store/demo/orders');

  await expect(page.getByRole('list').getByRole('link')).toHaveCount(1, { timeout: 15000 });
  await page.getByRole('button', { name: 'Clear history' }).click();
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('list').getByRole('link')).toHaveCount(1);

  await page.getByRole('button', { name: 'Clear history' }).click();
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(page.getByText('No orders yet')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Browse the menu' })).toBeVisible();
  await page.screenshot({ path: '.agent-out/playwright/3-history-empty.png' });
});
