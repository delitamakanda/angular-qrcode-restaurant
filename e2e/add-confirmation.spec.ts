import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/store/demo/welcome');
  await page.getByRole('button', { name: 'Dine in' }).click();
});

test('a direct add shows "Added" on the card, announces it, then resets', async ({ page }) => {
  await page.getByRole('button', { name: 'Add to cart: Douhua' }).click();

  const added = page.getByRole('button', { name: 'Added to cart: Douhua' });
  await expect(added).toContainText('Added');
  await expect(page.getByRole('status').filter({ hasText: 'Douhua added to cart' })).toBeAttached();

  await expect(page.getByRole('button', { name: 'Add to cart: Douhua' })).toBeVisible({
    timeout: 4000,
  });
});

test('opening the customization sheet alone does not confirm anything', async ({ page }) => {
  await page.getByRole('button', { name: 'Add to cart: Classic Milk Tea' }).click();
  const dialog = page.getByRole('dialog', { name: 'Classic Milk Tea' });
  await expect(dialog).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();

  await expect(page.getByRole('button', { name: 'Add to cart: Classic Milk Tea' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Added to cart/ })).toHaveCount(0);
});

test('adding through the sheet confirms on the originating card', async ({ page }) => {
  await page.getByRole('button', { name: 'Add to cart: Classic Milk Tea' }).click();
  const dialog = page.getByRole('dialog', { name: 'Classic Milk Tea' });
  await dialog.getByRole('radio', { name: 'Medium' }).check();
  await dialog.getByRole('radio', { name: '100%' }).check();
  await dialog.getByRole('radio', { name: 'Regular Ice' }).check();
  await dialog.getByRole('button', { name: /^Add · / }).click();

  await expect(page.getByRole('button', { name: 'Added to cart: Classic Milk Tea' })).toBeVisible();
});

test('with reduced motion the Added state stays but does not animate', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Add to cart: Douhua' }).click();

  const added = page.getByRole('button', { name: 'Added to cart: Douhua' });
  await expect(added).toContainText('Added');
  expect(await added.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
});
