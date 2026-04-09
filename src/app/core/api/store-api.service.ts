import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Store } from '../models/store.model';

@Injectable({
  providedIn: 'root',
})
export class StoreApiService {
  private readonly http = inject(HttpClient);

  getStore(storeId: string): Observable<Store> {
    return this.http.get<Store>(`http://localhost:3000/stores/${storeId}`);
  }
}
