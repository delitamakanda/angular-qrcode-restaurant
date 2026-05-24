import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CheckoutPayload } from '@app/core/models/checkout.model';
import { Observable } from 'rxjs';
import { Order } from '@app/core/models/order.model';
import { APP_TOKEN_CONFIG } from '@app/core/config/app.token';

@Injectable({
  providedIn: 'root',
})
export class OrderApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_TOKEN_CONFIG);

  createOrder(payload: CheckoutPayload): Observable<Order> {
    return this.http.post<Order>(`${this.config.BASE_API_URL}/orders`, payload);
  }

  getOrder(orderId: string): Observable<Order> {
    return this.http.get<Order>(`${this.config.BASE_API_URL}/orders/${orderId}`);
  }
}
