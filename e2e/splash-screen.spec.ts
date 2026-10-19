import { expect, test } from '@playwright/test';

test('splash screen shows the logo on a white background', async ({ page }) => {
  await page.goto('/store/demo/welcome');

  const splash = page.locator('#splash-screen');
  await expect(splash).toBeVisible();
  await expect(splash).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(splash.getByRole('img', { name: 'QR Code Restaurant' })).toBeVisible();
  await expect(splash.getByText('Chargement')).toBeAttached();

  await expect(splash).toBeHidden({ timeout: 15000 });
});
