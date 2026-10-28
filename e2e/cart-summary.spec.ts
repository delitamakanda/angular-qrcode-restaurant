import { expect, test } from '@playwright/test';
import { addClassicMilkTea } from './helpers/add-classic-milk-tea';

test('cart and checkout keep the order summary stuck to the bottom of the viewport', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Dine in' }).click();
  await expect(page).toHaveURL(/\/store\/demo\/menu$/);
  await addClassicMilkTea(page);

  await page.goto('/store/demo/cart');

  const summary = page.getByRole('region', { name: 'Résumé de la commande' });
  await expect(summary).toBeVisible();
  await expect(summary).toContainText('1 item');
  await expect(summary).toContainText('Total:');
  await expect(summary).toHaveCSS('position', 'sticky');

  await summary.getByRole('button', { name: 'Checkout' }).click();
  await expect(page).toHaveURL(/\/store\/demo\/checkout$/);

  const checkoutSummary = page.getByRole('region', { name: 'Résumé de la commande' });
  await expect(checkoutSummary).toContainText('1 item');
  await expect(checkoutSummary.getByRole('button', { name: 'Submit' })).toBeVisible();

  await checkoutSummary.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByText('Phone number is required')).toBeVisible();
  await expect(page).toHaveURL(/\/store\/demo\/checkout$/);
});
