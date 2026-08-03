import { useEffect } from 'react';
import {
  Plug,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useConnections } from '@/hooks/useConnections';
import { ConnectionCard } from '@/components/integrations/ConnectionCard';
import { CustomIntegrationModal } from '@/components/integrations/CustomIntegrationModal';
import { PROVIDERS } from '@/constants/providers';
import { Spinner } from '@/components/ui/Spinner';
import { useState } from 'react';
import { staggerContainer, staggerItem } from '@/lib/motion';
import './IntegrationsPage.css';

export const IntegrationsPage = () => {
  const {
    connections,
    isLoading,
    error,
    getConnection,
    refreshConnections,
    submitManualToken,
    disconnectConnection,
  } = useConnections();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected');
    const callbackError = params.get('error');

    if (connected) {
      toast.success(`Successfully connected ${connected.toUpperCase()} integration!`);
      window.history.replaceState({}, document.title, window.location.pathname);
      refreshConnections();

    } else if (callbackError) {
      toast.error(`Connection cancelled or failed: ${callbackError}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [refreshConnections]);


  const connectedCount = connections.length;
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  const handleSaveCustomIntegration = (data: Record<string, unknown>) => {
    console.log('Custom integration saved:', data);
  };


  return (
    <motion.div className="integrations-page">
      {/* ── Hero Header ── */}
      <motion.header className="integrations-hero-panel" variants={staggerItem}>
        <div className="integrations-hero-text">
          <h1>
            <Plug size={24} className="text-muted" />
            Enterprise Data Connectors
          </h1>


          <div className="integrations-stats-pill">
            <span className="stats-count-big">{connectedCount}</span>
            <div className="stats-count-label">
              <span className="stats-count-title">Connected Services</span>
            </div>
          </div>
        </div>
      </motion.header>

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
        <motion.section className="integrations-grid" aria-label="Available Connectors" variants={staggerContainer}>
          {PROVIDERS.map((providerMeta) => {
            const activeConnection = getConnection(providerMeta.id);

            return (
              <motion.div key={providerMeta.id} variants={staggerItem}>
                <ConnectionCard
                  providerMeta={providerMeta}
                  connection={activeConnection}
                  onSubmitManualToken={submitManualToken}
                  onAddCustom={providerMeta.id === 'custom' ? () => setIsCustomModalOpen(true) : undefined}
                  onDisconnect={disconnectConnection}
                />
              </motion.div>
            );
          })}
        </motion.section>
      )}

      {/* ── Security & Data Compliance Section ── */}

      <CustomIntegrationModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSave={handleSaveCustomIntegration}
      />
    </motion.div>
  );
};

export default IntegrationsPage;
