import { ApplicationConfig, provideZonelessChangeDetection , provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { loadingInterceptor} from './core/interceptors/loading.interceptor';
import { errorInterceptor} from './core/interceptors/error.interceptor';
import { localeInterceptor} from './core/interceptors/locale.interceptor';

import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(
      withInterceptors([
        loadingInterceptor,
        errorInterceptor,
        localeInterceptor,
      ])
    ),
    provideAnimations(),
    provideRouter(routes, withComponentInputBinding(), withInMemoryScrolling({ scrollPositionRestoration: 'enabled' , anchorScrolling: 'enabled'}), withPreloading(PreloadAllModules)),
  ],
};
