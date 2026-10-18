import { expect, test } from '@playwright/test';

test('checkout redirects to the menu when the cart is empty', async ({ page }) => {
  await page.goto('/store/demo/checkout');

  await expect(page).toHaveURL(/\/store\/demo\/menu$/);
});
