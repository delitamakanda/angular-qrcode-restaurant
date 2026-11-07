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

test('viewport meta opts into safe areas and the sticky footer adds no extra bottom inset', async ({
  page,
}) => {
  await page.goto('/store/demo/welcome');
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
    'content',
    /viewport-fit=cover/,
  );
  await page.getByRole('button', { name: 'Dine in' }).click();
  await expect(page).toHaveURL(/\/store\/demo\/menu$/);
  const footer = page.locator('.mobile-order-layout__footer');
  await expect(footer).toBeAttached();
  const paddingBottom = await footer.evaluate((el) => getComputedStyle(el).paddingBottom);
  expect(paddingBottom).toBe('0px');
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
