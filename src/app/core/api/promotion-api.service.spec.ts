import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { APP_TOKEN_CONFIG } from '@app/core/config/app.token';
import { Promotion } from '@app/core/models/promotion.model';
import { PromotionApiService } from './promotion-api.service';

const promotion = (overrides: Partial<Promotion> = {}): Promotion => ({
  id: 'p1',
  store_id: 'demo',
  code: 'WELCOME10',
  type: 'fixed',
  value: 10,
  is_active: true,
  ...overrides,
});

describe('PromotionApiService', () => {
  let http: HttpTestingController;
  let service: PromotionApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_TOKEN_CONFIG, useValue: { BASE_API_URL: 'http://api' } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(PromotionApiService);
  });

  function lookup(response: Promotion[]): Promise<Promotion | null> {
    const result = new Promise<Promotion | null>((resolve) =>
      service.getActivePromotion('demo', 'WELCOME10').subscribe(resolve),
    );
    const req = http.expectOne(
      (r) =>
        r.url === 'http://api/promotions' &&
        r.params.get('store_id') === 'demo' &&
        r.params.get('code') === 'WELCOME10',
    );
    expect(req.request.method).toBe('GET');
    req.flush(response);
    return result;
  }

  it('returns the active promotion', async () => {
    expect(await lookup([promotion()])).toEqual(promotion());
  });

  it('returns null when nothing matches', async () => {
    expect(await lookup([])).toBeNull();
  });

  it('returns null when the promotion is inactive', async () => {
    expect(await lookup([promotion({ is_active: false })])).toBeNull();
  });

  it('without a code, requests active promotions of the store and returns the first', () => {
    let result: Promotion | null | undefined;
    service.getActivePromotion('demo').subscribe((p) => (result = p));

    const req = http.expectOne((r) => r.url === 'http://api/promotions');
    expect(req.request.params.get('store_id')).toBe('demo');
    expect(req.request.params.get('is_active')).toBe('true');
    req.flush([promotion(), promotion({ id: 'p2' })]);

    expect(result).toEqual(promotion());
  });

  it('without a code, returns null when there is no promotion', () => {
    let result: Promotion | null | undefined;
    service.getActivePromotion('demo').subscribe((p) => (result = p));
    http.expectOne((r) => r.url === 'http://api/promotions').flush([]);
    expect(result).toBeNull();
  });
});
