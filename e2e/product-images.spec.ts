import { expect, test } from '@playwright/test';

test('menu cards show product images', async ({ page }) => {
  await page.goto('/store/demo/welcome');
  await page.getByRole('button', { name: 'Dine in' }).click();
  await expect(page).toHaveURL(/\/store\/demo\/menu$/);

  const card = page
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { name: 'Classic Milk Tea', exact: true }) });
  const image = card.locator('img');

  await expect(image).toHaveAttribute('alt', '');
  await expect(image).toHaveAttribute(
    'src',
    '/images/bubble-house/products/item-classic-milk-tea.webp',
  );
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

test('a product image that fails to load falls back to the placeholder', async ({ page }) => {
  await page.route('**/images/bubble-house/products/item-classic-milk-tea.webp', (route) =>
    route.abort(),
  );
  await page.goto('/store/demo/welcome');
  await page.getByRole('button', { name: 'Dine in' }).click();
  await expect(page).toHaveURL(/\/store\/demo\/menu$/);

  const image = page
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { name: 'Classic Milk Tea', exact: true }) })
    .locator('img');
  await expect(image).toHaveAttribute('src', '/images/placeholder-food.svg');
});

test('every product image is a WebP under 60 KB', async ({ request }) => {
  const response = await request.get('/api/menus');
  expect(response.ok()).toBe(true);
  const items = (await response.json()) as { image_url: string }[];
  expect(items.length).toBeGreaterThan(0);

  for (const { image_url } of items) {
    const image = await request.get(image_url);
    expect(image.ok(), image_url).toBe(true);
    const body = await image.body();
    expect(body.length, image_url).toBeLessThanOrEqual(60 * 1024);
    expect(body.toString('ascii', 0, 4), image_url).toBe('RIFF');
    expect(body.toString('ascii', 8, 12), image_url).toBe('WEBP');
  }
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
