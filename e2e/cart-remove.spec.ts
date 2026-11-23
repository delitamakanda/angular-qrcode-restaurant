import { expect, test } from '@playwright/test';
import { addClassicMilkTea } from './helpers/add-classic-milk-tea';

test('cart page Remove button deletes the line, announces it and keeps the focus', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Dine in' }).click();
  await expect(page).toHaveURL(/\/store\/demo\/menu$/);
  await addClassicMilkTea(page);

  await page.goto('/store/demo/cart');
  await page.getByRole('button', { name: /^Remove .* from cart$/ }).click();

  await expect(page.getByText('Your cart is empty')).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'retiré du panier' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'View menu' })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Checkout' })).toHaveCount(0);
});
