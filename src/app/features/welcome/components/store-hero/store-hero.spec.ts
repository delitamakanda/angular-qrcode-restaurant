import { TestBed } from '@angular/core/testing';
import { Store } from '@app/core/models/store.model';
import { StoreHero } from './store-hero';

const baseStore: Store = {
  id: 'demo',
  name: 'Bubble House',
  logo_url: '/images/logo.svg',
  cover_image_url: '/images/cover.svg',
  currency: 'EUR',
  is_open: true,
  estimated_wait_minutes: 18,
  supported_modes: ['dine_in'],
};

function render(store: Store): HTMLElement {
  const fixture = TestBed.createComponent(StoreHero);
  fixture.componentRef.setInput('store', store);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('StoreHero', () => {
  it('shows the name, logo, status and wait time', () => {
    const el = render(baseStore);

    expect(el.querySelector('h1')?.textContent).toContain('Bubble House');
    expect(el.querySelector('img[alt="Logo Bubble House"]')).not.toBeNull();
    expect(el.textContent).toContain('Open');
    expect(el.textContent).toContain('18 min');
  });

  it('shows the closed status and hides the wait time when not provided', () => {
    const el = render({ ...baseStore, is_open: false, estimated_wait_minutes: undefined });

    expect(el.textContent).toContain('Closed');
    expect(el.textContent).not.toContain('Estimated wait');
  });
});
