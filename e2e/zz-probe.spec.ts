import { test } from '@playwright/test';

test('probe', async ({ page }) => {
  await page.goto('/store/demo/welcome');
  await page.getByRole('button', { name: 'Dine in' }).click();
  await page.getByRole('button', { name: 'Add to cart: Classic Milk Tea' }).click();
  await page.waitForTimeout(1000);
  const out = await page.evaluate(() => {
    let o = '';
    let e: Element | null = document.querySelector('[role=dialog]');
    while (e && e !== document.body) {
      o += `${e.tagName} ${e.getAttribute('data-appearance') ?? ''} | ${getComputedStyle(e).animationName}\n`;
      e = e.parentElement;
    }
    const d = document.querySelector('[role=dialog]');
    o += document.querySelectorAll('tui-dialog').length + ' tui-dialog\n';
    o += d?.outerHTML.slice(0, 400);
    return o;
  });
  console.log(out);
});
