import { expect, test } from '@playwright/test';

test('confirmation page shows an error when the order is not found', async ({ page }) => {
  await page.route('**/orders/unknown-order', (route) =>
    route.fulfill({ status: 404, json: { message: 'Not found' } }),
  );

  await page.goto('/store/demo/confirmation/unknown-order');

  await expect(page.getByText('Commande introuvable')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Retour au menu' })).toHaveAttribute(
    'href',
    '/store/demo/menu',
  );
});
