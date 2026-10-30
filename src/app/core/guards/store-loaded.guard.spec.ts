import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, UrlTree, provideRouter } from '@angular/router';
import { ShopStore } from '@app/state/shop.store';
import { storeLoadedGuard } from './store-loaded.guard';

describe('storeLoadedGuard', () => {
  const loadStore = vi.fn();
  const current = { value: null as { id: string } | null };

  beforeEach(() => {
    loadStore.mockReset();
    current.value = null;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ShopStore, useValue: { loadStore, store: () => current.value } },
      ],
    });
  });

  const run = (storeId: string | null) => {
    const route = {
      paramMap: { get: () => storeId },
    } as unknown as ActivatedRouteSnapshot;
    return TestBed.runInInjectionContext(() => storeLoadedGuard(route, {} as never));
  };

  it('allows a store that loads', async () => {
    loadStore.mockResolvedValue(undefined);

    expect(await run('zen')).toBe(true);
    expect(loadStore).toHaveBeenCalledWith('zen');
  });

  it('does not reload the store already in memory', async () => {
    current.value = { id: 'zen' };

    expect(await run('zen')).toBe(true);
    expect(loadStore).not.toHaveBeenCalled();
  });

  it('redirects an unknown store to the demo welcome page', async () => {
    loadStore.mockRejectedValue(new Error('404'));

    const result = await run('nope');

    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/store/demo/welcome');
  });

  it('does not loop when the demo store itself fails', async () => {
    loadStore.mockRejectedValue(new Error('500'));

    await expect(run('demo')).rejects.toThrow('500');
  });
});
