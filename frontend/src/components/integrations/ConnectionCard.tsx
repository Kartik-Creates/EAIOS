import { useState } from 'react';
import {
  HardDrive,
  GitBranch,
  MessageSquare,
  Kanban,
  Mail,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Key,
  type LucideIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/services/axios';
import type { ProviderMeta, OAuthConnection, TokenManualInput, DriveSyncResult } from '@/types/integration.types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ManualTokenModal } from './ManualTokenModal';

const ICON_MAP: Record<string, LucideIcon> = {
  Mail,
  HardDrive,
  Github: GitBranch,
  MessageSquare,
  Kanban,
};

interface ConnectionCardProps {
  providerMeta: ProviderMeta;
  connection?: OAuthConnection;
  onSubmitManualToken: (payload: TokenManualInput) => Promise<void>;
  onTriggerDriveSync: () => Promise<DriveSyncResult>;
  isSyncingDrive: boolean;
}

export const ConnectionCard = ({
  providerMeta,
  connection,
  onSubmitManualToken,
  onTriggerDriveSync,
  isSyncingDrive,
}: ConnectionCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const IconComponent = ICON_MAP[providerMeta.icon] || HardDrive;
  const isConnected = !!connection;

  const handleOAuthConnect = async () => {
    try {
      setIsConnecting(true);
      const response = await apiClient.get<{ url: string }>(`/integrations/${providerMeta.id}/connect`);
      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        toast.error('Failed to generate OAuth redirect URL.');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || `Failed to connect to ${providerMeta.label}`;
      toast.error(msg);
    } finally {
      setIsConnecting(false);
    }
  };


  const handleSyncDrive = async () => {
    try {
      setSyncFeedback(null);
      const res = await onTriggerDriveSync();
      setSyncFeedback(`Sync Complete: ${res.synced} files synced (${res.errors} errors).`);
    } catch (err: any) {
      setSyncFeedback(`Sync Error: ${err.message || 'Drive sync failed.'}`);
    }
  };

  return (
    <>
      <div className="connection-card">
        <div className="connection-card-header">
          <div className="provider-icon-badge" style={{ backgroundColor: 'var(--bg-dark)' }}>
            <IconComponent size={24} className="text-blue-400" />
          </div>

          <div className="provider-info">
            <h3 className="provider-label">{providerMeta.label}</h3>
            <span className="auth-method-tag">
              {providerMeta.authMethod === 'oauth' ? 'OAuth2 SSO' : 'Manual Token'}
            </span>
          </div>

          <div className="connection-status">
            {isConnected ? (
              <Badge variant="green">
                <CheckCircle2 size={12} className="inline mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="slate">Not Connected</Badge>
            )}
          </div>
        </div>

        <p className="provider-description">{providerMeta.description}</p>

        {isConnected && connection?.scopes && (
          <div className="connection-meta-box">
            <span className="meta-label">Granted Scopes:</span>
            <span className="meta-value">{connection.scopes}</span>
          </div>
        )}

        {syncFeedback && (
          <div className="sync-feedback-banner">
            <span>{syncFeedback}</span>
          </div>
        )}

        <div className="connection-card-actions">
          {providerMeta.authMethod === 'oauth' ? (
            <Button
              variant={isConnected ? 'secondary' : 'primary'}
              size="sm"
              onClick={handleOAuthConnect}
              disabled={isConnecting}
            >
              <ExternalLink size={14} className="mr-1" />
              {isConnecting ? 'Connecting...' : isConnected ? 'Reconnect OAuth' : 'Connect via OAuth'}
            </Button>

          ) : (
            <Button
              variant={isConnected ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => setIsModalOpen(true)}
            >
              <Key size={14} className="mr-1" />
              {isConnected ? 'Update Token' : 'Configure Token'}
            </Button>
          )}

          {/* Special action for Google Drive sync */}
          {providerMeta.id === 'google' && isConnected && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSyncDrive}
              isLoading={isSyncingDrive}
              disabled={isSyncingDrive}
            >
              <RefreshCw size={14} className="mr-1" />
              Trigger RAG Sync
            </Button>
          )}
        </div>
      </div>

      {providerMeta.authMethod === 'manual' && (
        <ManualTokenModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          provider={providerMeta.id as 'slack' | 'jira'}
          providerLabel={providerMeta.label}
          onSubmitToken={onSubmitManualToken}
        />
      )}
    </>
  );
};
