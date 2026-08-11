import { useEffect } from 'react';
import {
  Plug,
  AlertCircle,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useConnections } from '@/hooks/useConnections';
import { ConnectionCard } from '@/components/integrations/ConnectionCard';
import { ServicePickerModal } from '@/components/integrations/ServicePickerModal';
import { PROVIDERS } from '@/constants/providers';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
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
  const [activeProviders, setActiveProviders] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('eaios_active_integrations');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore parse errors
    }
    return ['gmail', 'google', 'github', 'slack', 'jira'];
  });
  const [isServicePickerOpen, setIsServicePickerOpen] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState<{ providerId: string; label: string } | null>(null);
  const [connectedModal, setConnectedModal] = useState<{ providerId: string; label: string } | null>(null);

  useEffect(() => {
    localStorage.setItem('eaios_active_integrations', JSON.stringify(activeProviders));
  }, [activeProviders]);

  const handleRemoveCard = (providerId: string) => {
    setActiveProviders((prev) => prev.filter((id) => id !== providerId));
    setRemoveConfirm(null);
  };

  const handleDisconnectAndRemove = async (providerId: string) => {
    try {
      await disconnectConnection(providerId);
      toast.success(`Disconnected and removed integration.`);
      handleRemoveCard(providerId);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || `Failed to disconnect ${providerId}.`;
      toast.error(msg);
    }
  };

  const handleAddProvider = (providerId: string) => {
    setActiveProviders((prev) => [...prev, providerId]);
    setIsServicePickerOpen(false);
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
          <AnimatePresence>
            {activeProviders.map((providerId) => {
              const providerMeta = PROVIDERS.find((p) => p.id === providerId);
              if (!providerMeta) return null;
              const activeConnection = getConnection(providerId);
              const isConnected = !!activeConnection;

              return (
                <motion.div
                  key={providerId}
                  variants={staggerItem}
                  initial="rest"
                  animate="animate"
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                >
                  <ConnectionCard
                    providerMeta={providerMeta}
                    connection={activeConnection}
                    onSubmitManualToken={submitManualToken}
                    onDisconnect={disconnectConnection}
                    onRemove={(id) => {
                      if (isConnected) {
                        setConnectedModal({ providerId: id, label: providerMeta.label });
                      } else {
                        setRemoveConfirm({ providerId: id, label: providerMeta.label });
                      }
                    }}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* ── Add Integration Card ── */}
          <motion.div variants={staggerItem}>
            <button
              type="button"
              className="add-integration-card"
              onClick={() => setIsServicePickerOpen(true)}
            >
              <div className="add-integration-icon">
                <Plug size={24} />
              </div>
              <h3 className="add-integration-title">Add Integration</h3>
              <p className="add-integration-subtitle">Add another enterprise service.</p>
              <Button variant="primary" size="md" className="add-integration-button">
                Choose Service
              </Button>
            </button>
          </motion.div>
        </motion.section>
      )}

      {/* ── Service Picker Modal ── */}
      <ServicePickerModal
        isOpen={isServicePickerOpen}
        onClose={() => setIsServicePickerOpen(false)}
        activeProviders={activeProviders}
        onAddProvider={handleAddProvider}
      />

      {/* ── Remove Confirmation Modal ── */}
      <AnimatePresence>
        {removeConfirm && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRemoveConfirm(null)}
          >
            <motion.div
              className="modal-content"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3 className="modal-title">Remove Integration</h3>
                <button
                  type="button"
                  className="modal-close"
                  onClick={() => setRemoveConfirm(null)}
                >
                  <X size={18} />
                </button>
              </div>
              <p className="modal-body">
                Are you sure you want to remove <strong>{removeConfirm.label}</strong>?
                This action cannot be undone.
              </p>
              <div className="modal-actions">
                <Button variant="ghost" onClick={() => setRemoveConfirm(null)}>
                  Cancel
                </Button>
                <Button variant="secondary" onClick={() => handleRemoveCard(removeConfirm.providerId)}>
                  Remove
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Connected Service Modal ── */}
      <AnimatePresence>
        {connectedModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConnectedModal(null)}
          >
            <motion.div
              className="modal-content"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3 className="modal-title">Service is still connected</h3>
                <button
                  type="button"
                  className="modal-close"
                  onClick={() => setConnectedModal(null)}
                >
                  <X size={18} />
                </button>
              </div>
              <p className="modal-body">
                This integration cannot be removed because it is currently connected.
                <br />
                Please disconnect the service first.
              </p>
              <div className="modal-actions">
                <Button variant="ghost" onClick={() => setConnectedModal(null)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={() => handleDisconnectAndRemove(connectedModal.providerId)}>
                  Disconnect Service
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default IntegrationsPage;
