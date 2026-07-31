import { apiClient } from './axios';

export interface HealthCheckResponse {
  status: string;
  service: string;
}

export const healthService = {
  /**
   * Pings the backend health endpoint.
   */
  check: async (): Promise<HealthCheckResponse> => {
    const response = await apiClient.get<HealthCheckResponse>('/health');
    return response.data;
  },
};
