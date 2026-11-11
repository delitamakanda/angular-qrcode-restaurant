import { expect, test } from '@playwright/test';
import { addClassicMilkTea } from './helpers/add-classic-milk-tea';

test('checkout sends the trimmed order note and confirmation shows it as text', async ({
  page,
}) => {
  const order = {
    id: 'e2e-order-note',
    store_id: 'demo',
    status: 'pending',
    order_number: 'E2E-N',
    mode: 'dine_in',
    items: [],
    created_at: '2026-01-01T12:00:00.000Z',
    total: 450,
    discount: 0,
    fees: 0,
    subtotal: 450,
    note: '<b>Ring</b> the bell',
  };
  let sentNote: string | undefined;

  await page.route(/\/orders(\?.*)?$/, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    sentNote = (route.request().postDataJSON() as { note?: string }).note;
    await route.fulfill({ status: 201, json: order });
  });
  await page.route(`**/orders/${order.id}`, (route) => route.fulfill({ json: order }));

  await page.goto('/');
  await page.getByRole('button', { name: 'Dine in' }).click();
  await addClassicMilkTea(page);
  await page.getByRole('button', { name: /View cart/ }).click();
  await page
    .getByRole('dialog', { name: 'Panier' })
    .getByRole('button', { name: 'Checkout' })
    .click();
  await expect(page).toHaveURL(/\/store\/demo\/checkout$/);

  await page.getByLabel('Name').fill('Jane Doe');
  await page.getByLabel('Phone number').fill('+33 6 06 78 70 45');
  const note = page.getByLabel('Order note (optional)');
  await note.fill('  <b>Ring</b> the bell  ');
  await expect(page.getByText('24/200 characters')).toBeVisible();
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page).toHaveURL(/\/store\/demo\/confirmation\/e2e-order-note$/);
  expect(sentNote).toBe('<b>Ring</b> the bell');
  await expect(page.getByText('<b>Ring</b> the bell')).toBeVisible();
});
