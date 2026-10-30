import { computed, inject, Injectable, Injector, signal } from '@angular/core';
import { StoreApiService } from '@app/core/api/store-api.service';
import { OrderMode, Store } from '@app/core/models/store.model';
import { firstValueFrom } from 'rxjs';
import { UiStore } from './ui.store';

@Injectable({
  providedIn: 'root',
})
export class ShopStore {
  private readonly injector = inject(Injector);
  // Resolved on first use: CartStore reads `store()` and must not require HttpClient to be built.
  private get storeApiService(): StoreApiService {
    return this.injector.get(StoreApiService);
  }
  private readonly uiStore = inject(UiStore);

  readonly store = signal<Store | null>(null);
  readonly stores = signal<Store[]>([]);
  readonly selectedMode = signal<OrderMode | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly isOpen = computed(() => this.store()?.is_open ?? false);
  readonly currency = computed(() => this.store()?.currency ?? 'EUR');
  readonly estimatedWaitTime = computed(() => this.store()?.estimated_wait_minutes ?? 0);

  async loadStore(storeId: string): Promise<void> {
    const taskId = `loadStore-${storeId}`;
    this.uiStore.startLoading(taskId);
    this.isLoading.set(true);
    try {
      const store = await firstValueFrom(this.storeApiService.getStore(storeId));
      this.store.set(store);

      const mode = this.selectedMode();
      if (!mode || !store.supported_modes.includes(mode)) {
        this.selectedMode.set(store.supported_modes[0] ?? null);
      }
    } finally {
      this.isLoading.set(false);
      this.uiStore.stopLoading(taskId);
    }
  }

  async loadStores(): Promise<void> {
    this.stores.set(await firstValueFrom(this.storeApiService.getStores()));
  }

  setMode(mode: OrderMode): void {
    this.selectedMode.set(mode);
  }
}
