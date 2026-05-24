import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Store } from '@app/core/models/store.model';
import { APP_TOKEN_CONFIG } from '@app/core/config/app.token';

@Injectable({
  providedIn: 'root',
})
export class StoreApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_TOKEN_CONFIG);

  getStore(storeId: string): Observable<Store> {
    return this.http.get<Store>(`${this.config.BASE_API_URL}/stores/${storeId}`);
  }
}
