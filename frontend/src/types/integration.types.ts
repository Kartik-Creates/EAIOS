/**
 * integration.types.ts
 *
 * TypeScript contracts that mirror the backend Pydantic schemas in:
 *   backend/app/schemas/oauth.py
 *
 * RULE: OAuthConnection and TokenManualInput must never diverge from
 *       the backend schema without an approved backend change.
 */

// ─────────────────────────────────────────────
// OAuth Provider
// Mirrors: OAuthToken.provider column
// OAuth redirect: "google" | "github"
// Manual token:  "slack"  | "jira"
// ─────────────────────────────────────────────
export type OAuthProvider = 
  | 'google' 
  | 'github' 
  | 'slack' 
  | 'jira' 
  | 'notion'
  | 'confluence'
  | 'microsoft-teams'
  | 'microsoft-sharepoint'
  | 'onedrive'
  | 'dropbox'
  | 'gitlab'
  | 'bitbucket'
  | 'linear'
  | 'asana'
  | 'trello'
  | 'clickup'
  | 'salesforce'
  | 'hubspot'
  | 'zendesk'
  | 'discord';

export interface OAuthConnection {
  provider: OAuthProvider;
  scopes: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface TokenManualInput {
  provider: 'slack' | 'jira';
  access_token: string;
  refresh_token?: string;
}

export interface CustomIntegrationForm {
  serviceId: string;
  serviceName: string;
  authType: 'oauth2' | 'api_key' | 'bearer' | 'webhook' | 'basic';
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  apiKey?: string;
  baseUrl?: string;
  personalAccessToken?: string;
  webhookUrl?: string;
  username?: string;
  password?: string;
  description?: string;
  icon?: string;
}

export interface DriveSyncResult {
  synced: number;
  skipped: number;
  errors: number;
  meetings_synced?: number;
  message?: string;
}

export interface ConnectionsState {
  connections: OAuthConnection[];
  isLoading: boolean;
  error: string | null;
}

export interface ProviderMeta {
  id: OAuthProvider;
  label: string;
  description: string;
  authMethod: 'oauth' | 'manual';
}
