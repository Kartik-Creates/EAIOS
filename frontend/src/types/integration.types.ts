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
export type OAuthProvider = 'gmail' | 'google_drive' | 'google' | 'github' | 'slack' | 'jira';


// ─────────────────────────────────────────────
// OAuth Connection
// Mirrors: schemas/oauth.py → OAuthConnectionRead
// Returned by: GET /api/v1/auth/connections (list)
// ─────────────────────────────────────────────
export interface OAuthConnection {
  provider: OAuthProvider;
  scopes: string | null;
  expires_at: string | null; // ISO 8601 datetime string from backend
  created_at: string;        // ISO 8601 datetime string from backend
  updated_at: string | null; // ISO 8601 datetime string from backend
}

// ─────────────────────────────────────────────
// Manual Token Input
// Mirrors: schemas/oauth.py → TokenManualInput
// Used by: POST /api/v1/auth/connections/token (JSON body)
// Allowed providers: "slack" | "jira" only (backend enforces this)
// ─────────────────────────────────────────────
export interface TokenManualInput {
  provider: 'slack' | 'jira';
  access_token: string;
  refresh_token?: string; // optional per backend schema
}

// ─────────────────────────────────────────────
// Drive Sync Result (frontend-only)
// Shape of the response from POST /api/v1/integrations/drive/sync
// Backend returns a summary dict — structure inferred from service layer
// ─────────────────────────────────────────────
export interface DriveSyncResult {
  synced: number;
  skipped: number;
  errors: number;
  message?: string;
}

// ─────────────────────────────────────────────
// Connections Hook State (frontend-only)
// Defines the shape returned by useConnections()
// ─────────────────────────────────────────────
export interface ConnectionsState {
  connections: OAuthConnection[];
  isLoading: boolean;
  error: string | null;
}

// ─────────────────────────────────────────────
// Provider Metadata (frontend-only display config)
// Used by ConnectionCard to render logos, labels, and descriptions
// ─────────────────────────────────────────────
export interface ProviderMeta {
  id: OAuthProvider;
  label: string;
  description: string;
  authMethod: 'oauth' | 'manual'; // oauth = redirect, manual = token input form
  icon: string;                   // lucide-react icon name
}
