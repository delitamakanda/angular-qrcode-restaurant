import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Store } from '../models/store.model';
import { BASE_API_URL } from '../config/app.token';

@Injectable({
  providedIn: 'root',
})
export class StoreApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(BASE_API_URL);

  getStore(storeId: string): Observable<Store> {
    return this.http.get<Store>(`${this.baseUrl}/stores/${storeId}`);
  }
}
