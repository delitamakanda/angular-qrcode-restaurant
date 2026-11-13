import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { MIN_QUANTITY } from '@app/core/constants/quantity.constants';
import { MenuApiService } from '@app/core/api/menu-api.service';
import { MenuItem } from '@app/core/models/menu-item.model';
import { NotificationService } from '@app/core/services/notification.service';
import { CartStore } from '@app/state/cart.store';
import { TuiDialogService } from '@taiga-ui/core';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { Observable, ReplaySubject } from 'rxjs';
import {
  ProductCustomizationDialog,
  ProductCustomizationResult,
} from '../dialogs/product-customization-dialog/product-customization-dialog';
import { buildCartItem } from '../utils/customization-price';

@Injectable({ providedIn: 'root' })
export class ProductCustomizationService {
  private readonly dialogs = inject(TuiDialogService);
  private readonly document = inject(DOCUMENT);
  private readonly menuApi = inject(MenuApiService);
  private readonly cartStore = inject(CartStore);
  private readonly notifications = inject(NotificationService);

  /**
   * Loads the modifiers first so a product without groups is added directly,
   * without a dialog flashing open and closed. On a load error the dialog
   * opens anyway, to offer a retry.
   *
   * The returned stream emits once: `true` if the product was actually added to
   * the cart (directly or through the dialog), `false` if the customer gave up.
   */
  open(item: MenuItem): Observable<boolean> {
    const trigger = this.document.activeElement as HTMLElement | null;
    const outcome = new ReplaySubject<boolean>(1);
    const finish = (added: boolean): void => {
      outcome.next(added);
      outcome.complete();
    };

    this.menuApi.getItemWithModifiers(item.id).subscribe({
      next: (loaded) => {
        if (loaded.modifierGroups.length === 0) {
          this.cartStore.addToCart(buildCartItem(loaded, [], MIN_QUANTITY));
          this.notifications.success(`${loaded.name} added to cart`);
          finish(true);
          return;
        }
        this.openDialog(loaded, trigger, finish);
      },
      error: () => {
        this.openDialog(item, trigger, finish);
      },
    });
    return outcome.asObservable();
  }

  private openDialog(
    item: MenuItem,
    trigger: HTMLElement | null,
    finish: (added: boolean) => void,
  ): void {
    let added = false;

    this.dialogs
      .open<ProductCustomizationResult>(new PolymorpheusComponent(ProductCustomizationDialog), {
        label: item.name,
        appearance: 'bottom-sheet',
        size: 'l',
        data: item,
      })
      .subscribe({
        next: (result) => {
          added = result === 'added';
        },
        complete: () => {
          if (trigger?.isConnected) {
            trigger.focus();
          }
          finish(added);
        },
      });
  }
}
