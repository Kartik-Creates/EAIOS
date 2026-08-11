import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Search,
  Plug,
  ShieldCheck,
  ArrowRight,
  FileText,
  Clock,
  GitPullRequest,
  Calendar,
  FolderOpen,
  Workflow,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import { useAuth } from '@/hooks/useAuth';
import { integrationsService } from '@/services/integrationsService';
import { dashboardService, type BriefingResponse, type ActivityItem, type PendingApprovalItem } from '@/services/dashboardService';
import type { OAuthConnection } from '@/types/integration.types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { MotionCard } from '@/lib/motion';
import { ROUTES } from '@/constants/routes';
import { staggerContainer, staggerItem, fadeInUpVariants } from '@/lib/motion';
import './DashboardPage.css';

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

const getCurrentDate = (): string => {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
};

const formatRelativeTime = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return 'Just now';
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return isoString;
  }
};

const getActivityIconComponent = (type: string) => {
  switch (type.toLowerCase()) {
    case 'github':
      return GitPullRequest;
    case 'slack':
      return MessageSquare;
    case 'drive':
      return FolderOpen;
    case 'jira':
      return FileText;
    case 'meeting':
      return Calendar;
    case 'workflow':
    default:
      return Workflow;
  }
};

export const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Integrations state
  const [connections, setConnections] = useState<OAuthConnection[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);

  // Briefing state
  const [briefing, setBriefing] = useState<BriefingResponse | null>(null);
  const [isLoadingBriefing, setIsLoadingBriefing] = useState(true);
  const [briefingError, setBriefingError] = useState(false);

  // Activity state
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);

  // Pending Approvals state
  const [pendingApprovals, setPendingApprovals] = useState<PendingApprovalItem[]>([]);
  const [isLoadingApprovals, setIsLoadingApprovals] = useState(true);

  // Modals state
  const [selectedApproval, setSelectedApproval] = useState<PendingApprovalItem | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  const [selectedDisconnectProvider, setSelectedDisconnectProvider] = useState<string | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Fetch connections
  const fetchConnections = useCallback(async () => {
    try {
      setIsLoadingConnections(true);
      const list = await integrationsService.listConnections();
      setConnections(list);
    } catch {
      setConnections([]);
    } finally {
      setIsLoadingConnections(false);
    }
  }, []);

  // Fetch Briefing (Priorities & Stats source)
  const fetchBriefingData = useCallback(async () => {
    try {
      setIsLoadingBriefing(true);
      setBriefingError(false);
      const res = await dashboardService.fetchBriefing();
      setBriefing(res);
    } catch {
      setBriefingError(true);
    } finally {
      setIsLoadingBriefing(false);
    }
  }, []);

  // Fetch Recent Activity
  const fetchActivityData = useCallback(async () => {
    try {
      setIsLoadingActivity(true);
      const data = await dashboardService.fetchActivity();
      setActivity(data);
    } catch {
      setActivity([]);
    } finally {
      setIsLoadingActivity(false);
    }
  }, []);

  // Fetch Pending Approvals (Manager/Admin only)
  const fetchApprovalsData = useCallback(async () => {
    if (user?.role !== 'manager' && user?.role !== 'admin') {
      setIsLoadingApprovals(false);
      return;
    }
    try {
      setIsLoadingApprovals(true);
      const data = await dashboardService.fetchPendingApprovals();
      setPendingApprovals(data);
    } catch {
      setPendingApprovals([]);
    } finally {
      setIsLoadingApprovals(false);
    }
  }, [user?.role]);

  useEffect(() => {
    fetchConnections();
    fetchBriefingData();
    fetchActivityData();
    fetchApprovalsData();
  }, [fetchConnections, fetchBriefingData, fetchActivityData, fetchApprovalsData]);

  // Handle Approve action
  const handleConfirmApprove = async () => {
    if (!selectedApproval) return;
    try {
      setIsApproving(true);
      await dashboardService.approveRequest(selectedApproval.id);
      toast.success('Approval executed successfully');
      setSelectedApproval(null);
      fetchApprovalsData();
    } catch {
      toast.error('Failed to execute approval');
    } finally {
      setIsApproving(false);
    }
  };

  // Handle Disconnect action
  const handleConfirmDisconnect = async () => {
    if (!selectedDisconnectProvider) return;
    try {
      setIsDisconnecting(true);
      await integrationsService.disconnectConnection(selectedDisconnectProvider);
      toast.success(`Disconnected ${selectedDisconnectProvider}`);
      setSelectedDisconnectProvider(null);
      fetchConnections();
      fetchBriefingData();
    } catch {
      toast.error(`Failed to disconnect ${selectedDisconnectProvider}`);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const userName = user?.full_name || user?.email || 'Enterprise User';
  const isManagerOrAdmin = user?.role === 'manager' || user?.role === 'admin';
  const hasNoIntegrations = !isLoadingConnections && connections.length === 0;

  // Derive stat cards from Briefing response items
  const openTicketsCount = briefing?.items?.filter(i => i.source === 'jira').length ?? 0;
  const unreadMessagesCount = briefing?.items?.filter(i => i.source === 'gmail' || i.source === 'slack').length ?? 0;
  const pendingReviewsCount = briefing?.items?.filter(i => i.source === 'github').length ?? 0;

  return (
    <motion.div className="dashboard-page" variants={fadeInUpVariants} initial="hidden" animate="visible">
      {/* ── Header: Greeting + Date ── */}
      <motion.header className="dashboard-header" variants={staggerItem}>
        <div className="header-top">
          <div>
            <h1 className="dashboard-greeting">{getGreeting()}, {userName}</h1>
            <p className="dashboard-date">{getCurrentDate()}</p>
          </div>
        </div>
      </motion.header>

      {/* ── Today's Priorities ── */}
      <motion.section className="priorities-card" variants={staggerItem}>
        <div className="priorities-header">
          <h2>Today's Priorities</h2>
          <button
            type="button"
            className="priorities-link"
            onClick={() => navigate(ROUTES.CHAT)}
          >
            View Full Briefing →
          </button>
        </div>

        {isLoadingBriefing ? (
          <div className="dashboard-skeleton-container" style={{ padding: '1rem 0' }}>
            <div className="dashboard-skeleton-line" style={{ width: '70%', height: '18px' }} />
            <div className="dashboard-skeleton-line" style={{ width: '85%', height: '18px', marginTop: '12px' }} />
            <div className="dashboard-skeleton-line" style={{ width: '55%', height: '18px', marginTop: '12px' }} />
          </div>
        ) : briefingError ? (
          <div className="dashboard-state-box">
            <AlertTriangle size={24} className="text-amber-400 mb-2" />
            <p>Failed to load priorities payload.</p>
            <Button variant="ghost" size="sm" onClick={fetchBriefingData} className="mt-2">
              <RefreshCw size={14} className="mr-2" /> Retry
            </Button>
          </div>
        ) : hasNoIntegrations ? (
          <div className="dashboard-state-box">
            <Plug size={28} className="text-muted mb-2" />
            <p className="font-medium text-slate-200">Connect an app to see your priorities here</p>
            <p className="text-xs text-slate-400 mb-3">Sync Jira, Gmail, Calendar, or GitHub to generate personalized priority updates.</p>
            <Button variant="primary" size="sm" onClick={() => navigate(ROUTES.INTEGRATIONS)}>
              Connect Integrations
            </Button>
          </div>
        ) : briefing?.items?.length === 0 ? (
          <div className="dashboard-state-box">
            <p className="text-sm text-slate-400">All clear! No urgent priority items right now.</p>
          </div>
        ) : (
          <ul className="priorities-list">
            {briefing?.items?.slice(0, 5).map((item, idx) => (
              <li key={idx} className="priorities-item">
                <span className="priorities-dot" />
                <span><strong>[{item.source.toUpperCase()}]</strong> {item.title} — {item.detail}</span>
              </li>
            ))}
          </ul>
        )}
      </motion.section>

      {/* ── 3 Stat Cards ── */}
      <motion.div className="stats-grid" variants={staggerContainer}>
        <motion.div variants={staggerItem}>
          <MotionCard className="stat-card">
            <div className="stat-icon-wrapper">
              <FileText size={22} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{isLoadingBriefing ? '…' : openTicketsCount}</span>
              <span className="stat-label">Open Tickets</span>
            </div>
          </MotionCard>
        </motion.div>
        <motion.div variants={staggerItem}>
          <MotionCard className="stat-card">
            <div className="stat-icon-wrapper">
              <MessageSquare size={22} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{isLoadingBriefing ? '…' : unreadMessagesCount}</span>
              <span className="stat-label">Unread Messages</span>
            </div>
          </MotionCard>
        </motion.div>
        <motion.div variants={staggerItem}>
          <MotionCard className="stat-card">
            <div className="stat-icon-wrapper">
              <GitPullRequest size={22} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{isLoadingBriefing ? '…' : pendingReviewsCount}</span>
              <span className="stat-label">Pending Reviews</span>
            </div>
          </MotionCard>
        </motion.div>
      </motion.div>

      {/* ── Pending Approvals (Manager/Admin Only) ── */}
      {isManagerOrAdmin && (
        <motion.div className="dashboard-executive-grid" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-20px' }}>
          <motion.section className="section-card" aria-label="Pending Approvals" variants={staggerItem}>
            <div className="section-card-header">
              <div className="section-card-title">
                <Clock size={20} className="text-amber-400" />
                <h3>Pending Approvals</h3>
              </div>
              <Badge variant="yellow">{pendingApprovals.length} Open</Badge>
            </div>

            {isLoadingApprovals ? (
              <div className="dashboard-skeleton-container" style={{ padding: '1rem 0' }}>
                <div className="dashboard-skeleton-line" style={{ width: '100%', height: '36px' }} />
                <div className="dashboard-skeleton-line" style={{ width: '100%', height: '36px', marginTop: '8px' }} />
              </div>
            ) : pendingApprovals.length === 0 ? (
              <div className="dashboard-state-box" style={{ padding: '1.5rem 0' }}>
                <p className="text-sm text-slate-400">No pending workflow approval requests requiring action.</p>
              </div>
            ) : (
              <motion.div className="approvals-list" variants={staggerContainer}>
                {pendingApprovals.map((apr) => (
                  <motion.div key={apr.id} className="approval-item" variants={staggerItem}>
                    <div className="approval-meta">
                      <div className="approval-title">{apr.title}</div>
                      <div className="text-xs text-slate-400">
                        Requested by {apr.requester} · {formatRelativeTime(apr.submittedAt)}
                      </div>
                    </div>
                    <div className="approval-actions">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setSelectedApproval(apr)}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(ROUTES.WORKFLOW)}
                      >
                        Review
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.section>
        </motion.div>
      )}

      {/* ── 2-Column Section: Recent Activity & Integration Overview ── */}
      <motion.div className="dashboard-grid-main" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-20px' }}>
        {/* Left Column: Recent Activity Log */}
        <motion.section className="section-card" aria-label="Recent System Activity" variants={staggerItem}>
          <div className="section-card-header">
            <div className="section-card-title">
              <Clock size={20} className="text-muted" />
              <h3>Recent Activity</h3>
            </div>
            <Badge variant="slate">User Feed</Badge>
          </div>

          {isLoadingActivity ? (
            <div className="dashboard-skeleton-container" style={{ padding: '1rem 0' }}>
              <div className="dashboard-skeleton-line" style={{ width: '90%', height: '24px' }} />
              <div className="dashboard-skeleton-line" style={{ width: '95%', height: '24px', marginTop: '12px' }} />
              <div className="dashboard-skeleton-line" style={{ width: '80%', height: '24px', marginTop: '12px' }} />
            </div>
          ) : activity.length === 0 ? (
            <div className="dashboard-state-box">
              <p className="text-sm text-slate-400">No recent activity records for your account.</p>
            </div>
          ) : (
            <div className="activity-list">
              {activity.map((item) => {
                const IconComp = getActivityIconComponent(item.type);
                return (
                  <div key={item.id} className="activity-item">
                    <div className="activity-icon bg-secondary text-muted">
                      <IconComp size={18} />
                    </div>
                    <div className="activity-details">
                      <div className="activity-title">{item.title}</div>
                      <div className="activity-desc">{item.description}</div>
                    </div>
                    <span className="activity-time">{formatRelativeTime(item.timestamp)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.section>

        {/* Right Column: Quick Navigation & Connected Apps */}
        <motion.section className="section-card" aria-label="Connected Services & Shortcuts" variants={staggerItem}>
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
            {isLoadingConnections ? (
              <div className="integration-loading">Loading integrations...</div>
            ) : connections.length === 0 ? (
              <div className="integration-empty">No integrations connected yet.</div>
            ) : (
              connections.map((conn) => (
                <div key={conn.provider} className="integration-item">
                  <div className="integration-meta">
                    <Plug size={18} className="text-muted" />
                    <span className="integration-name">
                      {conn.provider.charAt(0).toUpperCase() + conn.provider.slice(1)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Badge variant="green" className="integration-status-badge">
                      Connected
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="disconnect-btn text-xs text-red-400 hover:text-red-300"
                      onClick={() => setSelectedDisconnectProvider(conn.provider)}
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="section-card-header" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
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
        </motion.section>
      </motion.div>

      {/* ── Approval Confirmation Modal ── */}
      <Modal
        isOpen={Boolean(selectedApproval)}
        onClose={() => setSelectedApproval(null)}
        title="Confirm Workflow Approval"
      >
        <div style={{ padding: '0.5rem 0' }}>
          <p className="text-sm text-slate-300 mb-4">
            Are you sure you want to approve this pending request? This action will execute the workflow step.
          </p>
          {selectedApproval && (
            <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/60 mb-6">
              <div className="font-semibold text-slate-100">{selectedApproval.title}</div>
              <div className="text-xs text-slate-400 mt-1">Requested by: {selectedApproval.requester}</div>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedApproval(null)}
              disabled={isApproving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmApprove}
              isLoading={isApproving}
            >
              Confirm Approval
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Disconnect Confirmation Modal ── */}
      <Modal
        isOpen={Boolean(selectedDisconnectProvider)}
        onClose={() => setSelectedDisconnectProvider(null)}
        title="Confirm Disconnect"
      >
        <div style={{ padding: '0.5rem 0' }}>
          <p className="text-sm text-slate-300 mb-4">
            Disconnect <strong>{selectedDisconnectProvider ? selectedDisconnectProvider.charAt(0).toUpperCase() + selectedDisconnectProvider.slice(1) : ''}</strong>?
            You'll need to reconnect to use its features again.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDisconnectProvider(null)}
              disabled={isDisconnecting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleConfirmDisconnect}
              isLoading={isDisconnecting}
            >
              Disconnect App
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default DashboardPage;

