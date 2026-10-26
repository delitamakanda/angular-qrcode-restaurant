import { expect, test } from '@playwright/test';

test('app header shows the store name, status badge and actions', async ({ page }) => {
  await page.goto('/store/demo/welcome');

  const header = page.getByRole('banner');
  await expect(header.getByText('Open', { exact: true })).toBeVisible({ timeout: 15000 });
  await expect(header.getByRole('link', { name: 'Home' })).toHaveAttribute('href', /welcome$/);
  await expect(header.getByRole('button', { name: 'Reload page' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
});

test('app header shows a decorative logo without horizontal overflow at 320px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/store/demo/welcome');

  const header = page.getByRole('banner');
  await expect(header.getByText('Open', { exact: true })).toBeVisible({ timeout: 15000 });

  const logo = header.locator('img[src*="assets/logo.png"]');
  await expect(logo).toBeVisible();
  await expect(logo).toHaveAttribute('alt', '');
  await expect(header.getByRole('img')).toHaveCount(0);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
  await page.screenshot({ path: '.agent-out/playwright/1-logo-320.png' });
});
