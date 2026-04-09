import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { ShopStore } from '../../state/shop.store';

export const storeLoadedGuard: CanActivateFn = async route => {
  const shopStore = inject(ShopStore);
  const storeId = route.paramMap.get('storeId');

  if (!storeId) {
    return false;
  }
  if (shopStore.store()?.id !== storeId) {
    await shopStore.loadStore(storeId);
  }
  return true;
};
