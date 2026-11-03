import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { catchError, filter, of, switchMap } from 'rxjs';
import { PromotionApiService } from '@app/core/api/promotion-api.service';
import { CouponBanner } from '../../../promotions/components/coupon-banner/coupon-banner';
import { OrderMode } from '@app/core/models/store.model';
import { ShopStore } from '@app/state/shop.store';
import { OrderModeSelector } from '../../components/order-mode-selector/order-mode-selector';
import { StoreHero } from '../../components/store-hero/store-hero';
import { StoreSwitcher } from '../../components/store-switcher/store-switcher';

@Component({
  selector: 'app-welcome-page',
  imports: [StoreHero, OrderModeSelector, StoreSwitcher, CouponBanner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './welcome-page.html',
  styleUrl: './welcome-page.css',
})
export class WelcomePage {
  private readonly shopStore = inject(ShopStore);
  private readonly router = inject(Router);
  private readonly promotionApi = inject(PromotionApiService);
  private readonly title = viewChild<ElementRef<HTMLElement>>('title');

  readonly store = this.shopStore.store;
  readonly selectedMode = this.shopStore.selectedMode;
  readonly isOpen = this.shopStore.isOpen;
  readonly stores = this.shopStore.stores;

  private readonly storeId = computed(() => this.store()?.id);

  // The banner is optional: a failed request simply shows nothing.
  readonly promotion = toSignal(
    toObservable(this.storeId).pipe(
      filter((id): id is string => !!id),
      switchMap((id) => this.promotionApi.getActivePromotion(id).pipe(catchError(() => of(null)))),
    ),
    { initialValue: null },
  );

  constructor() {
    // The switcher is optional: the page still works if the list cannot be loaded.
    this.shopStore.loadStores().catch(() => undefined);
  }

  onPromotionDismissed(): void {
    // The focused "Close" button is removed: keep the focus on the next logical element.
    this.title()?.nativeElement.focus();
  }

  selectStore(storeId: string): void {
    void this.router.navigate(['/store', storeId, 'welcome']);
  }

  selectMode(mode: OrderMode): void {
    const store = this.store();
    if (!store?.is_open) {
      return;
    }
    this.shopStore.setMode(mode);
    void this.router.navigate(['/store', store.id, 'menu']);
  }
}
