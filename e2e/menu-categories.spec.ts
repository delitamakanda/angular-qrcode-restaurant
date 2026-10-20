import { expect, test } from '@playwright/test';

test('category chips scroll to their section and follow the scroll', async ({ page }) => {
  await page.goto('/store/demo/welcome');
  await page.getByRole('button', { name: 'Dine in' }).click();
  await expect(page).toHaveURL(/\/store\/demo\/menu$/);

  const nav = page.getByRole('navigation', { name: 'Catégories du menu' });
  const chips = nav.getByRole('button');
  await expect(chips.first()).toBeVisible();
  const count = await chips.count();
  expect(count).toBeGreaterThan(1);

  const sections = page.locator('section.menu-page__section');
  await expect(sections).toHaveCount(count);
  await expect(sections.first().getByRole('heading', { level: 2 })).toBeVisible();

  const last = chips.nth(count - 1);
  await last.click();

  await expect(page).toHaveURL(/#category-/);
  await expect(last).toHaveAttribute('aria-current', 'true');
  await expect(sections.nth(count - 1).getByRole('heading', { level: 2 })).toBeInViewport();

  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(chips.first()).toHaveAttribute('aria-current', 'true');
});
