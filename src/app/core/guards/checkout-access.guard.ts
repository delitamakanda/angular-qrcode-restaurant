import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { CartStore } from '../../state/cart.store';

export const checkoutAccessGuard: CanActivateFn = () => {
  const cartStore = inject(CartStore);
  const router = inject(Router);
  if(!cartStore.items().length) {
    return router.createUrlTree(['../menu'])
  }
  return true;
};
