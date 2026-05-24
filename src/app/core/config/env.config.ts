import { environment } from '@environments/environment';

export interface ApiConfig {
  BASE_API_URL: string;
}

export const API_CONFIG: ApiConfig = {
  BASE_API_URL: environment.BASE_API_URL,
};
