/**
 * providers.ts
 *
 * OAuth integration provider metadata for UI rendering.
 *
 * Used by:
 *  - src/components/integrations/ConnectionCard.tsx (display)
 *  - src/pages/Integrations/IntegrationsPage.tsx    (list)
 *
 * RULE: Only providers that have a backend implementation may appear here.
 * Verified backend support:
 *  - google → GET /api/v1/auth/oauth/google/login  (OAuth redirect)
 *  - github → GET /api/v1/auth/oauth/github/login  (OAuth redirect)
 *  - slack  → POST /api/v1/auth/connections/token  (manual token)
 *  - jira   → POST /api/v1/auth/connections/token  (manual token)
 */

import type { OAuthProvider, ProviderMeta } from '@/types/integration.types';

// ─────────────────────────────────────────────
// Provider Metadata List
// Controls the order providers appear in the UI
// ─────────────────────────────────────────────
export const PROVIDERS: ProviderMeta[] = [
  {
    id:          'google' as OAuthProvider,
    label:       'Google Drive',
    description: 'Connect your Google Drive to index documents for RAG search.',
    authMethod:  'oauth',
    icon:        'HardDrive',
  },
  {
    id:          'github' as OAuthProvider,
    label:       'GitHub',
    description: 'Connect GitHub to search across repositories and code.',
    authMethod:  'oauth',
    icon:        'Github',
  },
  {
    id:          'slack' as OAuthProvider,
    label:       'Slack',
    description: 'Connect Slack to search messages and channel history.',
    authMethod:  'manual',
    icon:        'MessageSquare',
  },
  {
    id:          'jira' as OAuthProvider,
    label:       'Jira',
    description: 'Connect Jira to search issues, epics, and project data.',
    authMethod:  'manual',
    icon:        'Kanban',
  },
];

// ─────────────────────────────────────────────
// Provider Map (id → metadata)
// O(1) lookup for ConnectionCard rendering
// ─────────────────────────────────────────────
export const PROVIDER_MAP: Record<OAuthProvider, ProviderMeta> = Object.fromEntries(
  PROVIDERS.map((p) => [p.id, p])
) as Record<OAuthProvider, ProviderMeta>;

// ─────────────────────────────────────────────
// Provider color accents (for ConnectionCard badges)
// ─────────────────────────────────────────────
export const PROVIDER_COLORS: Record<OAuthProvider, string> = {
  google: '#4285f4',
  github: '#e6edf3',
  slack:  '#4a154b',
  jira:   '#0052cc',
};
