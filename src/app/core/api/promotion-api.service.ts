import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { SKIP_ERROR_NOTIFICATION } from '@app/core/interceptors/error.interceptor';
import { map, Observable } from 'rxjs';
import { Promotion } from '@app/core/models/promotion.model';
import { APP_TOKEN_CONFIG } from '@app/core/config/app.token';

@Injectable({
  providedIn: 'root',
})
export class PromotionApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_TOKEN_CONFIG);

  /**
   * First active promotion of a store (optionally matching `code`), or `null` when there is none.
   */
  getActivePromotion(storeId: string, code?: string): Observable<Promotion | null> {
    if (code !== undefined) {
      const params = new HttpParams().set('store_id', storeId).set('code', code);
      return this.http
        .get<Promotion[]>(`${this.config.BASE_API_URL}/promotions`, { params })
        .pipe(map((promotions) => promotions.find((p) => p.is_active) ?? null));
    }
    // The banner is optional: a failure must not raise an error toast.
    const context = new HttpContext().set(SKIP_ERROR_NOTIFICATION, true);
    const params = new HttpParams().set('store_id', storeId).set('is_active', 'true');
    return this.http
      .get<Promotion[]>(`${this.config.BASE_API_URL}/promotions`, { params, context })
      .pipe(map((promotions) => promotions[0] ?? null));
  }
}
