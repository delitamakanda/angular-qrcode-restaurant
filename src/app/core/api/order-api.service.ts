import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CheckoutPayload } from '../models/checkout.model';
import { Observable } from 'rxjs';
import { Order } from '../models/order.model';

@Injectable({
  providedIn: 'root',
})
export class OrderApiService {
  private readonly http = inject(HttpClient);

  createOrder(payload: CheckoutPayload): Observable<Order> {
    return this.http.post<Order>('/api/orders', payload);
  }

  getOrder(orderId: string): Observable<Order> {
    return this.http.get<Order>(`/api/orders/${orderId}`);
  }
}
