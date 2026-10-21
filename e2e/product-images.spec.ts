import { expect, test } from '@playwright/test';

test('menu cards show product images with a placeholder fallback', async ({ page }) => {
  await page.route('**/images/broken.jpg', (route) => route.abort());
  await page.goto('/store/demo/welcome');
  await page.getByRole('button', { name: 'Dine in' }).click();
  await expect(page).toHaveURL(/\/store\/demo\/menu$/);

  const card = page
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { name: 'Classic Milk Tea', exact: true }) });
  const image = card.locator('img');

  await expect(image).toHaveAttribute('alt', '');
  await expect(image).toHaveAttribute('src', '/images/placeholder-food.svg');
  await expect
    .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);

  const soldOut = page
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { name: 'Fried Chicken', exact: true }) });
  await expect(soldOut.locator('img')).toBeVisible();
  await expect(soldOut.getByText('Sold out', { exact: true })).toBeVisible();
  await expect(soldOut.getByRole('button', { name: /^Add to cart/ })).toBeDisabled();
});

test('only the first two menu images load eagerly', async ({ page }) => {
  await page.goto('/store/demo/welcome');
  await page.getByRole('button', { name: 'Dine in' }).click();
  await expect(page).toHaveURL(/\/store\/demo\/menu$/);

  const images = page.getByRole('article').locator('img');
  await expect(images.nth(2)).toBeAttached();

  const loading = await images.evaluateAll((imgs) => imgs.map((i) => i.getAttribute('loading')));
  expect(loading.slice(0, 2)).toEqual(['eager', 'eager']);
  expect(loading.slice(2).every((value) => value === 'lazy')).toBe(true);
});
