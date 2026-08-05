import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Search,
  Plug,
  ShieldCheck,
  Activity,
  ArrowRight,
  FileText,
  CheckCircle2,
  Clock,
  TrendingUp,
  BarChart3,
  ArrowUpRight,
  GitBranch,
  MessageCircle,
  SearchCheck,
  RefreshCw,
  GitPullRequest,
  Calendar,
  FolderOpen,
  Workflow,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { integrationsService } from '@/services/integrationsService';
import type { OAuthConnection } from '@/types/integration.types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
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

export const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [connections, setConnections] = useState<OAuthConnection[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {

      try {
        const list = await integrationsService.listConnections();
        if (isMounted) setConnections(list);
      } catch (err) {
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

  const userName = user?.full_name || user?.email || 'Enterprise User';

  const pendingApprovals = [
    { id: 'apr-1', title: 'PTO Request — Alice Johnson', requester: 'alice@eaios.enterprise', type: 'leave', submittedAt: '2h ago' },
    { id: 'apr-2', title: 'HR-Only Document Access — Bob Smith', requester: 'bob@eaios.enterprise', type: 'access', submittedAt: '4h ago' },
    { id: 'apr-3', title: 'Workflow: Bulk Drive Sync Approval', requester: 'system', type: 'workflow', submittedAt: '6h ago' },
  ];

  const usageStats = [
    { label: 'AI Chat Queries', value: '1,284', change: '+12%', trend: 'up' as const, icon: <MessageCircle size={18} className="text-muted" /> },
    { label: 'Semantic Searches', value: '862', change: '+8%', trend: 'up' as const, icon: <SearchCheck size={18} className="text-muted" /> },
    { label: 'Workflow Triggers', value: '142', change: '+24%', trend: 'up' as const, icon: <GitBranch size={18} className="text-muted" /> },
    { label: 'Avg Response Time', value: '1.8s', change: '-0.3s', trend: 'up' as const, icon: <TrendingUp size={18} className="text-muted" /> },
  ];

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
          <button type="button" className="priorities-link">View Full Briefing →</button>
        </div>
        <ul className="priorities-list">
          <li className="priorities-item">
            <span className="priorities-dot" />
            <span>2 Jira tickets due today</span>
          </li>
          <li className="priorities-item">
            <span className="priorities-dot" />
            <span>Slack messages requiring attention</span>
          </li>
          <li className="priorities-item">
            <span className="priorities-dot" />
            <span>GitHub PR waiting for review</span>
          </li>
          <li className="priorities-item">
            <span className="priorities-dot" />
            <span>Meeting at 2:30 PM</span>
          </li>
          <li className="priorities-item">
            <span className="priorities-dot" />
            <span>One workflow pending approval</span>
          </li>
        </ul>
      </motion.section>

      {/* ── Stats ── */}
      <motion.div className="stats-grid" variants={staggerContainer}>
        <motion.div variants={staggerItem}>
          <MotionCard className="stat-card">
            <div className="stat-icon-wrapper">
              <FileText size={22} />
            </div>
            <div className="stat-content">
              <span className="stat-value">4</span>
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
              <span className="stat-value">12</span>
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
              <span className="stat-value">3</span>
              <span className="stat-label">Pending Reviews</span>
            </div>
          </MotionCard>
        </motion.div>
      </motion.div>

      {/* ── Recent Activity ── */}
      <motion.section className="activity-card" variants={staggerItem}>
        <h2 className="activity-card-title">Recent Activity</h2>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon"><GitPullRequest size={18} /></div>
            <div className="activity-details">
              <div className="activity-title">New Pull Request assigned to you</div>
              <div className="activity-desc">feature/dashboard-redesign</div>
            </div>
            <span className="activity-time">12 min ago</span>
          </div>
          <div className="activity-item">
            <div className="activity-icon"><MessageSquare size={18} /></div>
            <div className="activity-details">
              <div className="activity-title">Mentioned in #engineering</div>
              <div className="activity-desc">@you please review the API changes</div>
            </div>
            <span className="activity-time">35 min ago</span>
          </div>
          <div className="activity-item">
            <div className="activity-icon"><FolderOpen size={18} /></div>
            <div className="activity-details">
              <div className="activity-title">Requirements document updated</div>
              <div className="activity-desc">Google Drive / Product Specs</div>
            </div>
            <span className="activity-time">1 hr ago</span>
          </div>
          <div className="activity-item">
            <div className="activity-icon"><FileText size={18} /></div>
            <div className="activity-details">
              <div className="activity-title">Ticket UNI-241 moved to Review</div>
              <div className="activity-desc">Jira / Sprint Backlog</div>
            </div>
            <span className="activity-time">2 hr ago</span>
          </div>
          <div className="activity-item">
            <div className="activity-icon"><Calendar size={18} /></div>
            <div className="activity-details">
              <div className="activity-title">Sprint Planning starts in 30 minutes</div>
              <div className="activity-desc">Meeting / Team Calendar</div>
            </div>
            <span className="activity-time">Upcoming</span>
          </div>
          <div className="activity-item">
            <div className="activity-icon"><Workflow size={18} /></div>
            <div className="activity-details">
              <div className="activity-title">Invoice Approval completed</div>
              <div className="activity-desc">Workflow / Finance</div>
            </div>
            <span className="activity-time">3 hr ago</span>
          </div>
        </div>
      </motion.section>

      {/* ── Executive: Pending Approvals & AI Usage Stats ── */}
      <motion.div className="dashboard-executive-grid" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-20px' }}>
        <motion.section className="section-card" aria-label="Pending Approvals" variants={staggerItem}>
          <div className="section-card-header">
            <div className="section-card-title">
              <Clock size={20} className="text-amber-400" />
              <h3>Pending Approvals</h3>
            </div>
            <Badge variant="yellow">{pendingApprovals.length} Open</Badge>
          </div>

          <motion.div className="approvals-list" variants={staggerContainer}>
            {pendingApprovals.map((apr) => (
              <motion.div key={apr.id} className="approval-item" variants={staggerItem}>
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
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        <motion.section className="section-card" aria-label="AI Usage Statistics" variants={staggerItem}>
          <div className="section-card-header">
            <div className="section-card-title">
              <BarChart3 size={20} className="text-green-400" />
              <h3>AI Usage Statistics</h3>
            </div>
            <Badge variant="green">This Month</Badge>
          </div>

          <motion.div className="usage-stats-grid" variants={staggerContainer}>
            {usageStats.map((stat, idx) => (
              <motion.div key={idx} className="usage-stat-card" variants={staggerItem}>
                <div className="usage-stat-icon">{stat.icon}</div>
                <div className="usage-stat-content">
                  <div className="usage-stat-value">{stat.value}</div>
                  <div className="usage-stat-label">{stat.label}</div>
                  <div className={`usage-stat-change ${stat.trend === 'up' ? 'positive' : 'neutral'}`}>
                    {stat.trend === 'up' && <ArrowUpRight size={12} />}
                    {stat.change}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      </motion.div>

      {/* ── 2-Column Section: Recent Activity & Integration Overview ── */}
      <motion.div className="dashboard-grid-main" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-20px' }}>
        {/* Left Column: Recent Activity Log */}
        <motion.section className="section-card" aria-label="Recent System Activity" variants={staggerItem}>
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
              connections.slice(0, 3).map((conn) => (
                <div key={conn.provider} className="integration-item">
                  <div className="integration-meta">
                    <Plug size={18} className="text-muted" />
                    <span className="integration-name">{conn.provider.charAt(0).toUpperCase() + conn.provider.slice(1)}</span>
                  </div>
                  <Badge variant="green" className="integration-status-badge">
                    Connected
                  </Badge>
                </div>
              ))
            )}
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
        </motion.section>
      </motion.div>
    </motion.div>
  );
};

export default DashboardPage;
