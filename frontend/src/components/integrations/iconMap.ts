import { type FC } from 'react';
import type { BrandIconProps } from './IntegrationIcon';
import {
  GmailIcon,
  GitHubIcon,
  SlackIcon,
  JiraIcon,
  NotionIcon,
  ConfluenceIcon,
  DropboxIcon,
  GitLabIcon,
  BitbucketIcon,
  TrelloIcon,
  SalesforceIcon,
  HubSpotIcon,
  DiscordIcon,
  DefaultPlugIcon,
} from './IntegrationIcon';

export const ICON_MAP: Record<string, FC<BrandIconProps>> = {
  gmail: GmailIcon,
  google: GmailIcon,
  google_drive: GmailIcon,
  github: GitHubIcon,
  slack: SlackIcon,
  jira: JiraIcon,
  notion: NotionIcon,
  confluence: ConfluenceIcon,
  'microsoft-teams': DefaultPlugIcon,
  'microsoft-sharepoint': DefaultPlugIcon,
  onedrive: DefaultPlugIcon,
  dropbox: DropboxIcon,
  gitlab: GitLabIcon,
  bitbucket: BitbucketIcon,
  linear: DefaultPlugIcon,
  asana: DefaultPlugIcon,
  trello: TrelloIcon,
  clickup: DefaultPlugIcon,
  salesforce: SalesforceIcon,
  hubspot: HubSpotIcon,
  zendesk: DefaultPlugIcon,
  discord: DiscordIcon,
  custom: DefaultPlugIcon,
};

export default ICON_MAP;