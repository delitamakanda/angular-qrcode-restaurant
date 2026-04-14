import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShopStore } from '../../../../state/shop.store';
import { TuiIcon } from '@taiga-ui/core';
import { TuiBadge, TuiStatus } from '@taiga-ui/kit';

@Component({
  selector: 'app-app-header',
  imports: [
    RouterLink,
    TuiBadge,
    TuiIcon,
    TuiStatus,
  ],
  standalone: true,
  templateUrl: './app-header.html',
  styleUrl: './app-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppHeader {
  private readonly shopStore = inject(ShopStore);
  readonly store = this.shopStore.store;
  readonly isOpen = computed(() => this.store()?.is_open ?? false);
}
