import { expect, test } from '@playwright/test';
import { addClassicMilkTea } from './helpers/add-classic-milk-tea';

test('customer switches restaurant, with a separate cart and menu for each', async ({ page }) => {
  await page.goto('/store/demo/welcome');
  await expect(page.getByRole('heading', { level: 1, name: 'Bubble House' })).toBeVisible({
    timeout: 15000,
  });

  await page.getByRole('button', { name: 'Dine in' }).click();
  await expect(page.getByRole('heading', { name: 'Milk Tea', exact: true })).toBeVisible();
  await addClassicMilkTea(page);
  await expect(page.getByRole('button', { name: /View cart/ })).toBeVisible();

  await page.goto('/store/demo/welcome');
  await page.getByRole('combobox', { name: 'Restaurant' }).selectOption({ label: 'Sushi Zen' });
  await expect(page).toHaveURL(/\/store\/sushi-zen\/welcome$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Sushi Zen' })).toBeVisible();
  // Sushi Zen does not offer delivery.
  await expect(page.getByRole('button', { name: 'Delivery' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Dine in' }).click();
  await expect(page.getByRole('heading', { name: 'Nigiri', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Milk Tea', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /View cart/ })).toHaveCount(0);

  await page.goto('/store/demo/welcome');
  await page.getByRole('button', { name: 'Dine in' }).click();
  await expect(page.getByRole('button', { name: /View cart/ })).toBeVisible();
});

test('an unknown store redirects to the demo welcome page', async ({ page }) => {
  await page.goto('/store/nope/menu');

  await expect(page).toHaveURL(/\/store\/demo\/welcome$/, { timeout: 15000 });
  await expect(page.getByRole('heading', { level: 1, name: 'Bubble House' })).toBeVisible();
});
