import { useState } from 'react';
import {
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
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
import { iconHoverVariants } from '@/lib/motion';
import { ICON_MAP } from './IntegrationIcon';

interface ConnectionCardProps {
  providerMeta: ProviderMeta;
  connection?: OAuthConnection;
  onSubmitManualToken?: (payload: TokenManualInput) => Promise<void>;
  onDisconnect?: (providerId: string) => Promise<void>;
  onRemove?: (providerId: string) => void;
  isRemoving?: boolean;
}

export const ConnectionCard = ({
  providerMeta,
  connection,
  onSubmitManualToken,
  onDisconnect,
  onRemove,
  isRemoving = false,
}: ConnectionCardProps) => {
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const BrandIcon = ICON_MAP[providerMeta.id] || ICON_MAP.custom;
  const isConnected = !!connection;

  const handleConnect = async () => {
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

  const handleRemoveClick = async () => {
    if (!onRemove) return;
    if (isConnected) {
      toast.error('Please disconnect the service before removing this integration.');
      return;
    }
    await onRemove(providerMeta.id);
  };

  const ctaLabel = isConnected
    ? 'Disconnect'
    : 'Connect';

  const handleCtaClick = () => {
    if (isConnected) {
      handleDisconnect();
    } else {
      handleConnect();
    }
  };

  return (
    <>
      <div className="connection-card">
        <motion.button
          type="button"
          className="connection-card-remove"
          onClick={handleRemoveClick}
          disabled={isRemoving}
          variants={iconHoverVariants}
          initial="rest"
          whileHover="hover"
          whileTap="tap"
          aria-label="Remove integration"
          title="Remove Integration"
        >
          <X size={14} />
        </motion.button>

        <div className="connection-card-logo">
          <BrandIcon size={24} className="connection-card-logo-img" />
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
