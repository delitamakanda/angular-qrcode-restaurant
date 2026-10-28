import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { OrderMode } from '@app/core/models/store.model';
import { ShopStore } from '@app/state/shop.store';
import { OrderModeSelector } from '../../components/order-mode-selector/order-mode-selector';
import { StoreHero } from '../../components/store-hero/store-hero';

@Component({
  selector: 'app-welcome-page',
  imports: [StoreHero, OrderModeSelector],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './welcome-page.html',
  styleUrl: './welcome-page.css',
})
export class WelcomePage {
  private readonly shopStore = inject(ShopStore);
  private readonly router = inject(Router);

  readonly store = this.shopStore.store;
  readonly selectedMode = this.shopStore.selectedMode;
  readonly isOpen = this.shopStore.isOpen;

  selectMode(mode: OrderMode): void {
    const store = this.store();
    if (!store?.is_open) {
      return;
    }
    this.shopStore.setMode(mode);
    void this.router.navigate(['/store', store.id, 'menu']);
  }
}
