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

test('welcome page shows the promotion banner and lets the user dismiss it', async ({ page }) => {
  await page.goto('/store/demo/welcome');

  const banner = page.getByRole('region', { name: 'Offre promotionnelle' });
  await expect(banner).toBeVisible({ timeout: 15000 });
  await expect(banner).toContainText('WELCOME10');
  await expect(banner).toContainText('-10 €');

  await banner.getByRole('button', { name: 'Close' }).click();
  await expect(banner).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Select your order mode' })).toBeFocused();
});

test('welcome page still works when the promotion request fails', async ({ page }) => {
  await page.route('**/promotions**', (route) => route.abort());
  await page.goto('/store/demo/welcome');

  await expect(page.getByRole('group', { name: 'Order mode' })).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole('region', { name: 'Offre promotionnelle' })).toHaveCount(0);
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
