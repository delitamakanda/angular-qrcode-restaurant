import { expect, test } from '@playwright/test';
import { addClassicMilkTea } from './helpers/add-classic-milk-tea';

test('customer can order a product in dine-in mode', async ({ page }) => {
  const order = {
    id: 'e2e-order-1',
    store_id: 'demo',
    status: 'pending',
    order_number: 'E2E-1',
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

  // Avoid writing to mock-api/db.json: order creation and lookup are stubbed.
  // Match on path suffix since BASE_API_URL differs per environment
  // (http://localhost:3000 in dev, .../api in prod).
  await page.route(/\/orders(\?.*)?$/, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    await route.fulfill({ status: 201, json: order });
  });
  await page.route(`**/orders/${order.id}`, (route) => route.fulfill({ json: order }));

  await page.goto('/');
  await expect(page).toHaveURL(/\/store\/demo\/welcome$/);

  await page.getByRole('button', { name: 'Dine in' }).click();
  await expect(page).toHaveURL(/\/store\/demo\/menu$/);

  await addClassicMilkTea(page);

  await page.getByRole('button', { name: /View cart/ }).click();
  const cart = page.getByRole('dialog', { name: 'Panier' });
  await expect(cart.getByText('Classic Milk Tea')).toBeVisible();
  await cart.getByRole('button', { name: 'Checkout' }).click();

  await expect(page).toHaveURL(/\/store\/demo\/checkout$/);
  await page.getByLabel('Name').fill('Jane Doe');
  await page.getByLabel('Phone number').fill('+33612345678');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page).toHaveURL(/\/store\/demo\/confirmation\/e2e-order-1$/);
  await expect(page.getByRole('heading', { name: 'Commande confirmée' })).toBeVisible();
  await expect(page.getByText('E2E-1')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Suivre ma commande' })).toHaveAttribute(
    'href',
    '/store/demo/tracking/e2e-order-1',
  );
  await expect(page.getByRole('link', { name: 'Retour au menu' })).toHaveAttribute(
    'href',
    '/store/demo/menu',
  );
});
