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

test('favorite button toggles, survives a reload and does not open customization', async ({
  page,
}) => {
  await page.goto('/store/demo/welcome');
  await page.getByRole('button', { name: 'Dine in' }).click();
  await expect(page).toHaveURL(/\/store\/demo\/menu$/);

  const card = () =>
    page
      .getByRole('article')
      .filter({ has: page.getByRole('heading', { name: 'Classic Milk Tea', exact: true }) });
  const add = card().getByRole('button', { name: 'Add to favorites: Classic Milk Tea' });

  await expect(add).toHaveAttribute('aria-pressed', 'false');
  await add.focus();
  await expect(add).toBeFocused();
  const box = await add.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);

  await page.keyboard.press('Enter');
  const remove = card().getByRole('button', { name: 'Remove from favorites: Classic Milk Tea' });
  await expect(remove).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await page.reload();
  await expect(
    card().getByRole('button', { name: 'Remove from favorites: Classic Milk Tea' }),
  ).toHaveAttribute('aria-pressed', 'true');
});
