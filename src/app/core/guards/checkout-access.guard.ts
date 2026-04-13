import { ActivatedRoute, CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { CartStore } from '../../state/cart.store';

export const checkoutAccessGuard: CanActivateFn = () => {
  const cartStore = inject(CartStore);
  const router = inject(Router);
  const route = inject(ActivatedRoute);

  if(!cartStore.items().length) {
    return router.createUrlTree(['../menu'], { relativeTo: route }  );
  }
  return true;
};
