import { computed, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UiStore {
  readonly loadingCount = signal<number>(0);
  readonly isGlobalLoading = computed(() => this.loadingCount() > 0);

  startLoading(): void {
    this.loadingCount.update(count => count + 1);
  }

  stopLoading(): void {
    this.loadingCount.update(count => Math.max(count - 1, 0));
  }
}
