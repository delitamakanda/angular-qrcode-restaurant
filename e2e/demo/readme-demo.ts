import { expect, test, type Page } from '@playwright/test';
import { demoOrder as order } from '../shared/demo-order';

/** Short pause so that each step of the recorded video stays readable. */
const pause = (page: Page, ms = 800): Promise<void> => page.waitForTimeout(ms);

test('record README demo video', async ({ page }) => {
  // Avoid writing to mock-api/db.json: order creation and lookup are stubbed.
  await page.route(/\/orders(\?.*)?$/, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    await route.fulfill({ status: 201, json: order });
  });
  await page.route(`**/orders/${order.id}`, (route) => route.fulfill({ json: order }));

  // 1 - welcome (splash screen is over once the mode buttons are visible)
  await page.goto('/');
  await expect(page).toHaveURL(/\/store\/demo\/welcome$/);
  const dineIn = page.getByRole('button', { name: 'Dine in' });
  await expect(dineIn).toBeVisible();
  await pause(page, 1200);

  // 2 - menu
  await dineIn.click();
  await expect(page).toHaveURL(/\/store\/demo\/menu$/);
  const addButton = page.getByRole('button', { name: 'Add to cart: Classic Milk Tea' });
  await expect(addButton).toBeVisible();
  await pause(page, 1200);

  // 3 - product customization
  await addButton.click();
  const customization = page.getByRole('dialog', { name: 'Classic Milk Tea' });
  await expect(customization).toBeVisible();
  await pause(page);
  await customization.getByRole('radio', { name: 'Medium' }).check();
  await pause(page, 600);
  await customization.getByRole('radio', { name: '100%' }).check();
  await pause(page, 600);
  await customization.getByRole('radio', { name: 'Regular Ice' }).check();
  await pause(page);
  await customization.getByRole('button', { name: /^Add · / }).click();
  await expect(customization).toBeHidden();
  await pause(page);

  // 4 - cart
  await page.getByRole('button', { name: /View cart/ }).click();
  const cart = page.getByRole('dialog', { name: 'Panier' });
  await expect(cart.getByText('Classic Milk Tea')).toBeVisible();
  await pause(page, 1200);

  // 5 - checkout
  await cart.getByRole('button', { name: 'Checkout' }).click();
  await expect(page).toHaveURL(/\/store\/demo\/checkout$/);
  await page.getByLabel('Name').fill('Jane Doe');
  await page.getByLabel('Phone number').fill('+33612345678');
  await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
  await pause(page, 1200);

  // 6 - order confirmation
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page).toHaveURL(/\/store\/demo\/confirmation\/demo-order-1$/);
  await expect(page.getByRole('heading', { name: 'Order Confirmed' })).toBeVisible();
  await expect(page.getByText(order.order_number)).toBeVisible();
  await pause(page, 1200);

  // 7 - order tracking
  await page.getByRole('link', { name: 'Track My Order' }).click();
  await expect(page).toHaveURL(/\/store\/demo\/tracking\/demo-order-1$/);
  await expect(page.getByRole('list', { name: 'Order progress' })).toBeVisible();
  await pause(page, 1800);
});
