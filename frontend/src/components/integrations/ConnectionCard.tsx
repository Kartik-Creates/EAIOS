import { useState } from 'react';
import {
  HardDrive,
  GitBranch,
  Mail,
  MessageSquare,
  Kanban,
  Plug,
  type LucideIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';

import type {
  ProviderMeta,
  OAuthConnection,
  TokenManualInput,
} from '@/types/integration.types';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ManualTokenModal } from './ManualTokenModal';
import { integrationsService } from '@/services/integrationsService';

const ICON_MAP: Record<string, LucideIcon> = {
  Mail,
  HardDrive,
  Github: GitBranch,
  MessageSquare,
  Kanban,
  Plug,
};

interface ConnectionCardProps {
  providerMeta: ProviderMeta;
  connection?: OAuthConnection;
  onSubmitManualToken?: (payload: TokenManualInput) => Promise<void>;
  onAddCustom?: () => void;
  onDisconnect?: (providerId: string) => Promise<void>;
}

export const ConnectionCard = ({
  providerMeta,
  connection,
  onSubmitManualToken,
  onAddCustom,
  onDisconnect,
}: ConnectionCardProps) => {
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const IconComponent = ICON_MAP[providerMeta.icon] || HardDrive;
  const isConnected = !!connection;

  const handleConnect = async () => {
    if (providerMeta.authMethod === 'custom') {
      onAddCustom?.();
      return;
    }

    if (providerMeta.authMethod === 'manual') {
      setIsTokenModalOpen(true);
      return;
    }

    try {
      setIsConnecting(true);
      const url = await integrationsService.connectOAuth(providerMeta.id);
      if (url) {
        window.location.href = url;
      } else {
        toast.error('Failed to generate OAuth authorization URL.');
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        `Failed to connect to ${providerMeta.label}`;
      toast.error(msg);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!onDisconnect) return;
    try {
      setIsDisconnecting(true);
      await onDisconnect(providerMeta.id);
      toast.success(`Disconnected ${providerMeta.label}.`);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || `Failed to disconnect ${providerMeta.label}.`;
      toast.error(msg);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleManualTokenSubmit = async (payload: TokenManualInput) => {
    if (!onSubmitManualToken) return;
    await onSubmitManualToken(payload);
    setIsTokenModalOpen(false);
  };

  const ctaLabel = providerMeta.authMethod === 'custom'
    ? 'Add Integration'
    : isConnected
      ? 'Disconnect'
      : 'Connect';

  const handleCtaClick = () => {
    if (providerMeta.authMethod === 'custom') {
      onAddCustom?.();
      return;
    }
    if (isConnected) {
      handleDisconnect();
    } else {
      handleConnect();
    }
  };

  return (
    <>
      <div className="connection-card">
        <div className="connection-card-logo">
          <IconComponent size={32} />
        </div>

        <h3 className="connection-card-title">{providerMeta.label}</h3>

        <div className="connection-card-status">
          {isConnected ? (
            <Badge variant="green">Connected</Badge>
          ) : (
            <Badge variant="slate">Not Connected</Badge>
          )}
        </div>

        <Button
          variant={isConnected ? 'secondary' : 'primary'}
          size="md"
          className="connection-card-button"
          onClick={handleCtaClick}
          disabled={isConnecting || isDisconnecting}
          isLoading={isConnecting || isDisconnecting}
        >
          {ctaLabel}
        </Button>
      </div>

      {providerMeta.authMethod === 'manual' && onSubmitManualToken && (
        <ManualTokenModal
          isOpen={isTokenModalOpen}
          onClose={() => setIsTokenModalOpen(false)}
          provider={providerMeta.id as 'slack' | 'jira'}
          providerLabel={providerMeta.label}
          onSubmitToken={handleManualTokenSubmit}
        />
      )}
    </>
  );
};
