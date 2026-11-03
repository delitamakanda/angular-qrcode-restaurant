import { TestBed } from '@angular/core/testing';
import { provideTaiga } from '@taiga-ui/core';
import { Promotion } from '@app/core/models/promotion.model';
import { CouponBanner } from './coupon-banner';

const promotion: Promotion = {
  id: 'p1',
  store_id: 'demo',
  code: 'WELCOME10',
  type: 'fixed',
  value: 10,
  is_active: true,
};

function setup(value: Promotion | null | undefined) {
  TestBed.configureTestingModule({ providers: [provideTaiga()] });
  const fixture = TestBed.createComponent(CouponBanner);
  fixture.componentRef.setInput('promotion', value);
  const dismissed = vi.fn();
  fixture.componentInstance.dismissed.subscribe(dismissed);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  return { fixture, el, dismissed };
}

const button = (el: HTMLElement, name: string) =>
  Array.from(el.querySelectorAll('button')).find((b) => b.textContent.includes(name));

describe('CouponBanner', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the code and a fixed amount', () => {
    const { el } = setup(promotion);

    expect(el.textContent).toContain('WELCOME10');
    expect(el.textContent).toContain('-10 €');
  });

  it('shows a percentage', () => {
    const { el } = setup({ ...promotion, type: 'percentage' });

    expect(el.textContent).toContain('-10 %');
  });

  it.each([null, undefined, { ...promotion, is_active: false }])(
    'renders nothing for %j',
    (value) => {
      const { el } = setup(value);

      expect(el.querySelector('section')).toBeNull();
    },
  );

  it('has a polite live region', () => {
    const { el } = setup(promotion);

    expect(el.querySelector('[aria-live="polite"]')).not.toBeNull();
  });

  it('copies the code and announces it', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const { el, fixture } = setup(promotion);

    button(el, 'Copy code')?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(writeText).toHaveBeenCalledWith('WELCOME10');
    expect(el.querySelector('[aria-live="polite"]')?.textContent).toContain('Code copied');
    vi.unstubAllGlobals();
  });

  it('does not throw when the clipboard is refused', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const { el, fixture } = setup(promotion);

    button(el, 'Copy code')?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(el.querySelector('[aria-live="polite"]')?.textContent.trim()).toBe('');
    expect(el.textContent).toContain('WELCOME10');
    vi.unstubAllGlobals();
  });

  it('emits dismissed and disappears on close', () => {
    const { el, fixture, dismissed } = setup(promotion);

    el.querySelector<HTMLButtonElement>('button[aria-label="Close"]')?.click();
    fixture.detectChanges();

    expect(dismissed).toHaveBeenCalledOnce();
    expect(el.querySelector('section')).toBeNull();
  });
});
