import React from 'react';

interface BrandIconProps {
  className?: string;
  size?: number;
}

export const GmailIcon: React.FC<BrandIconProps> = ({ className, size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
  </svg>
);

export const GitHubIcon: React.FC<BrandIconProps> = ({ className, size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
);

export const SlackIcon: React.FC<BrandIconProps> = ({ className, size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 15a2.5 2.5 0 1 0 2.5 2.5V15H6zm0-6a2.5 2.5 0 1 0-2.5 2.5H6V9zm6 0a2.5 2.5 0 1 0-2.5-2.5V9h2.5zm0 6a2.5 2.5 0 1 0 2.5-2.5H12V15zm6-6a2.5 2.5 0 1 0 2.5 2.5H18V9zm0-6a2.5 2.5 0 1 0-2.5 2.5V3h2.5zm-6 12a2.5 2.5 0 1 0 2.5 2.5V15H12zm0-6a2.5 2.5 0 1 0-2.5 2.5H12V9z"/>
  </svg>
);

export const JiraIcon: React.FC<BrandIconProps> = ({ className, size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.571 11.429H.143v6.714a5.714 5.714 0 0 0 5.714 5.714h5.714V11.429zm.143-5.715H.143v5.715h11.571V5.714zM23.857 0H12.286v11.429h11.571V0z"/>
  </svg>
);

export const NotionIcon: React.FC<BrandIconProps> = ({ className, size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M4.459 4.208c.746.606 1.026.56 2.427.466l11.43-.746c.326 0 .047-.326-.047-.373L16.29 2.155c-.42-.326-.98-.606-1.82-.56L3.48 2.668c-.42.046-.56.326-.373.56l1.352 1.03-.001-.05zm.746 3.684v12.784c0 .606.326.886.98.84l12.875-.746c.653-.047.746-.513.746-.98V6.959c0-.466-.233-.746-.746-.699L6.185 7.005c-.56.047-.98.373-.98.887zm11.758.84c.093.42 0 .84-.42.886l-1.026.14v8.257c0 .653-.42 1.026-1.026 1.026-.466 0-.793-.186-1.12-.513l-4.572-6.53v6.065l1.493.326c.28.047.373.326.373.653 0 .28-.187.373-.56.42l-3.873.233c-.28 0-.466-.233-.466-.513 0-.42.186-.606.466-.653l1.12-.233V9.725l-1.213-.14c-.28-.046-.373-.326-.373-.606 0-.326.233-.466.606-.513l3.966-.233c.466 0 .887.186 1.213.56l4.432 6.344V9.678l-1.213-.186c-.28-.047-.373-.326-.373-.606 0-.326.233-.466.606-.513l3.687-.233z"/>
  </svg>
);

export const ConfluenceIcon: React.FC<BrandIconProps> = ({ className, size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M1.378 17.72c-.443.722-.167 1.637.587 2.008l4.908 2.42c.745.367 1.65.074 2.072-.647l5.068-8.665H6.464L1.378 17.72zm21.244-11.44l-4.908-2.42a1.493 1.493 0 0 0-2.072.647l-5.068 8.665h7.55l5.086-8.884a1.488 1.488 0 0 0-.588-2.008z"/>
  </svg>
);

export const DropboxIcon: React.FC<BrandIconProps> = ({ className, size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 2l6 4-6 4-6-4 6-4zm12 0l6 4-6 4-6-4 6-4zM0 14l6 4 6-4-6-4-6 4zm24 0l-6-4-6 4 6 4 6-4zM6 19.5l6 4 6-4-6-3.5-6 3.5z"/>
  </svg>
);

export const GitLabIcon: React.FC<BrandIconProps> = ({ className, size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 5.5 2a.43.43 0 0 1 .41.28L7.6 7.6h8.8l1.69-5.32a.43.43 0 0 1 .41-.28.42.42 0 0 1 .39.19l2.44 7.51 1.22 3.78a.84.84 0 0 1-.3.94z"/>
  </svg>
);

export const BitbucketIcon: React.FC<BrandIconProps> = ({ className, size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M.778 1.213a.768.768 0 0 0-.768.892l3.263 19.81c.084.5.514.868 1.02.868h15.422a.768.768 0 0 0 .762-.647L23.985 2.1a.768.768 0 0 0-.76-.887H.778zm13.78 13.064H9.426L8.243 8.351h7.502l-1.187 5.926z"/>
  </svg>
);

export const TrelloIcon: React.FC<BrandIconProps> = ({ className, size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.385 2H4.615C3.17 2 2 3.17 2 4.615v14.77C2 20.83 3.17 22 4.615 22h14.77C20.83 22 22 20.83 22 19.385V4.615C22 3.17 20.83 2 19.385 2zM10.3 15.608c0 .77-.625 1.393-1.393 1.393H5.693A1.393 1.393 0 0 1 4.3 15.608V5.692c0-.77.624-1.393 1.393-1.393H8.91c.77 0 1.392.624 1.392 1.393v9.916zm9.4 -4.608c0 .77-.624 1.393-1.393 1.393h-3.214a1.393 1.393 0 0 1-1.393-1.393V5.692c0-.77.625-1.393 1.393-1.393h3.214c.77 0 1.393.624 1.393 1.393v5.308z"/>
  </svg>
);

export const SalesforceIcon: React.FC<BrandIconProps> = ({ className, size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
  </svg>
);

export const HubSpotIcon: React.FC<BrandIconProps> = ({ className, size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.8 7.2v3.6h-2.4V7.2H13V4.8h2.4V2.4h2.4v2.4H20v2.4h-2.2zm-6 2.4V7.2H6V4.8H3.6v2.4H1.2v2.4h2.4v9.6H6V9.6h5.8zm7.2 4.8v4.8h-2.4v-4.8h-2.4v-2.4h2.4V9.6h2.4v2.4H20v2.4h-1zm-6 0v4.8H9.6v-4.8H7.2v-2.4h2.4v-2.4h2.4v2.4H14v2.4h-1.8z"/>
  </svg>
);

export const DiscordIcon: React.FC<BrandIconProps> = ({ className, size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

export const DefaultPlugIcon: React.FC<BrandIconProps> = ({ className, size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2v6M9 3v5M15 3v5M6 8h12a2 2 0 0 1 2 2v3a6 6 0 0 1-12 0v-3a2 2 0 0 1 2-2zM12 17v5"/>
  </svg>
);

export const GoogleDriveIcon = GmailIcon;
export const MicrosoftTeamsIcon = DefaultPlugIcon;
export const MicrosoftSharePointIcon = DefaultPlugIcon;
export const OneDriveIcon = DefaultPlugIcon;
export const LinearIcon = DefaultPlugIcon;
export const AsanaIcon = DefaultPlugIcon;
export const ClickUpIcon = DefaultPlugIcon;
export const ZendeskIcon = DefaultPlugIcon;
export const CustomIntegrationIcon = DefaultPlugIcon;

export const ICON_MAP: Record<string, React.FC<BrandIconProps>> = {
  gmail: GmailIcon,
  google: GoogleDriveIcon,
  github: GitHubIcon,
  slack: SlackIcon,
  jira: JiraIcon,
  notion: NotionIcon,
  confluence: ConfluenceIcon,
  'microsoft-teams': MicrosoftTeamsIcon,
  'microsoft-sharepoint': MicrosoftSharePointIcon,
  onedrive: OneDriveIcon,
  dropbox: DropboxIcon,
  gitlab: GitLabIcon,
  bitbucket: BitbucketIcon,
  linear: LinearIcon,
  asana: AsanaIcon,
  trello: TrelloIcon,
  clickup: ClickUpIcon,
  salesforce: SalesforceIcon,
  hubspot: HubSpotIcon,
  zendesk: ZendeskIcon,
  discord: DiscordIcon,
  custom: CustomIntegrationIcon,
};
