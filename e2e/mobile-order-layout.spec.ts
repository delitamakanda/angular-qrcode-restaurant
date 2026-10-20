import { expect, test } from '@playwright/test';

test('layout is a single full-width column on mobile with one main landmark', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/store/demo/welcome');
  await page.getByRole('button', { name: 'Dine in' }).click();
  await expect(page).toHaveURL(/\/store\/demo\/menu$/);

  await expect(page.getByRole('main')).toHaveCount(1);
  const layout = page.locator('app-mobile-order-layout');
  const box = await layout.boundingBox();
  expect(box?.width).toBe(360);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});

test('layout column is capped and centered on wide screens', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/store/demo/welcome');
  await page.getByRole('button', { name: 'Dine in' }).click();
  await expect(page).toHaveURL(/\/store\/demo\/menu$/);

  const box = await page.locator('app-mobile-order-layout').boundingBox();
  expect(box?.width).toBeLessThanOrEqual(480);
  expect(box?.x).toBeCloseTo((1280 - (box?.width ?? 0)) / 2, 0);
});
