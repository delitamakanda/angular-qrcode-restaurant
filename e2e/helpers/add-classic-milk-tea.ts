import { expect, type Page } from '@playwright/test';

const persistedCartLength = (page: Page): Promise<number> =>
  page.evaluate(
    () => (JSON.parse(localStorage.getItem('cashier-cart:demo') ?? '[]') as unknown[]).length,
  );

/** Adds a Classic Milk Tea through the customization dialog (required groups only). */
export async function addClassicMilkTea(page: Page): Promise<void> {
  const linesBefore = await persistedCartLength(page);
  await page.getByRole('button', { name: 'Add to cart: Classic Milk Tea' }).click();
  const dialog = page.getByRole('dialog', { name: 'Classic Milk Tea' });
  await dialog.getByRole('radio', { name: 'Medium' }).check();
  await dialog.getByRole('radio', { name: '100%' }).check();
  await dialog.getByRole('radio', { name: 'Regular Ice' }).check();
  await dialog.getByRole('button', { name: /^Add · / }).click();
  await expect(dialog).toBeHidden();
  // CartStore persists from an effect() on the next tick: wait for it before callers reload the page.
  await expect.poll(() => persistedCartLength(page)).toBe(linesBefore + 1);
}
