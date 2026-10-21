import { expect, test } from '@playwright/test';

test('settings page is reachable from the header and shows its sections', async ({ page }) => {
  await page.goto('/store/demo/welcome');

  await page
    .getByRole('banner')
    .getByRole('link', { name: 'Paramètres' })
    .click({ timeout: 15000 });

  await expect(page).toHaveURL(/\/store\/demo\/settings$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Paramètres' })).toBeVisible();
  for (const name of ['Langue', 'Apparence', 'À propos']) {
    await expect(page.getByRole('heading', { level: 2, name })).toBeVisible();
  }
  await expect(page.getByText('Bientôt disponible')).toHaveCount(2);
  await page.screenshot({ path: '.agent-out/playwright/1-settings-page.png' });

  await page.getByRole('link', { name: "Retour à l'accueil" }).click();
  await expect(page).toHaveURL(/\/store\/demo\/welcome$/);
});
