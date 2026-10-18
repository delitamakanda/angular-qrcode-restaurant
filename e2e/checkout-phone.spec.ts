import { expect, test } from '@playwright/test';

test('checkout validates the phone number and sends it normalized', async ({ page }) => {
  const order = {
    id: 'e2e-order-2',
    store_id: 'demo',
    status: 'pending',
    order_number: 'E2E-2',
    created_at: '2026-01-01T12:00:00.000Z',
    total: 450,
    discount: 0,
    fees: 0,
    subtotal: 450,
  };
  let sentPhone: string | undefined;

  await page.route(/\/orders(\?.*)?$/, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    sentPhone = (route.request().postDataJSON() as { customer: { phone: string } }).customer.phone;
    await route.fulfill({ status: 201, json: order });
  });
  await page.route(`**/orders/${order.id}`, (route) => route.fulfill({ json: order }));

  await page.goto('/');
  await page.getByRole('button', { name: 'Dine in' }).click();
  await page.getByRole('button', { name: 'Add to cart: Classic Milk Tea' }).click();
  await page.getByRole('button', { name: /view cart/ }).click();
  await page
    .getByRole('dialog', { name: 'Panier' })
    .getByRole('button', { name: 'Checkout' })
    .click();
  await expect(page).toHaveURL(/\/store\/demo\/checkout$/);

  await page.getByLabel('Name').fill('Jane Doe');
  const phone = page.getByLabel('Phone number');

  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Phone number is required' }),
  ).toBeVisible();
  await expect(phone).toHaveAttribute('aria-invalid', 'true');

  await phone.fill('0606787045');
  await expect(page.getByText('Enter a valid phone number, e.g. +33606787045')).toBeVisible();

  await phone.fill('+33 6 06 78 70 45');
  await expect(phone).toHaveAttribute('aria-invalid', 'false');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page).toHaveURL(/\/store\/demo\/confirmation\/e2e-order-2$/);
  expect(sentPhone).toBe('+33606787045');
});
