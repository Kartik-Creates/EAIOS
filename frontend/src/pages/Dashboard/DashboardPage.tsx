import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Search,
  Plug,
  ShieldCheck,
  Activity,
  Database,
  ArrowRight,
  FileText,
  CheckCircle2,
  HardDrive,
  Users,
  Clock,
  TrendingUp,
  BarChart3,
  ArrowUpRight,
  GitBranch,
  MessageCircle,
  SearchCheck,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { healthService } from '@/services/healthService';
import { integrationsService } from '@/services/integrationsService';
import type { OAuthConnection } from '@/types/integration.types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/constants/routes';
import './DashboardPage.css';

/**
 * Gets a friendly dynamic greeting based on the current hour of the day.
 */
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [promptQuery, setPromptQuery] = useState('');
  const [backendHealth, setBackendHealth] = useState<'online' | 'offline' | 'checking'>('checking');
  const [connections, setConnections] = useState<OAuthConnection[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);

  // Check health and load user connections on mount
  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      // 1. Health check
      try {
        const health = await healthService.check();
        if (isMounted) {
          if (health.status === 'ok') {
            setBackendHealth('online');
          } else {
            setBackendHealth('offline');
          }
        }
      } catch (err) {
        if (isMounted) setBackendHealth('offline');
      }

      // 2. Fetch user connected integrations
      try {
        const list = await integrationsService.listConnections();
        if (isMounted) setConnections(list);
      } catch (err) {
        // Safe fallback if token is invalid or endpoint fails
        if (isMounted) setConnections([]);
      } finally {
        if (isMounted) setIsLoadingConnections(false);
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePromptSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!promptQuery.trim()) return;
    navigate(`${ROUTES.CHAT}?prompt=${encodeURIComponent(promptQuery.trim())}`);
  };

  const handleChipClick = (promptText: string) => {
    navigate(`${ROUTES.CHAT}?prompt=${encodeURIComponent(promptText)}`);
  };

  const userName = user?.full_name || user?.email || 'Enterprise User';

  // ── Mock executive data (pending real backend endpoints) ──
  interface ApprovalItem {
    id: string;
    title: string;
    requester: string;
    type: 'leave' | 'access' | 'workflow';
    submittedAt: string;
  }

  interface UsageStat {
    label: string;
    value: string | number;
    change: string;
    trend: 'up' | 'down' | 'neutral';
    icon: React.ReactNode;
  }

  const pendingApprovals: ApprovalItem[] = [
    {
      id: 'apr-1',
      title: 'PTO Request — Alice Johnson',
      requester: 'alice@eaios.enterprise',
      type: 'leave',
      submittedAt: '2h ago',
    },
    {
      id: 'apr-2',
      title: 'HR-Only Document Access — Bob Smith',
      requester: 'bob@eaios.enterprise',
      type: 'access',
      submittedAt: '4h ago',
    },
    {
      id: 'apr-3',
      title: 'Workflow: Bulk Drive Sync Approval',
      requester: 'system',
      type: 'workflow',
      submittedAt: '6h ago',
    },
  ];

  const usageStats: UsageStat[] = [
    {
      label: 'AI Chat Queries',
      value: '1,284',
      change: '+12%',
      trend: 'up',
      icon: <MessageCircle size={18} className="text-muted" />,
    },
    {
      label: 'Semantic Searches',
      value: '862',
      change: '+8%',
      trend: 'up',
      icon: <SearchCheck size={18} className="text-muted" />,
    },
    {
      label: 'Workflow Triggers',
      value: '142',
      change: '+24%',
      trend: 'up',
      icon: <GitBranch size={18} className="text-muted" />,
    },
    {
      label: 'Avg Response Time',
      value: '1.8s',
      change: '-0.3s',
      trend: 'up',
      icon: <TrendingUp size={18} className="text-muted" />,
    },
  ];

  return (
    <div className="dashboard-page">
      {/* ── Hero Welcome Section ── */}
      <section className="dashboard-hero" aria-label="Welcome banner">
        <div className="hero-content-wrapper">
          <div className="hero-title-area">
            <div className="hero-badge-row">
              <div className="status-pill">
                <span className="status-dot" />
                {backendHealth === 'checking'
                  ? 'Checking System Status...'
                  : backendHealth === 'online'
                    ? 'System Operational'
                    : 'Backend Disconnected'}
              </div>
            </div>

            <h1>
              {getGreeting()}, <span className="text-accent">{userName}</span>
            </h1>
          </div>

          <div className="hero-actions">
            <Button variant="primary" onClick={() => navigate(ROUTES.CHAT)}>
              <MessageSquare size={18} className="mr-2" />
              Ask AI Assistant
            </Button>
            <Button variant="ghost" onClick={() => navigate(ROUTES.SEARCH)}>
              <Search size={18} className="mr-2" />
              Semantic Search
            </Button>
          </div>
        </div>
      </section>

      {/* ── Key Metrics Grid ── */}
      <section className="kpi-grid" aria-label="System Metrics">
        <div className="kpi-card">
          <div className="kpi-header">
            <div className="kpi-icon-wrapper bg-secondary text-muted">
              <Database size={22} />
            </div>
            <span className="kpi-trend positive">+14% this week</span>
          </div>
          <div className="kpi-value">1,248</div>
          <div className="kpi-label">Indexed Vector Chunks</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <div className="kpi-icon-wrapper bg-secondary text-muted">
              <Activity size={22} />
            </div>
            <span className="kpi-trend positive">Active</span>
          </div>
          <div className="kpi-value">RAG Engine v1</div>
          <div className="kpi-label">Neural Retrieval Pipeline</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <div className="kpi-icon-wrapper bg-secondary text-muted">
              <Plug size={22} />
            </div>
            <span className="kpi-trend neutral">
              {isLoadingConnections ? 'Loading...' : `${connections.length} Connected`}
            </span>
          </div>
          <div className="kpi-value">{connections.length}</div>
          <div className="kpi-label">Active Cloud Integrations</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <div className="kpi-icon-wrapper bg-secondary text-muted">
              <Activity size={22} />
            </div>
            <span className={`kpi-trend ${backendHealth === 'online' ? 'positive' : 'neutral'}`}>
              {backendHealth === 'online' ? '99.9% Uptime' : 'Offline'}
            </span>
          </div>
          <div className="kpi-value">
            {backendHealth === 'online' ? 'Healthy' : backendHealth === 'checking' ? 'Checking...' : 'Down'}
          </div>
          <div className="kpi-label">FastAPI Backend Status</div>
        </div>
      </section>

      {/* ── Quick Prompt Launch Bar ── */}
      <section className="quick-prompt-banner" aria-label="Quick Prompt Assistant">
        <div className="quick-prompt-header">
          <MessageSquare size={20} className="text-muted" />
          <h2>Instant Knowledge Query</h2>
        </div>

        <form onSubmit={handlePromptSubmit} className="quick-prompt-input-group">
          <input
            type="text"
            placeholder="Ask anything about your workspace documents, security compliance, or system APIs..."
            value={promptQuery}
            onChange={(e) => setPromptQuery(e.target.value)}
            aria-label="Ask AI Assistant prompt input"
          />
          <Button type="submit" variant="primary">
            Send Prompt <ArrowRight size={16} className="ml-2" />
          </Button>
        </form>

        <div className="quick-prompt-chips">
          <span className="quick-prompt-label">Suggested Prompts:</span>
          <button
            type="button"
            className="chip-btn"
            onClick={() => handleChipClick('Summarize active policy documents and security standards')}
          >
            <FileText size={14} /> Summarize policy updates
          </button>
          <button
            type="button"
            className="chip-btn"
            onClick={() => handleChipClick('How do I trigger a Google Drive folder sync?')}
          >
            <HardDrive size={14} /> Drive sync instructions
          </button>
          <button
            type="button"
            className="chip-btn"
            onClick={() => handleChipClick('Explain current user roles and permissions in UNIFY-AI')}
          >
            <Users size={14} /> System permissions guide
          </button>
        </div>
      </section>

      {/* ── Executive: Pending Approvals & AI Usage Stats ── */}
      <div className="dashboard-executive-grid">
        <section className="section-card" aria-label="Pending Approvals">
          <div className="section-card-header">
            <div className="section-card-title">
              <Clock size={20} className="text-amber-400" />
              <h3>Pending Approvals</h3>
            </div>
            <Badge variant="yellow">{pendingApprovals.length} Open</Badge>
          </div>

          <div className="approvals-list">
            {pendingApprovals.map((apr) => (
              <div key={apr.id} className="approval-item">
                <div className="approval-meta">
                  <div className="approval-title">{apr.title}</div>
                  <div className="text-xs text-slate-400">
                    {apr.requester} · {apr.submittedAt}
                  </div>
                </div>
                <div className="approval-actions">
                  <Button variant="primary" size="sm">Approve</Button>
                  <Button variant="ghost" size="sm">Review</Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section-card" aria-label="AI Usage Statistics">
          <div className="section-card-header">
            <div className="section-card-title">
              <BarChart3 size={20} className="text-green-400" />
              <h3>AI Usage Statistics</h3>
            </div>
            <Badge variant="green">This Month</Badge>
          </div>

          <div className="usage-stats-grid">
            {usageStats.map((stat, idx) => (
              <div key={idx} className="usage-stat-card">
                <div className="usage-stat-icon">{stat.icon}</div>
                <div className="usage-stat-content">
                  <div className="usage-stat-value">{stat.value}</div>
                  <div className="usage-stat-label">{stat.label}</div>
                  <div className={`usage-stat-change ${stat.trend === 'up' ? 'positive' : 'neutral'}`}>
                    {stat.trend === 'up' && <ArrowUpRight size={12} />}
                    {stat.change}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── 2-Column Section: Recent Activity & Integration Overview ── */}
      <div className="dashboard-grid-main">
        {/* Left Column: Recent Activity Log */}
        <section className="section-card" aria-label="Recent System Activity">
          <div className="section-card-header">
            <div className="section-card-title">
              <Activity size={20} className="text-muted" />
              <h3>System Activity & Index Audit</h3>
            </div>
            <Badge variant="slate">Live Feed</Badge>
          </div>

          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon bg-secondary text-muted">
                <CheckCircle2 size={18} />
              </div>
              <div className="activity-details">
                <div className="activity-title">Google Drive Ingestion Sync</div>
                <div className="activity-desc">
                  Successfully chunked & indexed 42 PDF files into vector embeddings.
                </div>
              </div>
              <span className="activity-time">10m ago</span>
            </div>

            <div className="activity-item">
              <div className="activity-icon bg-secondary text-muted">
                <MessageSquare size={18} />
              </div>
              <div className="activity-details">
                <div className="activity-title">RAG Chat Query Executed</div>
                <div className="activity-desc">
                  Answer generated with 3 cited source chunks from internal knowledge base.
                </div>
              </div>
              <span className="activity-time">25m ago</span>
            </div>

            <div className="activity-item">
              <div className="activity-icon bg-secondary text-muted">
                <ShieldCheck size={18} />
              </div>
              <div className="activity-details">
                <div className="activity-title">JWT Session Verified</div>
                <div className="activity-desc">
                  Authenticated user session revalidated with secure token refresh.
                </div>
              </div>
              <span className="activity-time">1h ago</span>
            </div>

            <div className="activity-item">
              <div className="activity-icon bg-secondary text-muted">
                <RefreshCw size={18} />
              </div>
              <div className="activity-details">
                <div className="activity-title">Embeddings Cache Warming</div>
                <div className="activity-desc">
                  Pre-computed pgvector index for fast semantic lookup responses.
                </div>
              </div>
              <span className="activity-time">3h ago</span>
            </div>
          </div>
        </section>

        {/* Right Column: Quick Navigation & Connected Apps */}
        <section className="section-card" aria-label="Connected Services & Shortcuts">
          <div className="section-card-header">
            <div className="section-card-title">
              <Plug size={20} className="text-muted" />
              <h3>Integrations</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(ROUTES.INTEGRATIONS)}
            >
              Manage
            </Button>
          </div>

          <div className="integrations-list">
            <div className="integration-item">
              <div className="integration-meta">
                <HardDrive size={18} className="text-muted" />
                <span className="integration-name">Google Drive</span>
              </div>
              <Badge variant="green" className="integration-status-badge">
                Connected
              </Badge>
            </div>

            <div className="integration-item">
              <div className="integration-meta">
                <MessageSquare size={18} className="text-muted" />
                <span className="integration-name">Slack Workspace</span>
              </div>
              <Badge variant="slate" className="integration-status-badge">
                Ready
              </Badge>
            </div>

            <div className="integration-item">
              <div className="integration-meta">
                <FileText size={18} className="text-muted" />
                <span className="integration-name">Jira / Confluence</span>
              </div>
              <Badge variant="slate" className="integration-status-badge">
                Ready
              </Badge>
            </div>
          </div>

          <div className="section-card-header" style={{ marginTop: '0.5rem', paddingTop: '1rem' }}>
            <div className="section-card-title">
              <ArrowRight size={20} className="text-muted" />
              <h3>Quick Shortcuts</h3>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="quick-link-card" onClick={() => navigate(ROUTES.CHAT)}>
              <div className="quick-link-icon">
                <MessageSquare size={20} />
              </div>
              <div className="quick-link-info">
                <div className="quick-link-title">AI Assistant Chat</div>
                <div className="quick-link-sub">Interactive RAG conversation</div>
              </div>
              <ArrowRight size={16} className="text-muted" />
            </div>

            <div className="quick-link-card" onClick={() => navigate(ROUTES.SEARCH)}>
              <div className="quick-link-icon">
                <Search size={20} />
              </div>
              <div className="quick-link-info">
                <div className="quick-link-title">Semantic Document Search</div>
                <div className="quick-link-sub">Vector index query tool</div>
              </div>
              <ArrowRight size={16} className="text-muted" />
            </div>

            {user?.role === 'admin' && (
              <div className="quick-link-card" onClick={() => navigate(ROUTES.ADMIN)}>
                <div className="quick-link-icon">
                  <ShieldCheck size={20} />
                </div>
                <div className="quick-link-info">
                  <div className="quick-link-title">Admin Management</div>
                  <div className="quick-link-sub">User privileges & system audit</div>
                </div>
                <ArrowRight size={16} className="text-muted" />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
