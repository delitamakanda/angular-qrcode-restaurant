import { ErrorHandler, Injectable, OnDestroy, computed, inject, signal } from '@angular/core';

type InstallPromptOutcome = 'accepted' | 'dismissed';

export interface InstallPromptResult {
  outcome: InstallPromptOutcome;
  platform: string;
}

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallPromptResult>;
}

@Injectable({
  providedIn: 'root',
})
export class PlatformService implements OnDestroy {
  private readonly errorHandler = inject(ErrorHandler);
  private readonly installPromptEvent = signal<BeforeInstallPromptEvent | null>(null);
  private readonly beforeInstallPromptListener = (event: Event) => {
    const installEvent = event as BeforeInstallPromptEvent;

    installEvent.preventDefault();
    this.installPromptEvent.set(installEvent);
  };
  private readonly appInstalledListener = () => {
    this.installPromptEvent.set(null);
  };
  readonly canInstall = computed(() => this.installPromptEvent() !== null);

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('beforeinstallprompt', this.beforeInstallPromptListener);
    window.addEventListener('appinstalled', this.appInstalledListener);
  }

  ngOnDestroy(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.removeEventListener('beforeinstallprompt', this.beforeInstallPromptListener);
    window.removeEventListener('appinstalled', this.appInstalledListener);
  }

  /**
   * Opens the deferred browser install prompt when available.
   * Returns without side effects if the browser has not exposed an install prompt yet.
   * The stored prompt is always cleared after the browser install flow settles.
   */
  async promptInstall(): Promise<void> {
    const installPromptEvent = this.installPromptEvent();

    if (!installPromptEvent) {
      return;
    }

    try {
      await installPromptEvent.prompt();
      // Wait for the browser install flow to settle before clearing the deferred prompt.
      await installPromptEvent.userChoice;
    } catch (error) {
      this.errorHandler.handleError(error);
    } finally {
      this.installPromptEvent.set(null);
    }
  }
}
