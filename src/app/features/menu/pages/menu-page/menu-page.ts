import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { MenuItemCard } from '../../../../shared/ui/cards/menu-item-card/menu-item-card';
import { ActivatedRoute } from '@angular/router';
import { ShopStore } from '../../../../state/shop.store';
import { MenuStore } from '../../../../state/menu.store';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { map, EMPTY } from 'rxjs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TuiIcon, TuiLabel, TuiTextfield } from '@taiga-ui/core';

@Component({
  selector: 'app-menu-page',
  imports: [MenuItemCard, ReactiveFormsModule, TuiTextfield, TuiLabel, TuiIcon],
  templateUrl: './menu-page.html',
  styleUrl: './menu-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuPage {
  private readonly route = inject(ActivatedRoute);
  private readonly shopStore = inject(ShopStore);
  readonly menuStore = inject(MenuStore);

  private readonly storeId = toSignal(
    (this.route.parent?.paramMap ?? EMPTY).pipe(map((params) => params.get('storeId'))),
  );

  protected readonly searchControl = new FormControl(this.menuStore.searchTerm(), {
    nonNullable: true,
  });

  constructor() {
    this.searchControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((term) => {
      this.menuStore.setSearchTerm(term);
    });

    effect(() => {
      const storeId = this.storeId() as string | null;
      const mode = this.shopStore.selectedMode();

      if (!storeId || !mode) {
        return;
      }
      void this.menuStore.loadMenu(storeId, mode);
    });
  }
}
