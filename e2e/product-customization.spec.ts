import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/store/demo/welcome');
  await page.getByRole('button', { name: 'Dine in' }).click();
  await expect(page).toHaveURL(/\/store\/demo\/menu$/);
});

test('customer customizes a product and adds it to the cart', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Add to cart: Classic Milk Tea' });
  await trigger.click();

  const dialog = page.getByRole('dialog', { name: 'Classic Milk Tea' });
  await expect(dialog.getByRole('group', { name: /Size/ })).toBeVisible();
  const add = dialog.getByRole('button', { name: /^Add · / });
  await expect(add).toBeDisabled();
  await expect(add).toContainText('$55.00');

  await dialog.getByRole('radio', { name: 'Large' }).check();
  await dialog.getByRole('radio', { name: '50%' }).check();
  await dialog.getByRole('radio', { name: 'Less Ice' }).check();
  await expect(add).toBeEnabled();
  await expect(add).toContainText('$65.00');

  await dialog.getByRole('radio', { name: /Boba/ }).check();
  await dialog.getByRole('button', { name: 'Increase quantity' }).click();
  await expect(add).toContainText('$150.00');

  await add.click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('Classic Milk Tea added to cart')).toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(page.getByRole('button', { name: /View cart/ })).toContainText('2 items');
});

test('shows the product title, selected state and a footer that stays in view', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.getByRole('button', { name: 'Add to cart: Classic Milk Tea' }).click();

  const dialog = page.getByRole('dialog', { name: 'Classic Milk Tea' });
  await expect(dialog.locator('.customization__name')).toHaveText('Classic Milk Tea');

  const large = dialog.getByRole('radio', { name: 'Large' });
  await large.check();
  await expect(large.locator('xpath=ancestor::label')).toHaveClass(/--selected/);

  await dialog.getByRole('textbox').scrollIntoViewIfNeeded();
  await expect(dialog.getByRole('button', { name: /^Add · / })).toBeInViewport();
  await expect(dialog.getByRole('button', { name: 'Increase quantity' })).toBeInViewport();
});

test('closing the dialog adds nothing and restores focus', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Add to cart: Classic Milk Tea' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Classic Milk Tea' });
  await expect(dialog).toBeVisible();

  await page.keyboard.press('Escape');

  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.getByRole('button', { name: /View cart/ })).toHaveCount(0);
});

test('shows an error with a retry when options fail to load', async ({ page }) => {
  let fail = true;
  await page.route(/\/groups\?/, async (route) => {
    if (fail) {
      await route.fulfill({ status: 500, json: {} });
      return;
    }
    await route.fallback();
  });

  await page.getByRole('button', { name: 'Add to cart: Classic Milk Tea' }).click();
  const dialog = page.getByRole('dialog', { name: 'Classic Milk Tea' });
  await expect(dialog.getByRole('alert')).toContainText('could not load');

  fail = false;
  await dialog.getByRole('button', { name: 'Retry' }).click();
  await expect(dialog.getByRole('radio', { name: 'Medium' })).toBeVisible();
});
