import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShopStore } from '../../../../state/shop.store';

@Component({
  selector: 'app-app-header',
  imports: [
    RouterLink
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
