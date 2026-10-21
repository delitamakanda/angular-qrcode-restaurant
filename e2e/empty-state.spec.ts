import { expect, test } from '@playwright/test';

test('empty cart page shows the empty state and leads back to the menu', async ({ page }) => {
  await page.goto('/store/demo/cart');

  await expect(page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Checkout' })).toHaveCount(0);

  await page.getByRole('button', { name: 'View menu' }).click();
  await expect(page).toHaveURL(/\/store\/demo\/menu$/);
});
