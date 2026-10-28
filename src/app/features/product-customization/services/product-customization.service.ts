import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { MenuApiService } from '@app/core/api/menu-api.service';
import { MenuItem } from '@app/core/models/menu-item.model';
import { NotificationService } from '@app/core/services/notification.service';
import { CartStore } from '@app/state/cart.store';
import { TuiDialogService } from '@taiga-ui/core';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import {
  ProductCustomizationDialog,
  ProductCustomizationResult,
} from '../dialogs/product-customization-dialog/product-customization-dialog';
import { MIN_QUANTITY, buildCartItem } from '../utils/customization-price';

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
   */
  open(item: MenuItem): void {
    const trigger = this.document.activeElement as HTMLElement | null;

    this.menuApi.getItemWithModifiers(item.id).subscribe({
      next: (loaded) => {
        if (loaded.modifierGroups.length === 0) {
          this.cartStore.addToCart(buildCartItem(loaded, [], MIN_QUANTITY));
          this.notifications.success(`${loaded.name} added to cart`);
          return;
        }
        this.openDialog(loaded, trigger);
      },
      error: () => {
        this.openDialog(item, trigger);
      },
    });
  }

  private openDialog(item: MenuItem, trigger: HTMLElement | null): void {
    this.dialogs
      .open<ProductCustomizationResult>(new PolymorpheusComponent(ProductCustomizationDialog), {
        label: item.name,
        appearance: 'bottom-sheet',
        size: 'l',
        data: item,
      })
      .subscribe({
        complete: () => {
          if (trigger?.isConnected) {
            trigger.focus();
          }
        },
      });
  }
}
