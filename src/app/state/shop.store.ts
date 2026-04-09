import { computed, inject, Injectable, signal } from '@angular/core';
import { StoreApiService } from '../core/api/store-api.service';
import { OrderMode, Store } from '../core/models/store.model';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ShopStore {
  private readonly storeApiService = inject(StoreApiService);

  readonly store = signal<Store|null>(null);
  readonly selectedMode = signal<OrderMode | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly isOpen = computed(() =>this.store()?.is_open ?? false);
  readonly currency = computed(() => this.store()?.currency?? 'EUR');
  readonly estimatedWaitTime = computed(() => this.store()?.estimated_wait_minutes?? 0);

  async loadStore(storeId: string) : Promise<void> {
    this.isLoading.set(true);
    try {
      const store = await firstValueFrom(this.storeApiService.getStore(storeId))
      this.store.set(store);

      if (!this.selectedMode() && store.supported_modes.length > 0) {
        this.selectedMode.set(store.supported_modes[0]);
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  setMode(mode: OrderMode): void {
    this.selectedMode.set(mode);
  }
}
