import { Injectable, inject } from '@angular/core';
import { TuiNotificationService } from '@taiga-ui/core';

const DEFAULT_DURATION_MS = 4000;
const ERROR_DURATION_MS = 8000;

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly notifications = inject(TuiNotificationService);

  success(message: string): void {
    this.show(message, 'positive', DEFAULT_DURATION_MS);
  }

  error(message: string): void {
    this.show(message, 'negative', ERROR_DURATION_MS);
  }

  info(message: string): void {
    this.show(message, 'info', DEFAULT_DURATION_MS);
  }

  warning(message: string): void {
    this.show(message, 'warning', DEFAULT_DURATION_MS);
  }

  private show(
    message: string,
    appearance: 'positive' | 'negative' | 'info' | 'warning',
    autoClose: number,
  ): void {
    this.notifications.open(message, { appearance, autoClose, closable: true }).subscribe();
  }
}
