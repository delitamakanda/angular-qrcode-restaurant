import { expect, test } from '@playwright/test';

const WELCOME = '/store/demo/welcome';

test('viewport resizes with the keyboard and keeps user zoom enabled', async ({ page }) => {
  await page.goto(WELCOME);
  const content = await page.locator('meta[name="viewport"]').getAttribute('content');
  expect(content).toContain('interactive-widget=resizes-content');
  expect(content).not.toContain('maximum-scale');
  expect(content).not.toContain('user-scalable');
});

test('theme-color meta follows the stored dark theme', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('app-theme', 'dark');
  });
  await page.goto(WELCOME);
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#121212');
});

test('theme-color meta is the brand red in the light theme', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('app-theme', 'light');
  });
  await page.goto(WELCOME);
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#e8141c');
});

test('no horizontal scroll at 360px on the welcome page', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto(WELCOME);
  await page.getByRole('button', { name: 'Dine in' }).waitFor();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});
