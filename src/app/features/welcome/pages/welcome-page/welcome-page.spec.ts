import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideTaiga } from '@taiga-ui/core';
import { APP_TOKEN_CONFIG } from '@app/core/config/app.token';
import { StoreApiService } from '@app/core/api/store-api.service';
import { Store } from '@app/core/models/store.model';
import { of } from 'rxjs';
import { ShopStore } from '@app/state/shop.store';
import { WelcomePage } from './welcome-page';

const store: Store = {
  id: 'other',
  name: 'Bubble House',
  currency: 'EUR',
  is_open: true,
  supported_modes: ['dine_in', 'delivery'],
};

const stores: Store[] = [store, { ...store, id: 'second', name: 'Second Place' }];

const providers = () => [
  provideTaiga(),
  provideRouter([]),
  { provide: APP_TOKEN_CONFIG, useValue: {} },
  { provide: StoreApiService, useValue: { getStores: () => of(stores) } },
];

function setup(overrides: Partial<Store> = {}) {
  TestBed.configureTestingModule({ providers: providers() });
  const shopStore = TestBed.inject(ShopStore);
  shopStore.store.set({ ...store, ...overrides });
  const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(WelcomePage);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  return { shopStore, navigate, fixture, el, buttons: Array.from(el.querySelectorAll('button')) };
}

describe('WelcomePage', () => {
  it('shows the store name and only the supported modes', () => {
    const { el, buttons } = setup();

    expect(el.querySelector('h1')?.textContent).toContain('Bubble House');
    expect(buttons.map((b) => b.textContent.trim())).toEqual(['Dine in', 'Delivery']);
  });

  it('sets the mode and navigates to the menu of the current store', () => {
    const { shopStore, navigate, buttons } = setup();

    buttons[1].click();

    expect(shopStore.selectedMode()).toBe('delivery');
    expect(navigate).toHaveBeenCalledWith(['/store', 'other', 'menu']);
  });

  it('disables the modes and shows a message when the store is closed', () => {
    const { el, buttons } = setup({ is_open: false });

    expect(buttons.every((b) => b.disabled)).toBe(true);
    expect(el.querySelector('[role="status"]')?.textContent).toContain('closed');
  });

  it('navigates to the welcome page of the chosen store', async () => {
    const { navigate, el, shopStore, fixture } = setup();
    await vi.waitFor(() => {
      expect(shopStore.stores().length).toBe(2);
    });
    fixture.detectChanges();

    const select = el.getElementsByTagName('select')[0];
    select.value = 'second';
    select.dispatchEvent(new Event('change'));

    expect(navigate).toHaveBeenCalledWith(['/store', 'second', 'welcome']);
  });

  it('renders nothing while the store is not loaded', () => {
    TestBed.configureTestingModule({ providers: providers() });
    const fixture = TestBed.createComponent(WelcomePage);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('h1')).toBeNull();
  });
});
