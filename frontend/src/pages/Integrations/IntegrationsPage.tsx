import {
  Plug,
  ShieldCheck,
  Lock,
  RefreshCw,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { useConnections } from '@/hooks/useConnections';
import { ConnectionCard } from '@/components/integrations/ConnectionCard';
import { PROVIDERS } from '@/constants/providers';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import './IntegrationsPage.css';

export const IntegrationsPage = () => {
  const {
    connections,
    isLoading,
    isSyncingDrive,
    error,
    submitManualToken,
    triggerDriveSync,
    getConnection,
  } = useConnections();

  const connectedCount = connections.length;
  const totalProvidersCount = PROVIDERS.length;

  return (
    <div className="integrations-page">
      {/* ── Hero Header ── */}
      <header className="integrations-hero-panel">
        <div className="integrations-hero-text">
          <h1>
            <Plug size={24} className="text-purple-400" />
            Enterprise Data Connectors & Integrations
          </h1>
          <p>
            Connect cloud document stores, code repositories, and collaboration workspaces. EAIOS
            continuously indexes connected assets into secure vector embeddings scoped by RBAC.
          </p>
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
                onSubmitManualToken={submitManualToken}
                onTriggerDriveSync={triggerDriveSync}
                isSyncingDrive={isSyncingDrive}
              />
            );
          })}
        </section>
      )}

      {/* ── Security & Data Compliance Section ── */}
      <section className="security-assurance-card" aria-label="Security Assurance">
        <div className="security-header">
          <ShieldCheck size={22} className="text-blue-400" />
          <h3>Data Security & Encryption Guarantees</h3>
          <Badge variant="blue">Enterprise Security</Badge>
        </div>

        <div className="security-grid">
          <div className="security-feature-item">
            <Lock size={20} className="security-feature-icon" />
            <div>
              <div className="security-feature-title">AES-256 Encryption at Rest</div>
              <div className="security-feature-desc">
                All OAuth refresh tokens and manual API keys are stored encrypted using Fernet symmetric key cryptography.
              </div>
            </div>
          </div>

          <div className="security-feature-item">
            <Eye size={20} className="security-feature-icon" />
            <div>
              <div className="security-feature-title">Read-Only Scope Enforcement</div>
              <div className="security-feature-desc">
                Integrations request minimum read-only permissions (`drive.readonly`, `repo`). No write access is ever requested.
              </div>
            </div>
          </div>

          <div className="security-feature-item">
            <RefreshCw size={20} className="security-feature-icon" />
            <div>
              <div className="security-feature-title">Continuous Background Ingestion</div>
              <div className="security-feature-desc">
                Document changes and new files are automatically chunked into 500-character vector embeddings upon sync.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default IntegrationsPage;
