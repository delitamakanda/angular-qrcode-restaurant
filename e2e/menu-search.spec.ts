import { expect, test } from '@playwright/test';

test('menu search filters the grid, shows an empty state and clears back', async ({ page }) => {
  await page.goto('/store/demo/welcome');
  await page.getByRole('button', { name: 'Dine in' }).click();
  await expect(page).toHaveURL(/\/store\/demo\/menu$/);

  const addButtons = page.getByRole('button', { name: /^Add to cart/ });
  await expect(addButtons.first()).toBeVisible();
  const total = await addButtons.count();

  const search = page.getByRole('searchbox', { name: 'Search a product' });
  await search.fill('CLASSIC milk');
  await expect(page.getByRole('button', { name: 'Add to cart: Classic Milk Tea' })).toBeVisible();
  await expect.poll(() => addButtons.count()).toBeLessThan(total);
  await expect(page.getByRole('status').filter({ hasText: /\d+ results?/ })).toBeVisible();

  await search.fill('zzzz-no-match');
  await expect(page.getByText('No results for “zzzz-no-match”')).toBeVisible();
  await expect(addButtons).toHaveCount(0);

  await page.getByRole('button', { name: 'Clear search' }).click();
  await expect(search).toBeFocused();
  await expect(search).toHaveValue('');
  await expect(addButtons).toHaveCount(total);
});
