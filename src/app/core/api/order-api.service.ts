import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CheckoutPayload } from '../models/checkout.model';
import { Observable } from 'rxjs';
import { Order } from '../models/order.model';
import { BASE_API_URL } from '../config/app.token';

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
