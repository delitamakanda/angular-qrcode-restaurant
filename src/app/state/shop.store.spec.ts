import { TestBed } from '@angular/core/testing';
import { StoreApiService } from '@app/core/api/store-api.service';
import { Store } from '@app/core/models/store.model';
import { of } from 'rxjs';
import { ShopStore } from './shop.store';

const demo: Store = {
  id: 'demo',
  name: 'Demo',
  currency: 'EUR',
  is_open: true,
  supported_modes: ['dine_in', 'take_away', 'delivery'],
};
const zen: Store = { ...demo, id: 'zen', name: 'Zen', supported_modes: ['dine_in', 'take_away'] };
const kiosk: Store = { ...demo, id: 'kiosk', name: 'Kiosk', supported_modes: ['take_away'] };

describe('ShopStore', () => {
  const all = [demo, zen, kiosk];

  function setup() {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: StoreApiService,
          useValue: {
            getStores: () => of(all),
            getStore: (id: string) => of(all.find((s) => s.id === id)),
          },
        },
      ],
    });
    return TestBed.inject(ShopStore);
  }

  it('loadStores fills the list of stores', async () => {
    const shop = setup();

    await shop.loadStores();

    expect(shop.stores()).toEqual(all);
  });

  it('picks the first supported mode on first load', async () => {
    const shop = setup();

    await shop.loadStore('zen');

    expect(shop.store()?.id).toBe('zen');
    expect(shop.selectedMode()).toBe('dine_in');
  });

  it('keeps the selected mode when the new store supports it', async () => {
    const shop = setup();
    await shop.loadStore('demo');
    shop.setMode('take_away');

    await shop.loadStore('zen');

    expect(shop.selectedMode()).toBe('take_away');
  });

  it('falls back to the first supported mode when the new store does not support it', async () => {
    const shop = setup();
    await shop.loadStore('demo');
    shop.setMode('delivery');

    await shop.loadStore('zen');

    expect(shop.selectedMode()).toBe('dine_in');

    await shop.loadStore('kiosk');

    expect(shop.selectedMode()).toBe('take_away');
  });
});
