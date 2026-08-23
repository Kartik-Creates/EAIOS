import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Plug,
  FileText,
  Clock,
  GitPullRequest,
  Calendar,
  FolderOpen,
  RefreshCw,
  AlertTriangle,
  Mail,
  CheckSquare,
  ExternalLink,
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import { useAuth } from '@/hooks/useAuth';
import { integrationsService } from '@/services/integrationsService';
import {
  dashboardService,
  type BriefingResponse,
  type BriefingItem,
  type BriefingItemDetail,
  type ActivityItem,
} from '@/services/dashboardService';
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

const decodeEntities = (text: string): string => {
  if (!text) return '';
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
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

const getSourceIcon = (source: string) => {
  switch (source.toLowerCase()) {
    case 'gmail':
      return <Mail size={16} className="text-red-400" />;
    case 'jira':
      return <CheckSquare size={16} className="text-blue-400" />;
    case 'github':
      return <GitPullRequest size={16} className="text-purple-400" />;
    case 'calendar':
      return <Calendar size={16} className="text-emerald-400" />;
    case 'slack':
      return <MessageSquare size={16} className="text-amber-400" />;
    case 'drive':
      return <FolderOpen size={16} className="text-sky-400" />;
    default:
      return <FileText size={16} className="text-slate-400" />;
  }
};

const getActivityIconComponent = (type: string) => {
  switch (type.toLowerCase()) {
    case 'github':
      return GitPullRequest;
    case 'slack':
    case 'chat':
      return MessageSquare;
    case 'drive':
      return FolderOpen;
    case 'jira':
      return FileText;
    case 'meeting':
      return Calendar;
    case 'workflow':
    default:
      return FileText;
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

  // Detail Modal state
  const [selectedItem, setSelectedItem] = useState<BriefingItem | null>(null);
  const [itemDetail, setItemDetail] = useState<BriefingItemDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Disconnect Modal state
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

  useEffect(() => {
    fetchConnections();
    fetchBriefingData();
    fetchActivityData();
  }, [fetchConnections, fetchBriefingData, fetchActivityData]);

  // Handle item click for detail modal
  const handleItemClick = async (item: BriefingItem) => {
    setSelectedItem(item);
    setItemDetail(null);

    if (item.id && item.source) {
      try {
        setIsLoadingDetail(true);
        const detail = await dashboardService.fetchItemDetail(item.source, item.id);
        setItemDetail(detail);
      } catch {
        toast.error('Failed to load item details.');
      } finally {
        setIsLoadingDetail(false);
      }
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
  const hasNoIntegrations = !isLoadingConnections && connections.length === 0;

  // Stat Card Derived Counts
  const openTicketsCount =
    briefing?.sources?.find((s) => s.source === 'jira')?.item_count ??
    briefing?.items?.filter((i) => i.source === 'jira').length ??
    0;

  const unreadMessagesCount =
    (briefing?.sources?.find((s) => s.source === 'gmail')?.item_count ?? 0) +
      (briefing?.sources?.find((s) => s.source === 'slack')?.item_count ?? 0) ||
    (briefing?.items?.filter((i) => i.source === 'gmail' || i.source === 'slack').length ?? 0);

  const pendingReviewsCount =
    briefing?.sources?.find((s) => s.source === 'github')?.item_count ??
    briefing?.items?.filter((i) => i.source === 'github').length ??
    0;

  // Identify sources that are connected but experienced errors
  const erroredSources = briefing?.sources?.filter(s => s.connected && s.error) ?? [];

  return (
    <motion.div className="dashboard-page flex-fit-screen" variants={fadeInUpVariants} initial="hidden" animate="visible">
      {/* ── Header: Greeting + Date ── */}
      <motion.header className="dashboard-header-compact" variants={staggerItem}>
        <div className="header-top">
          <div>
            <h1 className="dashboard-greeting">{getGreeting()}, {userName}</h1>
            <p className="dashboard-date">{getCurrentDate()}</p>
          </div>
        </div>
      </motion.header>

      {/* ── Today's Priorities ── */}
      <motion.section className="priorities-card-compact" variants={staggerItem}>
        <div className="priorities-header">
          <div className="flex items-center gap-2">
            <h2>Today's Priorities</h2>
            {erroredSources.length > 0 && (
              <Badge variant="yellow" className="text-xs flex items-center gap-1">
                <AlertTriangle size={12} />
                {erroredSources.length} integration(s) degraded
              </Badge>
            )}
          </div>
          <button
            type="button"
            className="priorities-link text-xs"
            onClick={() => navigate(ROUTES.CHAT)}
          >
            View Full Briefing →
          </button>
        </div>

        {isLoadingBriefing ? (
          <div className="dashboard-skeleton-container" style={{ padding: '0.5rem 0' }}>
            <div className="dashboard-skeleton-line" style={{ width: '70%', height: '16px' }} />
            <div className="dashboard-skeleton-line" style={{ width: '85%', height: '16px', marginTop: '8px' }} />
          </div>
        ) : briefingError ? (
          <div className="dashboard-state-box py-2">
            <AlertTriangle size={20} className="text-amber-400 mb-1" />
            <p className="text-xs">Failed to load priorities payload.</p>
            <Button variant="ghost" size="sm" onClick={fetchBriefingData} className="mt-1 text-xs">
              <RefreshCw size={12} className="mr-1" /> Retry
            </Button>
          </div>
        ) : hasNoIntegrations ? (
          <div className="dashboard-state-box py-3">
            <Plug size={24} className="text-muted mb-1" />
            <p className="font-medium text-slate-200 text-xs">Connect an app to see your priorities here</p>
            <Button variant="primary" size="sm" onClick={() => navigate(ROUTES.INTEGRATIONS)} className="mt-2 text-xs">
              Connect Integrations
            </Button>
          </div>
        ) : briefing?.items?.length === 0 ? (
          <div className="dashboard-state-box py-3">
            <p className="text-xs text-slate-400">All clear! No urgent priority items right now.</p>
            {erroredSources.length > 0 && (
              <p className="text-xs text-amber-400/90 mt-1">
                Note: {erroredSources.map(s => s.source.toUpperCase()).join(', ')} failed to sync.
              </p>
            )}
          </div>
        ) : (
          <div className="priorities-container">
            {erroredSources.length > 0 && (
              <div className="degraded-source-warning">
                <AlertTriangle size={13} className="shrink-0" />
                <span>
                  <strong>Temporary Sync Issue:</strong> {erroredSources.map(s => s.source.toUpperCase()).join(', ')} API returned errors. Other sources loaded normally.
                </span>
              </div>
            )}
            <ul className="priorities-list-compact">
              {briefing?.items?.slice(0, 4).map((item, idx) => (
                <li
                  key={item.id || idx}
                  className="priority-item-redesigned"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="priority-source-icon">
                    {getSourceIcon(item.source)}
                  </div>
                  <div className="priority-content flex-1 min-w-0">
                    <div className="priority-title-line font-medium text-slate-100 text-xs truncate">
                      {decodeEntities(item.title)}
                    </div>
                    <div className="priority-meta-line text-slate-400 text-2xs truncate">
                      {item.sender_or_author && <span className="font-medium text-slate-300 mr-2">{item.sender_or_author}</span>}
                      {decodeEntities(item.detail)}
                    </div>
                  </div>
                  <Badge
                    variant={item.priority_hint === 'overdue' ? 'red' : 'blue'}
                    className="text-3xs uppercase shrink-0 px-1.5 py-0.5"
                  >
                    {item.priority_hint}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.section>

      {/* ── 3 Stat Cards Row ── */}
      <motion.div className="stats-grid-compact" variants={staggerContainer}>
        <motion.div variants={staggerItem}>
          <MotionCard className="stat-card-compact">
            <div className="stat-icon-wrapper text-blue-400">
              <FileText size={18} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{isLoadingBriefing ? '…' : openTicketsCount}</span>
              <span className="stat-label">Open Tickets</span>
            </div>
          </MotionCard>
        </motion.div>
        <motion.div variants={staggerItem}>
          <MotionCard className="stat-card-compact">
            <div className="stat-icon-wrapper text-amber-400">
              <MessageSquare size={18} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{isLoadingBriefing ? '…' : unreadMessagesCount}</span>
              <span className="stat-label">Unread Messages</span>
            </div>
          </MotionCard>
        </motion.div>
        <motion.div variants={staggerItem}>
          <MotionCard className="stat-card-compact">
            <div className="stat-icon-wrapper text-purple-400">
              <GitPullRequest size={18} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{isLoadingBriefing ? '…' : pendingReviewsCount}</span>
              <span className="stat-label">Pending Reviews</span>
            </div>
          </MotionCard>
        </motion.div>
      </motion.div>

      {/* ── 2-Column Main Section: Recent Activity & Integration Overview ── */}
      <motion.div className="dashboard-grid-main-compact" variants={staggerContainer}>
        {/* Left Column: Recent Activity Log */}
        <motion.section className="section-card-compact" aria-label="Recent System Activity" variants={staggerItem}>
          <div className="section-card-header">
            <div className="section-card-title">
              <Clock size={16} className="text-muted" />
              <h3>Recent Activity</h3>
            </div>
            <Badge variant="slate" className="text-3xs">Activity Feed</Badge>
          </div>

          {isLoadingActivity ? (
            <div className="dashboard-skeleton-container" style={{ padding: '0.5rem 0' }}>
              <div className="dashboard-skeleton-line" style={{ width: '90%', height: '20px' }} />
              <div className="dashboard-skeleton-line" style={{ width: '80%', height: '20px', marginTop: '8px' }} />
            </div>
          ) : activity.length === 0 ? (
            <div className="dashboard-state-box py-3">
              <p className="text-xs text-slate-400">No recent activity records for your account.</p>
            </div>
          ) : (
            <div className="activity-list-compact">
              {activity.slice(0, 4).map((item) => {
                const IconComp = getActivityIconComponent(item.type);
                return (
                  <div key={item.id} className="activity-item-compact">
                    <div className="activity-icon-compact">
                      <IconComp size={14} />
                    </div>
                    <div className="activity-details flex-1 min-w-0">
                      <div className="activity-title text-xs text-slate-200 truncate">{item.title}</div>
                      <div className="activity-desc text-2xs text-slate-400 truncate">{item.description}</div>
                    </div>
                    <span className="activity-time text-3xs text-slate-500 shrink-0">{formatRelativeTime(item.timestamp)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.section>

        {/* Right Column: Connected Services */}
        <motion.section className="section-card-compact" aria-label="Connected Services" variants={staggerItem}>
          <div className="section-card-header">
            <div className="section-card-title">
              <Plug size={16} className="text-muted" />
              <h3>Integrations</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs px-2 py-1"
              onClick={() => navigate(ROUTES.INTEGRATIONS)}
            >
              Manage
            </Button>
          </div>

          <div className="integrations-list-compact">
            {isLoadingConnections ? (
              <div className="integration-loading text-xs py-2">Loading integrations...</div>
            ) : connections.length === 0 ? (
              <div className="integration-empty text-xs py-2 text-slate-400">No integrations connected yet.</div>
            ) : (
              connections.map((conn) => {
                const sourceError = briefing?.sources?.find(s => s.source.toLowerCase() === conn.provider.toLowerCase())?.error;
                return (
                  <div key={conn.provider} className="integration-item-compact">
                    <div className="integration-meta flex items-center gap-2 min-w-0">
                      {getSourceIcon(conn.provider)}
                      <span className="integration-name text-xs font-medium text-slate-200 truncate">
                        {conn.provider.charAt(0).toUpperCase() + conn.provider.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {sourceError ? (
                        <Badge variant="yellow" className="text-3xs flex items-center gap-1" title={sourceError}>
                          <AlertTriangle size={10} /> Error
                        </Badge>
                      ) : (
                        <Badge variant="green" className="text-3xs">
                          Connected
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="disconnect-btn text-3xs text-red-400 hover:text-red-300 p-1"
                        onClick={() => setSelectedDisconnectProvider(conn.provider)}
                      >
                        Disconnect
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.section>
      </motion.div>

      {/* ── Briefing Item Detail Modal (In-App Click-to-Open) ── */}
      <Modal
        isOpen={Boolean(selectedItem)}
        onClose={() => {
          setSelectedItem(null);
          setItemDetail(null);
        }}
        title={selectedItem ? decodeEntities(selectedItem.title) : 'Item Detail'}
      >
        <div className="briefing-detail-modal-body">
          {isLoadingDetail ? (
            <div className="py-6 flex flex-col items-center justify-center gap-2">
              <RefreshCw size={24} className="animate-spin text-accent" />
              <p className="text-xs text-slate-400">Fetching item content...</p>
            </div>
          ) : itemDetail ? (
            <div className="space-y-4 text-xs text-slate-300">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  {getSourceIcon(itemDetail.source)}
                  <span className="font-semibold uppercase text-slate-200">{itemDetail.source}</span>
                  {itemDetail.status && (
                    <Badge variant="blue" className="text-3xs uppercase">{itemDetail.status}</Badge>
                  )}
                </div>
                {itemDetail.created_or_due_date && (
                  <span className="text-slate-400 text-2xs">{itemDetail.created_or_due_date}</span>
                )}
              </div>

              {itemDetail.sender_or_author && (
                <div className="text-slate-400">
                  <span className="text-slate-300 font-medium">Author / Assignee:</span> {itemDetail.sender_or_author}
                </div>
              )}

              <div className="bg-slate-900/80 p-3 rounded border border-slate-800 font-mono text-slate-200 whitespace-pre-wrap max-h-60 overflow-y-auto">
                {itemDetail.body || itemDetail.detail}
              </div>

              {itemDetail.url && (
                <div className="pt-2 flex justify-end">
                  <a
                    href={itemDetail.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-accent hover:underline text-xs"
                  >
                    Open in {itemDetail.source} <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          ) : selectedItem ? (
            <div className="space-y-3 text-xs">
              <p className="text-slate-300">{decodeEntities(selectedItem.detail)}</p>
              {selectedItem.url && (
                <a
                  href={selectedItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-accent hover:underline"
                >
                  Open External Link <ExternalLink size={12} />
                </a>
              )}
            </div>
          ) : null}
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
