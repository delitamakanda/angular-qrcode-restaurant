import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MenuCategory, MenuItem } from '../models/menu-item.model';
import { Observable } from 'rxjs';
import { OrderMode } from '../models/store.model';

export interface MenuResponse {
  categories: MenuCategory[];
  items: MenuItem[];
}

@Injectable({
  providedIn: 'root',
})
export class MenuApiService {
  private readonly http = inject(HttpClient);

  getMenu(storeId: string, mode: OrderMode): Observable<MenuResponse> {
    const params = new HttpParams()
     .set('mode', mode);

    return this.http.get<MenuResponse>(`http://localhost:3000/menus/${storeId}`, { params });
  }
}
