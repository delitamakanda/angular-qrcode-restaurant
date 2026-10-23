import { expect, test } from '@playwright/test';

test('settings page is reachable from the header and shows its sections', async ({ page }) => {
  await page.goto('/store/demo/welcome');

  await page.getByRole('banner').getByRole('link', { name: 'Settings' }).click({ timeout: 15000 });

  await expect(page).toHaveURL(/\/store\/demo\/settings$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();
  for (const name of ['Language', 'Appearance', 'About']) {
    await expect(page.getByRole('heading', { level: 2, name })).toBeVisible();
  }
  await expect(page.getByText('Coming soon')).toHaveCount(1);

  await page.getByRole('link', { name: 'Back to home' }).click();
  await expect(page).toHaveURL(/\/store\/demo\/welcome$/);
});

test('theme choice applies immediately and survives a reload', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/store/demo/settings');
  const group = page.getByRole('radiogroup', { name: 'Appearance' });
  const html = page.locator('html');

  await expect(group.getByRole('radio', { name: 'System' })).toBeChecked({ timeout: 15000 });
  await expect(html).toHaveAttribute('data-theme', 'light');

  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(html).toHaveAttribute('data-theme', 'dark');

  await group.getByRole('radio', { name: 'Light' }).check();
  await expect(html).toHaveAttribute('data-theme', 'light');

  await group.getByRole('radio', { name: 'Dark' }).check();
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(18, 18, 18)');

  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await expect(group.getByRole('radio', { name: 'Dark' })).toBeChecked({ timeout: 15000 });
});
