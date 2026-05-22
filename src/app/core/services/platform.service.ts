import { Injectable, computed, signal } from '@angular/core';

type InstallPromptOutcome = 'accepted' | 'dismissed';

interface InstallPromptResult {
  outcome: InstallPromptOutcome;
  platform: string;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallPromptResult>;
}

@Injectable({
  providedIn: 'root',
})
export class PlatformService {
  private readonly installPromptEvent = signal<BeforeInstallPromptEvent | null>(null);
  readonly canInstall = computed(() => this.installPromptEvent() !== null);

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('beforeinstallprompt', (event) => {
      const installEvent = event as BeforeInstallPromptEvent;

      installEvent.preventDefault();
      this.installPromptEvent.set(installEvent);
    });

    window.addEventListener('appinstalled', () => {
      this.installPromptEvent.set(null);
    });
  }

  async promptInstall(): Promise<void> {
    const installPromptEvent = this.installPromptEvent();

    if (!installPromptEvent) {
      return;
    }

    try {
      await installPromptEvent.prompt();
      await installPromptEvent.userChoice;
    } finally {
      this.installPromptEvent.set(null);
    }
  }
}
