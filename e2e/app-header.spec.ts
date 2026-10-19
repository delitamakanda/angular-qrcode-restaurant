import { expect, test } from '@playwright/test';

test('app header shows the store name, status badge and actions', async ({ page }) => {
  await page.goto('/store/demo/welcome');

  const header = page.getByRole('banner');
  await expect(header.getByText('Open', { exact: true })).toBeVisible({ timeout: 15000 });
  await expect(header.getByRole('link', { name: 'Home' })).toHaveAttribute('href', /welcome$/);
  await expect(header.getByRole('button', { name: 'Reload page' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
});
