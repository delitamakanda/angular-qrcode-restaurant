import { TestBed } from '@angular/core/testing';
import { provideTaiga } from '@taiga-ui/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { App } from './app';
import { UiStore } from '@app/state/ui.store';
import { ShopStore } from '@app/state/shop.store';
import { StoreApiService } from '@app/core/api/store-api.service';
import { APP_TOKEN_CONFIG } from '@app/core/config/app.token';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideTaiga(),
        provideRouter([]),
        provideHttpClient(),
        ShopStore,
        UiStore,
        StoreApiService,
        {
          provide: APP_TOKEN_CONFIG,
          useValue: {},
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
