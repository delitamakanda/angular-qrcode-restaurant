import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { MenuItem } from '@app/core/models/menu-item.model';
import { TuiDialogService } from '@taiga-ui/core';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import {
  ProductCustomizationDialog,
  ProductCustomizationResult,
} from '../dialogs/product-customization-dialog/product-customization-dialog';

@Injectable({ providedIn: 'root' })
export class ProductCustomizationService {
  private readonly dialogs = inject(TuiDialogService);
  private readonly document = inject(DOCUMENT);

  open(item: MenuItem): void {
    const trigger = this.document.activeElement as HTMLElement | null;

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
