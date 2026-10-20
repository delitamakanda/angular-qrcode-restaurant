import { expect, test } from '@playwright/test';

test('category row filters the menu and marks the active entry', async ({ page }) => {
  await page.goto('/store/demo/welcome');
  await page.getByRole('button', { name: 'Dine in' }).click();
  await expect(page).toHaveURL(/\/store\/demo\/menu$/);

  const group = page.getByRole('group', { name: 'Catégories du menu' });
  const all = group.getByRole('button', { name: 'Tout' });
  await expect(all).toHaveAttribute('aria-pressed', 'true');

  const addButtons = page.getByRole('button', { name: /^Add to cart/ });
  await expect(addButtons.first()).toBeVisible();
  const total = await addButtons.count();

  const second = group.getByRole('button').nth(1);
  await second.click();

  await expect(second).toHaveAttribute('aria-pressed', 'true');
  await expect(all).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => addButtons.count()).toBeLessThan(total);

  await all.click();
  await expect(all).toHaveAttribute('aria-pressed', 'true');
  await expect(addButtons).toHaveCount(total);
});
