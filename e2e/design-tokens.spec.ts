import { expect, test } from '@playwright/test';

test('radius and spacing tokens are exposed and used by the menu', async ({ page }) => {
  await page.goto('/store/demo/welcome');
  await expect(page.getByRole('button', { name: 'Dine in' })).toBeVisible();

  const tokens = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return [
      '--spacing',
      '--radius-control',
      '--radius-panel',
      '--radius-card',
      '--radius-pill',
    ].map((name) => style.getPropertyValue(name).trim());
  });
  expect(tokens).toEqual(['0.25rem', '0.5rem', '0.75rem', '1rem', '999px']);

  await page.getByRole('button', { name: 'Dine in' }).click();
  const card = page.locator('app-menu-item-card .menu-item-card').first();
  await expect(card).toBeVisible();
  await expect(card).toHaveCSS('border-top-left-radius', '16px');
});
