import { expect, test } from '@playwright/test';

test('menu shows skeleton cards while loading, then the products', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));

  await page.route(/\/menus?\b/, async (route) => {
    await gate;
    await route.fallback();
  });

  await page.goto('/store/demo/welcome');
  await page.getByRole('button', { name: 'Dine in' }).click();
  await expect(page).toHaveURL(/\/store\/demo\/menu$/);

  await expect(page.getByRole('searchbox', { name: 'Search a product' })).toBeVisible();
  await expect(page.locator('app-menu-item-card-skeleton')).toHaveCount(6);
  await expect(page.locator('.menu-page__sections')).toHaveAttribute('aria-busy', 'true');
  await expect(page.getByRole('button', { name: /^Add to cart/ })).toHaveCount(0);

  release();

  await expect(page.getByRole('button', { name: 'Add to cart: Classic Milk Tea' })).toBeVisible();
  await expect(page.locator('app-menu-item-card-skeleton')).toHaveCount(0);
  await expect(page.locator('.menu-page__sections')).toHaveAttribute('aria-busy', 'false');
});
