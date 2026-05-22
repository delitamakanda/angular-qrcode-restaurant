import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShopStore } from '../../../../state/shop.store';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { TuiBadge, TuiStatus } from '@taiga-ui/kit';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import { PlatformService } from '../../../../core/services/platform.service';

@Component({
  selector: 'app-app-header',
  imports: [
    RouterLink,
    TuiButton,
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
  private readonly platformService = inject(PlatformService);
  private readonly swUpdate = inject(SwUpdate);
  private readonly shopStore = inject(ShopStore);
  readonly store = this.shopStore.store;
  readonly isOpen = computed(() => this.store()?.is_open ?? false);
  readonly canInstall = this.platformService.canInstall;
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

  installApp(): void {
    void this.platformService.promptInstall();
  }
}
