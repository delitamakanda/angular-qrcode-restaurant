import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Promotion } from '@app/core/models/promotion.model';
import { APP_TOKEN_CONFIG } from '@app/core/config/app.token';

@Injectable({
  providedIn: 'root',
})
export class PromotionApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_TOKEN_CONFIG);

  /** Finds the active promotion matching `code` for a store, or `null` when there is none. */
  getActivePromotion(storeId: string, code: string): Observable<Promotion | null> {
    const params = new HttpParams().set('store_id', storeId).set('code', code);
    return this.http
      .get<Promotion[]>(`${this.config.BASE_API_URL}/promotions`, { params })
      .pipe(map((promotions) => promotions.find((p) => p.is_active) ?? null));
  }
}
