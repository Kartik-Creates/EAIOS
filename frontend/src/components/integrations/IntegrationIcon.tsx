import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGoogle,
  faGithub,
  faSlack,
  faJira,
  faNotion,
  faConfluence,
  faDropbox,
  faGitlab,
  faBitbucket,
  faTrello,
  faSalesforce,
  faHubspot,
  faDiscord,
} from '@fortawesome/free-brands-svg-icons';
import { faPlug } from '@fortawesome/free-solid-svg-icons';

interface BrandIconProps {
  className?: string;
  size?: number;
}

interface IconComponentProps extends BrandIconProps {
  icon: any;
}

const BrandIcon: React.FC<IconComponentProps> = ({
  className,
  size = 24,
  icon,
}) => (
  <FontAwesomeIcon
    icon={icon}
    className={className}
    style={{ fontSize: size }}
  />
);

// Available Brand Icons
export const GmailIcon = (props: BrandIconProps) => (
  <BrandIcon {...props} icon={faGoogle} />
);

export const GitHubIcon = (props: BrandIconProps) => (
  <BrandIcon {...props} icon={faGithub} />
);

export const SlackIcon = (props: BrandIconProps) => (
  <BrandIcon {...props} icon={faSlack} />
);

export const JiraIcon = (props: BrandIconProps) => (
  <BrandIcon {...props} icon={faJira} />
);

export const NotionIcon = (props: BrandIconProps) => (
  <BrandIcon {...props} icon={faNotion} />
);

export const ConfluenceIcon = (props: BrandIconProps) => (
  <BrandIcon {...props} icon={faConfluence} />
);

export const DropboxIcon = (props: BrandIconProps) => (
  <BrandIcon {...props} icon={faDropbox} />
);

export const GitLabIcon = (props: BrandIconProps) => (
  <BrandIcon {...props} icon={faGitlab} />
);

export const BitbucketIcon = (props: BrandIconProps) => (
  <BrandIcon {...props} icon={faBitbucket} />
);

export const TrelloIcon = (props: BrandIconProps) => (
  <BrandIcon {...props} icon={faTrello} />
);

export const SalesforceIcon = (props: BrandIconProps) => (
  <BrandIcon {...props} icon={faSalesforce} />
);

export const HubSpotIcon = (props: BrandIconProps) => (
  <BrandIcon {...props} icon={faHubspot} />
);

export const DiscordIcon = (props: BrandIconProps) => (
  <BrandIcon {...props} icon={faDiscord} />
);

// Fallback Icons
export const GoogleDriveIcon = (props: BrandIconProps) => (
  <BrandIcon {...props} icon={faPlug} />
);

export const MicrosoftTeamsIcon = (props: BrandIconProps) => (
  <BrandIcon {...props} icon={faPlug} />
);

export const MicrosoftSharePointIcon = (props: BrandIconProps) => (
  <BrandIcon {...props} icon={faPlug} />
);

export const OneDriveIcon = (props: BrandIconProps) => (
  <BrandIcon {...props} icon={faPlug} />
);

export const LinearIcon = (props: BrandIconProps) => (
  <BrandIcon {...props} icon={faPlug} />
);

export const AsanaIcon = (props: BrandIconProps) => (
  <BrandIcon {...props} icon={faPlug} />
);

export const ClickUpIcon = (props: BrandIconProps) => (
  <BrandIcon {...props} icon={faPlug} />
);

export const ZendeskIcon = (props: BrandIconProps) => (
  <BrandIcon {...props} icon={faPlug} />
);

export const CustomIntegrationIcon = (props: BrandIconProps) => (
  <BrandIcon {...props} icon={faPlug} />
);

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