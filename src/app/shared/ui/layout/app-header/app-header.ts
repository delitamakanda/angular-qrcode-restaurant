import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShopStore } from '../../../../state/shop.store';
import { TuiIcon } from '@taiga-ui/core';
import { TuiBadge, TuiStatus } from '@taiga-ui/kit';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

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
export class AppHeader implements OnInit  {
  private readonly swUpdate = inject(SwUpdate);
  private readonly shopStore = inject(ShopStore);
  readonly store = this.shopStore.store;
  readonly isOpen = computed(() => this.store()?.is_open ?? false);
  protected isUpdateAvailable = false;

  ngOnInit(): void {
      if (this.swUpdate.isEnabled) {
        this.swUpdate.versionUpdates.pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
        .subscribe(() => this.isUpdateAvailable = true);
      }
    }

  reloadPage(): void {
    if (this.isUpdateAvailable) {
      this.swUpdate.activateUpdate().then(() => document.location.reload());
    } else {
      document.location.reload();
    }
  }
}
