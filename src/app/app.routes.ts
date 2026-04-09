import { Routes } from '@angular/router';
import { storeLoadedGuard } from './core/guards/store-loaded.guard';
import { checkoutAccessGuard } from './core/guards/checkout-access.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'store/demo/welcome',
    pathMatch: 'full'
  },
  {
    path: 'store/:storeId',
    canActivate: [storeLoadedGuard],
    loadComponent: () => import('./features/shop-shell/shop-shell').then(m => m.ShopShell),
    children: [
      {
        path: 'welcome',
        loadComponent: () => import('./features/welcome/pages/welcome-page/welcome-page').then(m => m.WelcomePage)
      },
      {
        path: 'menu',
        loadComponent: () => import('./features/menu/pages/menu-page/menu-page').then(m => m.MenuPage)
      },
      {
        path: 'cart',
        loadComponent: () => import('./features/cart/pages/cart-page/cart-page').then(m => m.CartPage)
      },
      {
        path: 'checkout',
        canActivate: [checkoutAccessGuard],
        loadComponent: () => import('./features/checkout/pages/checkout-page/checkout-page').then(m => m.CheckoutPage)
      },
      {
        path: 'confirmation/:orderId',
        loadComponent: () => import('./features/order-confirmation/pages/order-confirmation-page/order-confirmation-page').then(m => m.OrderConfirmationPage)
      },
      {
        path: 'tracking/:orderId',
        loadComponent: () => import('./features/order-tracking/pages/order-tracking-page/order-tracking-page').then(m => m.OrderTrackingPage)
      }
    ]
  }, {
    path: '**',
    redirectTo: 'store/demo/welcome',
  }
];
