import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { ShopStore } from '@app/state/shop.store';

const FALLBACK_STORE_ID = 'demo';

export const storeLoadedGuard: CanActivateFn = async (route) => {
  const shopStore = inject(ShopStore);
  const router = inject(Router);
  const storeId = route.paramMap.get('storeId');

  if (!storeId) {
    return false;
  }
  if (shopStore.store()?.id !== storeId) {
    try {
      await shopStore.loadStore(storeId);
    } catch (error) {
      // Unknown store: fall back to the default one, unless it is the one failing.
      if (storeId === FALLBACK_STORE_ID) {
        throw error;
      }
      return router.parseUrl(`/store/${FALLBACK_STORE_ID}/welcome`);
    }
  }
  return true;
};
