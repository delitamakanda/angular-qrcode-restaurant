import { expect, test, type Locator } from '@playwright/test';

const sheet = (dialog: Locator) => dialog.locator('tui-dialog[data-appearance="bottom-sheet"]');

const animation = (locator: Locator) =>
  locator.evaluate((el) => {
    const style = getComputedStyle(el);
    return { name: style.animationName, duration: parseFloat(style.animationDuration) };
  });

test('product dialog slides up when opened', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/store/demo/welcome');
  await page.getByRole('button', { name: 'Dine in' }).click();
  await page.getByRole('button', { name: 'Add to cart: Classic Milk Tea' }).click();

  const dialog = page.getByRole('dialog', { name: 'Classic Milk Tea' });
  await expect(dialog).toBeVisible();

  const { name, duration } = await animation(sheet(dialog));
  expect(name).toBe('app-dialog-slide-up');
  expect(duration).toBeGreaterThan(0);
  expect(duration).toBeLessThanOrEqual(0.3);
});

test('no dialog animation with prefers-reduced-motion: reduce', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/store/demo/welcome');
  await page.getByRole('button', { name: 'Dine in' }).click();
  const trigger = page.getByRole('button', { name: 'Add to cart: Classic Milk Tea' });
  await trigger.click();

  const dialog = page.getByRole('dialog', { name: 'Classic Milk Tea' });
  await expect(dialog).toBeVisible();
  expect((await animation(sheet(dialog))).name).toBe('none');

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});
