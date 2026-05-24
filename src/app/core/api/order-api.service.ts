import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CheckoutPayload } from '@app/core/models/checkout.model';
import { Observable } from 'rxjs';
import { Order } from '@app/core/models/order.model';
import { BASE_API_URL } from '@app/core/config/app.token';

@Injectable({
  providedIn: 'root',
})
export class OrderApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(BASE_API_URL);

  createOrder(payload: CheckoutPayload): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/orders`, payload);
  }

  getOrder(orderId: string): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/orders/${orderId}`);
  }
}
