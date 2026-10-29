import { expect, test } from '@playwright/test';
import { addClassicMilkTea } from './helpers/add-classic-milk-tea';

const animationName = (locator: import('@playwright/test').Locator) =>
  locator.evaluate((el) => getComputedStyle(el).animationName);

test('cart bar slides in and its counter pops on change', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/store/demo/welcome');
  await page.getByRole('button', { name: 'Dine in' }).click();

  await addClassicMilkTea(page);

  const bar = page.getByRole('button', { name: /View cart/ });
  await expect(bar).toContainText('1 item');
  const count = bar.locator('.bottom-cart-bar__count');
  expect(await animationName(count)).toBe('none');

  await addClassicMilkTea(page);
  await expect(bar).toContainText('2 items');
  expect(await animationName(count)).toContain('bottom-cart-bar-pop-');

  // Only transform and opacity are animated, in at most 300 ms.
  const durations = await bar.evaluate((el) => getComputedStyle(el).animationDuration);
  expect(parseFloat(durations)).toBeLessThanOrEqual(0.3);
});

test('no animation plays with prefers-reduced-motion: reduce', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/store/demo/welcome');
  await page.getByRole('button', { name: 'Dine in' }).click();

  await addClassicMilkTea(page);
  await addClassicMilkTea(page);

  const bar = page.getByRole('button', { name: /View cart/ });
  await expect(bar).toContainText('2 items');
  expect(await animationName(bar)).toBe('none');
  expect(await animationName(bar.locator('.bottom-cart-bar__count'))).toBe('none');
});
