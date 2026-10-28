import { expect, test } from '@playwright/test';

test('welcome page shows the store and leads to the menu', async ({ page }) => {
  await page.goto('/store/demo/welcome');

  await expect(page.getByRole('heading', { level: 1, name: 'Bubble House' })).toBeVisible({
    timeout: 15000,
  });
  await expect(page.getByRole('img', { name: 'Logo Bubble House' })).toBeVisible();
  const group = page.getByRole('group', { name: 'Order mode' });
  await expect(group.getByRole('button')).toHaveCount(3);
  await expect(group.getByRole('button', { name: 'Dine in' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await group.getByRole('button', { name: 'Take away' }).click();
  await expect(page).toHaveURL(/\/store\/demo\/menu$/);
});

test('welcome page blocks ordering when the store is closed', async ({ page }) => {
  await page.route('**/stores/demo', async (route) => {
    const response = await route.fetch();
    const body = (await response.json()) as object;
    await route.fulfill({ response, json: { ...body, is_open: false } });
  });
  await page.goto('/store/demo/welcome');

  await expect(page.getByText('This restaurant is currently closed')).toBeVisible({
    timeout: 15000,
  });
  await expect(page.getByRole('button', { name: 'Dine in' })).toBeDisabled();
});
