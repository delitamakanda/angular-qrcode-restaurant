import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MenuCategory, MenuItem } from '../models/menu-item.model';
import { Observable } from 'rxjs';
import { OrderMode } from '../models/store.model';
import { BASE_API_URL } from '../config/app.token';

export interface MenuResponse {
  categories: MenuCategory[];
  items: MenuItem[];
}

@Injectable({
  providedIn: 'root',
})
export class MenuApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(BASE_API_URL);

  getMenu(storeId: string, mode: OrderMode): Observable<MenuResponse> {
    const params = new HttpParams()
     .set('mode', mode);

    return this.http.get<MenuResponse>(`${this.baseUrl}/menus/${storeId}`, { params });
  }
}
