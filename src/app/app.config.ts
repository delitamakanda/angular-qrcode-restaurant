import { provideTaiga } from '@taiga-ui/core';
import {
  ApplicationConfig,
  provideZonelessChangeDetection,
  provideBrowserGlobalErrorListeners,
  isDevMode,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withPreloading,
  PreloadAllModules,
  withViewTransitions,
} from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { localeInterceptor } from './core/interceptors/locale.interceptor';
import { APP_TOKEN_CONFIG } from './core/config/app.token';

import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { NetworkAwarePreloadingStrategy } from './core/preload/network-aware-preloading-strategy';
import { API_CONFIG } from './core/config/env.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(
      withInterceptors([loadingInterceptor, errorInterceptor, localeInterceptor]),
      withFetch(),
    ),
    {
      provide: APP_TOKEN_CONFIG,
      useValue: API_CONFIG,
    },
    provideRouter(
      routes,
      withViewTransitions(),
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
      withPreloading(PreloadAllModules),
      withPreloading(NetworkAwarePreloadingStrategy)
    ),
    provideTaiga(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
