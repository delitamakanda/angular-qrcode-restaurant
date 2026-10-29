import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrderStatus } from '@app/core/models/order.model';
import { OrderLiveBanner } from './order-live-banner';

describe('OrderLiveBanner', () => {
  let fixture: ComponentFixture<OrderLiveBanner>;

  async function render(status: OrderStatus | undefined) {
    fixture = TestBed.createComponent(OrderLiveBanner);
    fixture.componentRef.setInput('status', status);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it.each(['pending', 'accepted', 'preparing', 'ready'] as const)(
    'shows a pulsing Live badge for %s',
    async (status) => {
      const root = await render(status);

      expect(root.textContent.trim()).toBe('Live');
      expect(root.querySelector('.order-live-banner_live')).not.toBeNull();
    },
  );

  it.each([
    ['completed', 'Completed'],
    ['cancelled', 'Cancelled'],
  ] as const)('shows a static %s badge', async (status, label) => {
    const root = await render(status);

    expect(root.textContent.trim()).toBe(label);
    expect(root.querySelector('.order-live-banner_live')).toBeNull();
  });

  it('treats a missing status as pending (Live)', async () => {
    const root = await render(undefined);

    expect(root.textContent.trim()).toBe('Live');
  });

  it('hides the decorative dot from assistive technology', async () => {
    const root = await render('ready');

    expect(root.querySelector('.order-live-banner__dot')?.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelector('[aria-live]')).toBeNull();
  });
});
