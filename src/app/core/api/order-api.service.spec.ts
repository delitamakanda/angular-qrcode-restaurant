import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { APP_TOKEN_CONFIG } from '@app/core/config/app.token';
import { OrderApiService } from './order-api.service';

describe('OrderApiService.getOrders', () => {
  it('requests the orders of a store', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_TOKEN_CONFIG, useValue: { BASE_API_URL: '/api' } },
      ],
    });
    const http = TestBed.inject(HttpTestingController);
    let result: unknown;
    TestBed.inject(OrderApiService)
      .getOrders('demo')
      .subscribe((orders) => (result = orders));
    const req = http.expectOne('/api/orders?store_id=demo');
    expect(req.request.method).toBe('GET');
    req.flush([]);
    expect(result).toEqual([]);
    http.verify();
  });
});
