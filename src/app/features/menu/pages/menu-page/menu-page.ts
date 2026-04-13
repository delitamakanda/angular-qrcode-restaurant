import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { MenuItemCard } from '../../../../shared/ui/cards/menu-item-card/menu-item-card';
import { ActivatedRoute } from '@angular/router';
import { ShopStore } from '../../../../state/shop.store';
import { MenuStore } from '../../../../state/menu.store';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
  selector: 'app-menu-page',
  imports: [MenuItemCard],
  templateUrl: './menu-page.html',
  styleUrl: './menu-page.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuPage {
  private readonly route = inject(ActivatedRoute);
  private readonly shopStore = inject(ShopStore);
  readonly menuStore = inject(MenuStore);

  private readonly storeId = toSignal(
    this.route.parent!.paramMap.pipe(map(params => params.get('storeId'))),
  )

  constructor() {
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
