import { apiClient } from './axios';
import type { OAuthConnection, TokenManualInput, DriveSyncResult } from '@/types/integration.types';

export const integrationsService = {
  listConnections: async (): Promise<OAuthConnection[]> => {
    const response = await apiClient.get<OAuthConnection[]>('/auth/connections');
    return response.data;
  },

  connectManualToken: async (payload: TokenManualInput): Promise<void> => {
    await apiClient.post('/auth/connections/token', payload);
  },

  triggerDriveSync: async (): Promise<DriveSyncResult> => {
    const response = await apiClient.post<DriveSyncResult>('/integrations/drive/sync');
    return response.data;
  },

  connectOAuth: async (provider: string): Promise<string> => {
    const response = await apiClient.get<{ url: string }>(`/integrations/${provider}/connect`);
    return response.data.url;
  },

  disconnectConnection: async (provider: string): Promise<void> => {
    await apiClient.delete(`/integrations/${provider}`);
  },
};
