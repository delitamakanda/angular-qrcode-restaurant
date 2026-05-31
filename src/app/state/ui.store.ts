import { computed, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UiStore {
  private readonly loadingCount = signal<number>(0);
  private readonly globalLoading = signal<Set<string>>(new Set());

  readonly isGlobalLoading = computed(() => this.loadingCount() > 0);
  readonly hasGlobalLoading = computed(() => this.globalLoading().size > 0);

  startLoading(taskId?: string): void {
    this.loadingCount.update((count) => count + 1);
    if (taskId) {
      this.globalLoading.update((set) => new Set(set).add(taskId));
    }
  }

  stopLoading(taskId?: string): void {
    this.loadingCount.update((count) => Math.max(count - 1, 0));
    if (taskId) {
      this.globalLoading.update((set) => {
        const newSet = new Set(set);
        newSet.delete(taskId);
        return newSet;
      });
    }
  }

  isAppReady = computed(() => !this.isGlobalLoading() && !this.hasGlobalLoading());
}
