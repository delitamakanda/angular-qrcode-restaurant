import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MenuCategory, MenuItem } from '@app/core/models/menu-item.model';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { OrderMode } from '@app/core/models/store.model';
import { APP_TOKEN_CONFIG } from '@app/core/config/app.token';
import { ModifierGroup, ModifierOption } from '@app/core/models/modifier.model';

export interface MenuResponse {
  categories: MenuCategory[];
  items: MenuItem[];
}

export interface MenuItemWithModifiers extends MenuItem {
  modifierGroups: (ModifierGroup & { options: ModifierOption[]  })[];
}

@Injectable({
  providedIn: 'root',
})
export class MenuApiService {
  private readonly http = inject(HttpClient);
  private readonly config  = inject(APP_TOKEN_CONFIG);

  getCategories(storeId: string): Observable<MenuCategory[]> {
    const params = new HttpParams().set('store_id', storeId).set('sort', 'sort_order');
    return this.http.get<MenuCategory[]>(`${this.config.BASE_API_URL}/categories`, { params });
  }

  getItems(storeId: string, mode?: OrderMode, categoryId?: string): Observable<MenuItem[]> {
    let params = new HttpParams().set('store_id', storeId);
    if (categoryId) {
      params = params.set('category_id', categoryId);
    }
    return this.http.get<MenuItem[]>(`${this.config.BASE_API_URL}/menus`, { params }).pipe(
      map(items => {
        if (mode) {
          return items.filter(item => item.mode_availability?.[mode] === true);
        }
        return items;
      })
    );
  }

  getModifierGroups(itemId: string): Observable<ModifierGroup[]> {
    const params = new HttpParams().set('menu_item_id', itemId);
    return this.http.get<ModifierGroup[]>(`${this.config.BASE_API_URL}/groups`, { params } );
  }

  getModifierOptions(groupId: string): Observable<ModifierOption[]> {
    const params = new HttpParams().set('group_id', groupId);
    return this.http.get<ModifierOption[]>(`${this.config.BASE_API_URL}/options`, { params });
  }

  getItemWithModifiers(itemId: string): Observable<MenuItemWithModifiers> {
    return this.http.get<MenuItem>(`${this.config.BASE_API_URL}/menus/${itemId}`).pipe(
      map(item => item),
      switchMap(item =>
        this.getModifierGroups(itemId).pipe(
        switchMap(groups => {
          if (!groups.length) {
            return of({
              ...item,
              modifierGroups: [],
            });
          }

          return forkJoin(
            groups.map(group =>
              this.getModifierOptions(group.id).pipe(
              map(options => ({
                ...group,
                options
              }))
            )
          )
        ).pipe(
            map(groupsWithOptions => ({
              ...item,
              modifierGroups: groupsWithOptions
            }))
          );
        })
      )
    )
    );
  }

  getMenu(storeId: string, mode: OrderMode): Observable<MenuResponse> {
    return forkJoin({
      categories: this.getCategories(storeId),
      items: this.getItems(storeId, mode),
    }).pipe(
      map(({ categories, items }) => ({ categories, items  }))
    )
  }
}
