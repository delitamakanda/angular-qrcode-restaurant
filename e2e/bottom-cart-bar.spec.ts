import { expect, test } from '@playwright/test';
import { addClassicMilkTea } from './helpers/add-classic-milk-tea';

test('bottom cart bar is sticky once the cart has an item and opens the cart', async ({ page }) => {
  await page.goto('/store/demo/welcome');
  await page.getByRole('button', { name: 'Dine in' }).click();
  await expect(page).toHaveURL(/\/store\/demo\/menu$/);

  const bar = page.getByRole('button', { name: /View cart/ });
  await expect(bar).toHaveCount(0);

  await addClassicMilkTea(page);

  await expect(bar).toHaveCount(1);
  await expect(bar).toContainText('1 item');
  await expect(bar).toContainText('$');

  // The bar slides in: measure it once the entry animation is over.
  await bar.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
  const box = await bar.boundingBox();
  const viewport = page.viewportSize();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(viewport?.height ?? 0);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const scrolled = await bar.boundingBox();
  expect((scrolled?.y ?? 0) + (scrolled?.height ?? 0)).toBeLessThanOrEqual(viewport?.height ?? 0);
  expect(scrolled?.y ?? 0).toBeGreaterThan(0);

  await bar.click();
  await expect(page.getByRole('dialog', { name: 'Panier' })).toBeVisible();
});
