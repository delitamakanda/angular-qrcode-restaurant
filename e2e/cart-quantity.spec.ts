import { expect, test } from '@playwright/test';
import { addClassicMilkTea } from './helpers/add-classic-milk-tea';

test('cart page quantity stepper updates the line, the summary and removes at 1', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Dine in' }).click();
  await expect(page).toHaveURL(/\/store\/demo\/menu$/);
  await addClassicMilkTea(page);

  await page.goto('/store/demo/cart');

  const summary = page.getByRole('region', { name: 'Résumé de la commande' });
  await expect(summary).toContainText('1 item');

  await page.getByRole('button', { name: /^Increase quantity of / }).click();
  await expect(summary).toContainText('2 items');

  await page.getByRole('button', { name: /^Decrease quantity of / }).click();
  await expect(summary).toContainText('1 item');

  await page.getByRole('button', { name: /^Decrease quantity of / }).click();
  await expect(page.getByText('Your cart is empty')).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'retiré du panier' })).toBeVisible();
});
