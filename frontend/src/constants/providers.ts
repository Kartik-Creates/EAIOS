/**
 * providers.ts
 *
 * OAuth integration provider metadata for UI rendering.
 * Drives generic OAuth Connect flows across all 5 integrations:
 * Gmail, Google Drive, GitHub, Slack, and Jira.
 */

import type { OAuthProvider, ProviderMeta } from '@/types/integration.types';

export const PROVIDERS: ProviderMeta[] = [
  {
    id: 'gmail' as OAuthProvider,
    label: 'Gmail',
    description: 'Connect Gmail to index emails and message threads for RAG search.',
    authMethod: 'oauth',
    icon: 'Mail',
  },
  {
    id: 'google' as OAuthProvider,
    label: 'Google Drive',
    description: 'Connect Google Drive to index documents and sheets for RAG search.',
    authMethod: 'oauth',
    icon: 'HardDrive',
  },
  {
    id: 'github' as OAuthProvider,
    label: 'GitHub',
    description: 'Connect GitHub to search across repositories and source code.',
    authMethod: 'oauth',
    icon: 'Github',
  },
  {
    id: 'slack' as OAuthProvider,
    label: 'Slack',
    description: 'Connect Slack to search channels, messages, and workspace history.',
    authMethod: 'oauth',
    icon: 'MessageSquare',
  },
  {
    id: 'jira' as OAuthProvider,
    label: 'Jira',
    description: 'Connect Jira to search issues, epics, and project tracking data.',
    authMethod: 'oauth',
    icon: 'Kanban',
  },
  {
    id: 'custom' as OAuthProvider,
    label: 'Custom Integration',
    description: 'Connect your own enterprise application using OAuth, API Keys, Personal Access Tokens, or Webhooks.',
    authMethod: 'custom',
    icon: 'Plug',
  },
];

export const PROVIDER_MAP: Record<string, ProviderMeta> = Object.fromEntries(
  PROVIDERS.map((p) => [p.id, p])
);

export const PROVIDER_COLORS: Record<string, string> = {
  gmail: '#ea4335',
  google: '#4285f4',
  google_drive: '#4285f4',
  github: '#e6edf3',
  slack: '#4a154b',
  jira: '#0052cc',
  custom: '#6b7280',
};
