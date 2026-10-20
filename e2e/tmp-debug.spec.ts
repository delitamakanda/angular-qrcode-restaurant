import { devices, test } from '@playwright/test';

test.use({ ...devices['Pixel 7'] });

test('debug', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Dine in' }).click();
  await page.getByRole('button', { name: 'Add to cart: Classic Milk Tea' }).waitFor();
  const out = await page.evaluate(() => {
    const res: string[] = [
      `scrollWidth ${document.documentElement.scrollWidth} inner ${innerWidth} scrollX ${scrollX}`,
    ];
    let el: Element | null = document.querySelector('app-menu-category-selection');
    while (el) {
      res.push(`${el.tagName}.${el.className} w=${el.getBoundingClientRect().width}`);
      el = el.parentElement;
    }
    const card = document.querySelector('app-menu-item-card');
    res.push(`card w=${card?.getBoundingClientRect().width}`);
    return res;
  });
  console.log(out.join('\n'));
});
