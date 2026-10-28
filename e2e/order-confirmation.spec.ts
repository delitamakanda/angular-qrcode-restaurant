import { expect, test } from '@playwright/test';

test('confirmation page shows an error when the order is not found', async ({ page }) => {
  await page.route('**/orders/unknown-order', (route) =>
    route.fulfill({ status: 404, json: { message: 'Not found' } }),
  );

  await page.goto('/store/demo/confirmation/unknown-order');

  await expect(
    page.getByText('Order not found or network error. Please try again later.'),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to Menu' })).toHaveAttribute(
    'href',
    '/store/demo/menu',
  );
});
