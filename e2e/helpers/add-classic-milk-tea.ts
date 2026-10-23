import { expect, type Page } from '@playwright/test';

/** Adds a Classic Milk Tea through the customization dialog (required groups only). */
export async function addClassicMilkTea(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Add to cart: Classic Milk Tea' }).click();
  const dialog = page.getByRole('dialog', { name: 'Classic Milk Tea' });
  await dialog.getByRole('radio', { name: 'Medium' }).check();
  await dialog.getByRole('radio', { name: '100%' }).check();
  await dialog.getByRole('radio', { name: 'Regular Ice' }).check();
  await dialog.getByRole('button', { name: /^Add · / }).click();
  await expect(dialog).toBeHidden();
}
