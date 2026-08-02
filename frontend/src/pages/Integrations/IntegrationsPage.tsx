import {
  Plug,
  AlertCircle,
} from 'lucide-react';
import { useConnections } from '@/hooks/useConnections';
import { ConnectionCard } from '@/components/integrations/ConnectionCard';
import { CustomIntegrationModal } from '@/components/integrations/CustomIntegrationModal';
import { PROVIDERS } from '@/constants/providers';
import { Spinner } from '@/components/ui/Spinner';
import { useState } from 'react';
import './IntegrationsPage.css';

export const IntegrationsPage = () => {
  const {
    connections,
    isLoading,
    isSyncingDrive,
    error,
    triggerDriveSync,
    getConnection,
  } = useConnections();

  const connectedCount = connections.length;
  const totalProvidersCount = PROVIDERS.length;
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  const handleSaveCustomIntegration = (data: Record<string, unknown>) => {
    console.log('Custom integration saved:', data);
  };

  return (
    <div className="integrations-page">
      {/* ── Hero Header ── */}
      <header className="integrations-hero-panel">
        <div className="integrations-hero-text">
          <h1>
            <Plug size={24} className="text-muted" />
            Enterprise Data Connectors
          </h1>

        </div>

        <div className="integrations-stats-pill">
          <span className="stats-count-big">{connectedCount}</span>
          <div className="stats-count-label">
            <span className="stats-count-title">Connected Services</span>
            <span className="stats-count-sub">out of {totalProvidersCount} available connectors</span>
          </div>
        </div>
      </header>

      {/* ── Error Banner ── */}
      {error && (
        <div
          style={{
            padding: '1rem',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-error-bg)',
            border: '1px solid var(--color-error)',
            color: '#fca5a5',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* ── Provider Cards Grid ── */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0', gap: '1rem' }}>
          <Spinner size="lg" />
          <p className="text-slate-400 text-sm">Loading integration connection states...</p>
        </div>
      ) : (
        <section className="integrations-grid" aria-label="Available Connectors">
          {PROVIDERS.map((providerMeta) => {
            const activeConnection = getConnection(providerMeta.id);

            return (
              <ConnectionCard
                key={providerMeta.id}
                providerMeta={providerMeta}
                connection={activeConnection}
                onTriggerDriveSync={triggerDriveSync}
                isSyncingDrive={isSyncingDrive}
                onAddCustom={providerMeta.id === 'custom' ? () => setIsCustomModalOpen(true) : undefined}
              />
            );
          })}
        </section>
      )}

      {/* ── Security & Data Compliance Section ── */}

      <CustomIntegrationModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSave={handleSaveCustomIntegration}
      />
    </div>
  );
};

export default IntegrationsPage;
