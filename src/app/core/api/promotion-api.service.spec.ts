import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { APP_TOKEN_CONFIG } from '@app/core/config/app.token';
import { Promotion } from '@app/core/models/promotion.model';
import { PromotionApiService } from './promotion-api.service';

const promotion: Promotion = {
  id: 'p1',
  code: 'WELCOME10',
  type: 'fixed',
  value: 10,
  is_active: true,
};

describe('PromotionApiService', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_TOKEN_CONFIG, useValue: { BASE_API_URL: 'http://api' } },
      ],
    });
    return {
      service: TestBed.inject(PromotionApiService),
      http: TestBed.inject(HttpTestingController),
    };
  }

  it('requests the active promotions of the store and returns the first', () => {
    const { service, http } = setup();
    let result: Promotion | null | undefined;
    service.getActivePromotion('demo').subscribe((p) => (result = p));

    const req = http.expectOne((r) => r.url === 'http://api/promotions');
    expect(req.request.params.get('store_id')).toBe('demo');
    expect(req.request.params.get('is_active')).toBe('true');
    req.flush([promotion, { ...promotion, id: 'p2' }]);

    expect(result).toEqual(promotion);
  });

  it('returns null when there is no promotion', () => {
    const { service, http } = setup();
    let result: Promotion | null | undefined;
    service.getActivePromotion('demo').subscribe((p) => (result = p));

    http.expectOne((r) => r.url === 'http://api/promotions').flush([]);

    expect(result).toBeNull();
  });

  it('propagates HTTP errors', () => {
    const { service, http } = setup();
    let failed = false;
    service.getActivePromotion('demo').subscribe({ error: () => (failed = true) });

    http
      .expectOne((r) => r.url === 'http://api/promotions')
      .flush('x', { status: 500, statusText: 'Server Error' });

    expect(failed).toBe(true);
  });
});
