import { useState } from 'react';
import { Plug } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useConnections } from '@/hooks/useConnections';
import { ConnectionCard } from '@/components/integrations/ConnectionCard';
import { ServicePickerModal } from '@/components/integrations/ServicePickerModal';
import { PROVIDERS } from '@/constants/providers';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { type ApiErrorShape } from '@/utils/apiError';
import './IntegrationsPage.css';

export const IntegrationsPage = () => {
  const {
    connections,
    isLoading,
    disconnectConnection,
  } = useConnections();

  const [isServicePickerOpen, setIsServicePickerOpen] = useState(false);
  const [removingCardId, setRemovingCardId] = useState<string | null>(null);

  const handleRemoveCard = (providerId: string) => {
    setRemovingCardId((prev) => (prev === providerId ? null : providerId));
  };

  const handleDisconnect = async (providerId: string) => {
    try {
      await disconnectConnection(providerId);
      toast.success(`Disconnected and removed integration.`);
      handleRemoveCard(providerId);
    } catch (err: unknown) {
      const e = err as ApiErrorShape;
      const msg = e?.response?.data?.detail || e?.message || `Failed to disconnect ${providerId}.`;
      toast.error(msg);
    }
  };

  const handleAddProvider = () => {
    setIsServicePickerOpen(false);
  };

  const activeProviders = connections.map((c) => c.provider);

  if (isLoading) {
    return (
      <div className="integrations-loading">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="integrations-page">
      <div className="integrations-header">
        <div>
          <h1>Integrations</h1>
          <p>Connect your tools to enable AI-powered workflows.</p>
        </div>
        <Button variant="primary" onClick={() => setIsServicePickerOpen(true)}>
          <Plug size={16} /> Add Integration
        </Button>
      </div>

      <div className="integrations-grid">
        {PROVIDERS.map((provider) => {
          const connection = connections.find((c) => c.provider === provider.id);
          return (
            <ConnectionCard
              key={provider.id}
              providerMeta={provider}
              connection={connection}
              onDisconnect={handleDisconnect}
              onRemove={handleRemoveCard}
              isRemoving={removingCardId === provider.id}
            />
          );
        })}
      </div>

      <AnimatePresence>
        {isServicePickerOpen && (
          <ServicePickerModal
            isOpen={isServicePickerOpen}
            onClose={() => setIsServicePickerOpen(false)}
            activeProviders={activeProviders}
            onAddProvider={handleAddProvider}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default IntegrationsPage;