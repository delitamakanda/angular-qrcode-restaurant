import { expect, test } from '@playwright/test';

test('menu card shows name, description, price and add button without "Price:" label', async ({
  page,
}) => {
  await page.goto('/store/demo/welcome');
  await page.getByRole('button', { name: 'Dine in' }).click();
  await expect(page).toHaveURL(/\/store\/demo\/menu$/);

  const card = page
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { name: 'Classic Milk Tea', exact: true }) });

  await expect(card.getByRole('heading', { level: 3 })).toHaveText('Classic Milk Tea');
  await expect(card.getByText('Black tea, milk, balanced sweetness')).toBeVisible();
  await expect(card.getByText('$55.00')).toBeVisible();
  await expect(card.getByText('Price:')).toHaveCount(0);

  const button = card.getByRole('button', { name: 'Add to cart: Classic Milk Tea' });
  await button.focus();
  await expect(button).toBeFocused();
  const box = await button.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
});
