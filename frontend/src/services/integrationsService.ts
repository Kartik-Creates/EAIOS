import { apiClient } from './axios';
import type { OAuthConnection, TokenManualInput, DriveSyncResult } from '@/types/integration.types';

export const integrationsService = {
  /**
   * Fetch a list of the user's connected OAuth providers.
   * @returns Array of OAuthConnection objects
   */
  listConnections: async (): Promise<OAuthConnection[]> => {
    const response = await apiClient.get<OAuthConnection[]>('/auth/connections');
    return response.data;
  },

  /**
   * Submit manual tokens for providers like Slack or Jira.
   * @param payload Token payload
   */
  connectManualToken: async (payload: TokenManualInput): Promise<void> => {
    await apiClient.post('/auth/connections/token', payload);
  },

  /**
   * Triggers a sync for Google Drive (if connected).
   * @returns Sync result statistics
   */
  triggerDriveSync: async (): Promise<DriveSyncResult> => {
    const response = await apiClient.post<DriveSyncResult>('/integrations/drive/sync');
    return response.data;
  },

  /**
   * Request OAuth authorization URL for a given provider (e.g. google, github).
   * @param provider Provider identifier
   * @returns Target OAuth authorization URL
   */
  connectOAuth: async (provider: string): Promise<string> => {
    const response = await apiClient.get<{ url: string }>(`/integrations/${provider}/connect`);
    return response.data.url;
  }
};
