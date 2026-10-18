import { expect, test } from '@playwright/test';

test('menu cards show popular, new and sold out badges', async ({ page }) => {
  await page.goto('/store/demo/welcome');
  await page.getByRole('button', { name: 'Dine in' }).click();
  await expect(page).toHaveURL(/\/store\/demo\/menu$/);

  const card = (name: string) =>
    page.getByRole('article').filter({ has: page.getByRole('heading', { name, exact: true }) });

  await expect(card('Classic Milk Tea').getByText('Popular', { exact: true })).toBeVisible();
  await expect(card('Taro Milk Tea').getByText('New', { exact: true })).toBeVisible();

  const soldOut = card('Fried Chicken');
  await expect(soldOut.getByText('Sold out', { exact: true })).toBeVisible();
  await expect(soldOut.getByRole('button')).toHaveCount(0);

  const plain = card('Passion Fruit Green Tea');
  await expect(plain.locator('app-product-badge')).toHaveCount(0);
  await expect(plain.getByRole('button', { name: /^Add to cart/ })).toBeVisible();
});
