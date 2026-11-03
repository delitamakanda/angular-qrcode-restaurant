import { expect, test, type Page } from '@playwright/test';
import { addClassicMilkTea } from './helpers/add-classic-milk-tea';

const parseTotal = async (page: Page): Promise<number> => {
  const text = (await page.getByText(/^Total: /).textContent()) ?? '';
  return Number(text.replace(/[^0-9.]/g, ''));
};

async function openCheckout(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Dine in' }).click();
  await addClassicMilkTea(page);
  await page.getByRole('button', { name: /View cart/ }).click();
  await page
    .getByRole('dialog', { name: 'Panier' })
    .getByRole('button', { name: 'Checkout' })
    .click();
  await expect(page).toHaveURL(/\/store\/demo\/checkout$/);
}

test('checkout applies and removes a coupon, and sends it with the order', async ({ page }) => {
  const order = {
    id: 'e2e-order-coupon',
    store_id: 'demo',
    status: 'pending',
    order_number: 'E2E-C',
    created_at: '2026-01-01T12:00:00.000Z',
    total: 450,
    discount: 10,
    fees: 0,
    subtotal: 460,
  };
  let sent: { coupon_code?: string; discount: number; total: number } | undefined;

  await page.route(/\/orders(\?.*)?$/, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    sent = route.request().postDataJSON() as typeof sent;
    await route.fulfill({ status: 201, json: order });
  });
  await page.route(`**/orders/${order.id}`, (route) => route.fulfill({ json: order }));

  await openCheckout(page);
  const initialTotal = await parseTotal(page);
  const code = page.getByLabel('Coupon code (optional)');

  await code.fill('ZEN5');
  await page.getByRole('button', { name: 'Apply' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Invalid or expired' })).toBeVisible();
  await expect(code).toHaveAttribute('aria-invalid', 'true');
  expect(await parseTotal(page)).toBe(initialTotal);

  await code.fill(' welcome10 ');
  await code.press('Enter');
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByRole('status').filter({ hasText: 'WELCOME10 applied' })).toBeVisible();
  expect(await parseTotal(page)).toBeCloseTo(initialTotal - 10, 2);

  await page.getByRole('button', { name: 'Remove' }).click();
  await expect(code).toBeFocused();
  await expect(page.getByRole('status').filter({ hasText: 'WELCOME10 applied' })).toBeHidden();
  expect(await parseTotal(page)).toBe(initialTotal);

  await code.fill('WELCOME10');
  await page.getByRole('button', { name: 'Apply' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'WELCOME10 applied' })).toBeVisible();

  await page.getByLabel('Name').fill('Jane Doe');
  await page.getByLabel('Phone number').fill('+33 6 06 78 70 45');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page).toHaveURL(/\/confirmation\/e2e-order-coupon$/);
  expect(sent?.coupon_code).toBe('WELCOME10');
  expect(sent?.discount).toBe(10);
  expect(sent?.total).toBeCloseTo(initialTotal - 10, 2);
});
