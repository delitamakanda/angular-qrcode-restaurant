import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { SKIP_ERROR_NOTIFICATION } from '@app/core/interceptors/error.interceptor';
import { Observable } from 'rxjs';
import { Store } from '@app/core/models/store.model';
import { APP_TOKEN_CONFIG } from '@app/core/config/app.token';

@Injectable({
  providedIn: 'root',
})
export class StoreApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_TOKEN_CONFIG);

  getStores(): Observable<Store[]> {
    return this.http.get<Store[]>(`${this.config.BASE_API_URL}/stores`);
  }

  getStore(storeId: string): Observable<Store> {
    // An unknown store is handled silently by `storeLoadedGuard` (redirect), no error toast.
    const context = new HttpContext().set(SKIP_ERROR_NOTIFICATION, true);
    return this.http.get<Store>(`${this.config.BASE_API_URL}/stores/${storeId}`, { context });
  }
}
