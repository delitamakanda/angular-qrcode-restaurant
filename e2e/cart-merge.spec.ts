import { expect, test } from '@playwright/test';
import { addClassicMilkTea } from './helpers/add-classic-milk-tea';

test('adding the same product twice merges into a single cart line', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Dine in' }).click();
  await expect(page).toHaveURL(/\/store\/demo\/menu$/);
  await addClassicMilkTea(page);

  // Second identical add: the persisted cart keeps one line (the helper expects a new one).
  await page.getByRole('button', { name: 'Add to cart: Classic Milk Tea' }).click();
  const dialog = page.getByRole('dialog', { name: 'Classic Milk Tea' });
  await dialog.getByRole('radio', { name: 'Medium' }).check();
  await dialog.getByRole('radio', { name: '100%' }).check();
  await dialog.getByRole('radio', { name: 'Regular Ice' }).check();
  await dialog.getByRole('button', { name: /^Add · / }).click();
  await expect(dialog).toBeHidden();

  await page.goto('/store/demo/cart');
  await expect(page.getByRole('button', { name: /^Increase quantity of / })).toHaveCount(1);
  await expect(page.getByRole('region', { name: 'Résumé de la commande' })).toContainText(
    '2 items',
  );
});
