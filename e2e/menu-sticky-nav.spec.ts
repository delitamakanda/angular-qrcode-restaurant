import { expect, test } from '@playwright/test';

for (const width of [320, 768]) {
  test(`menu search bar stays stuck to the top while scrolling at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 640 });
    await page.goto('/store/demo/welcome');
    await page.getByRole('button', { name: 'Dine in' }).click();
    await expect(page).toHaveURL(/\/store\/demo\/menu$/);

    const search = page.getByRole('searchbox', { name: 'Search a product' });
    await expect(page.getByRole('button', { name: 'Add to cart: Classic Milk Tea' })).toBeVisible();

    const nav = page.locator('.menu-page__nav');
    await expect(nav).toHaveCSS('position', 'sticky');

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

    await expect(search).toBeInViewport();
    const box = await nav.boundingBox();
    expect(box?.y).toBeLessThanOrEqual(1);
  });
}
