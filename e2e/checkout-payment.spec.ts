import { expect, test } from '@playwright/test';
import { addClassicMilkTea } from './helpers/add-classic-milk-tea';

test('checkout lets the user pick a payment method and sends it', async ({ page }) => {
  const order = {
    id: 'e2e-order-3',
    store_id: 'demo',
    status: 'pending',
    order_number: 'E2E-3',
    created_at: '2026-01-01T12:00:00.000Z',
    total: 450,
    discount: 0,
    fees: 0,
    subtotal: 450,
  };
  let sentPayment: string | undefined;

  await page.route(/\/orders(\?.*)?$/, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    sentPayment = (route.request().postDataJSON() as { payment_mode: string }).payment_mode;
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

  const group = page.getByRole('radiogroup', { name: 'Payment method' });
  await expect(group.getByRole('radio', { name: 'Cash' })).toBeChecked();
  await expect(group.getByRole('radio', { name: 'Visa/Mastercard' })).not.toBeChecked();

  await group.getByRole('radio', { name: 'Visa/Mastercard' }).check();
  await expect(group.getByRole('radio', { name: 'Visa/Mastercard' })).toBeChecked();

  await page.getByLabel('Name').fill('Jane Doe');
  await page.getByLabel('Phone number').fill('+33612345678');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page).toHaveURL(/\/store\/demo\/confirmation\/e2e-order-3$/);
  expect(sentPayment).toBe('card');
});
