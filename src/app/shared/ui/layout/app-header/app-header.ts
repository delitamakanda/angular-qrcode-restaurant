import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { TuiBadge, TuiStatus } from '@taiga-ui/kit';
import { filter } from 'rxjs';
import { PlatformService } from '@app/core/services/platform.service';
import { ShopStore } from '@app/state/shop.store';

@Component({
  selector: 'app-app-header',
  imports: [NgOptimizedImage, RouterLink, TuiButton, TuiBadge, TuiIcon, TuiStatus],
  templateUrl: './app-header.html',
  styleUrl: './app-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppHeader {
  private readonly platformService = inject(PlatformService);
  private readonly swUpdate = inject(SwUpdate);
  private readonly shopStore = inject(ShopStore);
  readonly store = this.shopStore.store;
  readonly isOpen = this.shopStore.isOpen;
  readonly canInstall = this.platformService.canInstall;
  protected readonly logoFailed = signal(false);
  protected readonly isUpdateAvailable = signal(false);

  constructor() {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates
        .pipe(
          filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
          takeUntilDestroyed(inject(DestroyRef)),
        )
        .subscribe(() => {
          this.isUpdateAvailable.set(true);
        });
    }
  }

  reloadPage(): void {
    if (this.isUpdateAvailable()) {
      void this.swUpdate.activateUpdate().then(() => {
        this.platformService.reloadPage();
      });
    } else {
      this.platformService.reloadPage();
    }
  }

  installApp(): void {
    void this.platformService.promptInstall();
  }
}
