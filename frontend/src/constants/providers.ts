/**
 * providers.ts
 *
 * OAuth integration provider metadata for UI rendering.
 * Drives generic OAuth Connect flows across all integrations.
 */

import type { OAuthProvider, ProviderMeta } from '@/types/integration.types';

export const PROVIDERS: ProviderMeta[] = [
  {
    id: 'gmail' as OAuthProvider,
    label: 'Gmail',
    description: 'Connect Gmail to index emails and message threads for RAG search.',
    authMethod: 'oauth',
  },
  {
    id: 'google' as OAuthProvider,
    label: 'Google Drive',
    description: 'Connect Google Drive to index documents and sheets for RAG search.',
    authMethod: 'oauth',
  },
  {
    id: 'github' as OAuthProvider,
    label: 'GitHub',
    description: 'Connect GitHub to search across repositories and source code.',
    authMethod: 'oauth',
  },
  {
    id: 'slack' as OAuthProvider,
    label: 'Slack',
    description: 'Connect Slack to search channels, messages, and workspace history.',
    authMethod: 'oauth',
  },
  {
    id: 'jira' as OAuthProvider,
    label: 'Jira',
    description: 'Connect Jira to search issues, epics, and project tracking data.',
    authMethod: 'oauth',
  },
  {
    id: 'notion' as OAuthProvider,
    label: 'Notion',
    description: 'Connect Notion to index pages and databases for RAG search.',
    authMethod: 'oauth',
  },
  {
    id: 'confluence' as OAuthProvider,
    label: 'Confluence',
    description: 'Connect Confluence to index documentation and knowledge bases.',
    authMethod: 'oauth',
  },
  {
    id: 'microsoft-teams' as OAuthProvider,
    label: 'Microsoft Teams',
    description: 'Connect Microsoft Teams to search messages and channels.',
    authMethod: 'oauth',
  },
  {
    id: 'microsoft-sharepoint' as OAuthProvider,
    label: 'Microsoft SharePoint',
    description: 'Connect SharePoint to index documents and site content.',
    authMethod: 'oauth',
  },
  {
    id: 'onedrive' as OAuthProvider,
    label: 'OneDrive',
    description: 'Connect OneDrive to index files and documents.',
    authMethod: 'oauth',
  },
  {
    id: 'dropbox' as OAuthProvider,
    label: 'Dropbox',
    description: 'Connect Dropbox to index files and shared documents.',
    authMethod: 'oauth',
  },
  {
    id: 'gitlab' as OAuthProvider,
    label: 'GitLab',
    description: 'Connect GitLab to search repositories and merge requests.',
    authMethod: 'oauth',
  },
  {
    id: 'bitbucket' as OAuthProvider,
    label: 'Bitbucket',
    description: 'Connect Bitbucket to search repositories and pull requests.',
    authMethod: 'oauth',
  },
  {
    id: 'linear' as OAuthProvider,
    label: 'Linear',
    description: 'Connect Linear to search issues and project cycles.',
    authMethod: 'oauth',
  },
  {
    id: 'asana' as OAuthProvider,
    label: 'Asana',
    description: 'Connect Asana to search tasks and projects.',
    authMethod: 'oauth',
  },
  {
    id: 'trello' as OAuthProvider,
    label: 'Trello',
    description: 'Connect Trello to search boards and cards.',
    authMethod: 'oauth',
  },
  {
    id: 'clickup' as OAuthProvider,
    label: 'ClickUp',
    description: 'Connect ClickUp to search tasks and workspaces.',
    authMethod: 'oauth',
  },
  {
    id: 'salesforce' as OAuthProvider,
    label: 'Salesforce',
    description: 'Connect Salesforce to search records and CRM data.',
    authMethod: 'oauth',
  },
  {
    id: 'hubspot' as OAuthProvider,
    label: 'HubSpot',
    description: 'Connect HubSpot to search contacts and marketing data.',
    authMethod: 'oauth',
  },
  {
    id: 'zendesk' as OAuthProvider,
    label: 'Zendesk',
    description: 'Connect Zendesk to search tickets and support data.',
    authMethod: 'oauth',
  },
  {
    id: 'discord' as OAuthProvider,
    label: 'Discord',
    description: 'Connect Discord to search messages and channels.',
    authMethod: 'oauth',
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
  notion: '#000000',
  confluence: '#0052cc',
  microsoft: '#0078d4',
  onedrive: '#0078d4',
  dropbox: '#0061ff',
  gitlab: '#fc6d26',
  bitbucket: '#0052cc',
  linear: '#5e6ad2',
  asana: '#f06a6a',
  trello: '#0079bf',
  clickup: '#7b68ee',
  salesforce: '#00a1e0',
  hubspot: '#ff7a59',
  zendesk: '#03363d',
  discord: '#5865f2',
};
