import { environment } from "@environments/environments";

export interface ApiConfig {
    BASE_API_URL: string;
}

export const API_CONFIG: ApiConfig = {
    BASE_API_URL: environment.BASE_API_URL,
};
