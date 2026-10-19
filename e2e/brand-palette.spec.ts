import { expect, test } from '@playwright/test';

test('brand palette is applied to the page and Taiga primary buttons', async ({ page }) => {
  await page.goto('/store/demo/welcome');
  const dineIn = page.getByRole('button', { name: 'Dine in' });
  await expect(dineIn).toBeVisible();

  const body = page.locator('body');
  await expect(body).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(dineIn).toHaveCSS('background-color', 'rgb(232, 20, 28)');
});
