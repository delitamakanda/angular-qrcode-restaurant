import { InjectionToken } from '@angular/core';
import { ApiConfig } from './env.config';

export const APP_TOKEN_CONFIG = new InjectionToken<ApiConfig>('APP_TOKEN');
