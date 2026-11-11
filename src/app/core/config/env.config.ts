import { environment } from '@environments/environment';

export interface ApiConfig {
  BASE_API_URL: string;
  /**
   * Open a WebSocket for order tracking before falling back to polling. Defaults to `true`;
   * `false` locally, where `json-server` has no WebSocket endpoint (it would only log a 404).
   */
  ORDER_SOCKET_ENABLED?: boolean;
}

export const API_CONFIG: ApiConfig = {
  BASE_API_URL: environment.BASE_API_URL,
  ORDER_SOCKET_ENABLED: environment.ORDER_SOCKET_ENABLED,
};
