import { expect, test, type Page } from '@playwright/test';

const OUT_DIR = 'docs/screenshots';

const order = {
  id: 'demo-order-1',
  store_id: 'demo',
  status: 'preparing',
  order_number: 'A042',
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

async function capture(page: Page, name: string): Promise<void> {
  // Let fonts settle before the screenshot.
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: `${OUT_DIR}/${name}.png`,
    animations: 'disabled',
    caret: 'hide',
  });
}

test('generate README screenshots', async ({ page }) => {
  // Avoid writing to mock-api/db.json: order creation and lookup are stubbed.
  await page.route(/\/orders(\?.*)?$/, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    await route.fulfill({ status: 201, json: order });
  });
  await page.route(`**/orders/${order.id}`, (route) => route.fulfill({ json: order }));

  // 01 - welcome (splash screen is over once the mode buttons are visible)
  await page.goto('/');
  await expect(page).toHaveURL(/\/store\/demo\/welcome$/);
  const dineIn = page.getByRole('button', { name: 'Dine in' });
  await expect(dineIn).toBeVisible();
  await capture(page, '01-welcome');

  // 02 - menu
  await dineIn.click();
  await expect(page).toHaveURL(/\/store\/demo\/menu$/);
  const addButton = page.getByRole('button', { name: 'Add to cart: Classic Milk Tea' });
  await expect(addButton).toBeVisible();
  await capture(page, '02-menu');

  // 03 - product customization
  await addButton.click();
  const customization = page.getByRole('dialog', { name: 'Classic Milk Tea' });
  await expect(customization).toBeVisible();
  await customization.getByRole('radio', { name: 'Medium' }).check();
  await customization.getByRole('radio', { name: '100%' }).check();
  await customization.getByRole('radio', { name: 'Regular Ice' }).check();
  await capture(page, '03-product-customization');
  await customization.getByRole('button', { name: /^Add · / }).click();
  await expect(customization).toBeHidden();

  // 04 - cart
  await page.getByRole('button', { name: /View cart/ }).click();
  const cart = page.getByRole('dialog', { name: 'Panier' });
  await expect(cart.getByText('Classic Milk Tea')).toBeVisible();
  await capture(page, '04-cart');

  // 05 - checkout
  await cart.getByRole('button', { name: 'Checkout' }).click();
  await expect(page).toHaveURL(/\/store\/demo\/checkout$/);
  await page.getByLabel('Name').fill('Jane Doe');
  await page.getByLabel('Phone number').fill('+33612345678');
  await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
  await capture(page, '05-checkout');

  // 06 - order confirmation
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page).toHaveURL(/\/store\/demo\/confirmation\/demo-order-1$/);
  await expect(page.getByRole('heading', { name: 'Order Confirmed' })).toBeVisible();
  await expect(page.getByText(order.order_number)).toBeVisible();
  await capture(page, '06-order-confirmation');

  // 07 - order tracking
  await page.getByRole('link', { name: 'Track My Order' }).click();
  await expect(page).toHaveURL(/\/store\/demo\/tracking\/demo-order-1$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Order tracking' })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Order progress' })).toBeVisible();
  await capture(page, '07-order-tracking');
});
