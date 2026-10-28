import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { TuiDialogService } from '@taiga-ui/core';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import {
  CartBottomSheet,
  type CartSheetResult,
} from '../cart/sheets/cart-bottom-sheet/cart-bottom-sheet';
import { MobileOrderLayout } from '@app/layouts/mobile-order-layout/mobile-order-layout';
import { AppHeader } from '@shared/ui/layout/app-header/app-header';
import { BottomCartBar } from '@shared/ui/layout/bottom-cart-bar/bottom-cart-bar';

@Component({
  selector: 'app-shop-shell',
  imports: [RouterOutlet, AppHeader, BottomCartBar, MobileOrderLayout],
  templateUrl: './shop-shell.html',
  styleUrl: './shop-shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopShell {
  private readonly dialogs = inject(TuiDialogService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);

  // These pages carry their own sticky summary bar: avoid stacking two bars.
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  protected readonly showCartBar = computed(() => !/\/(cart|checkout)(\?|#|$)/.test(this.url()));

  openCart(): void {
    const trigger = this.document.activeElement as HTMLElement | null;

    this.dialogs
      .open<CartSheetResult>(new PolymorpheusComponent(CartBottomSheet), {
        label: 'Panier',
        appearance: 'bottom-sheet',
        size: 'l',
      })
      .subscribe({
        next: (result) => {
          if (result === 'checkout') {
            void this.router.navigate(['checkout'], { relativeTo: this.route });
          } else if (result === 'menu') {
            void this.router.navigate(['menu'], { relativeTo: this.route });
          }
        },
        complete: () => {
          if (trigger?.isConnected) {
            trigger.focus();
          }
        },
      });
  }
}
