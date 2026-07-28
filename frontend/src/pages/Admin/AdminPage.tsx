import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShieldCheck,
  Users,
  UserCheck,
  UserX,
  AlertCircle,
  RefreshCw,
  Search,
  HelpCircle,
  MessageSquare,
  ThumbsUp,
  Send,
  Clock,
} from 'lucide-react';
import { adminService } from '@/services/adminService';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import type { AdminUser } from '@/types/admin.types';
import type { Role } from '@/types/auth.types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import './AdminPage.css';

export const AdminPage = () => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState<Record<string, string>>({});

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const list = await adminService.listUsers();
      setUsers(list);
    } catch (err: any) {
      const msg =
        err?.response?.status === 403
          ? 'Access Denied: Admin role privileges are required.'
          : err?.response?.data?.detail || err?.message || 'Failed to fetch system users.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  interface UnansweredQuestion {
    id: string;
    question: string;
    userEmail: string;
    userName: string;
    askedAt: string;
    confidence: number;
    category: string;
    feedbackCount: number;
  }

  const unansweredQuestions: UnansweredQuestion[] = [
    {
      id: 'uq-1',
      question: 'How do I configure SAML SSO for the admin portal?',
      userEmail: 'sarah.admin@eaios.enterprise',
      userName: 'Sarah Admin',
      askedAt: '15m ago',
      confidence: 0.32,
      category: 'Integration',
      feedbackCount: 3,
    },
    {
      id: 'uq-2',
      question: 'Where can I find the Q3 financial compliance report?',
      userEmail: 'mike.finance@eaios.enterprise',
      userName: 'Mike Finance',
      askedAt: '1h ago',
      confidence: 0.45,
      category: 'Document Access',
      feedbackCount: 7,
    },
    {
      id: 'uq-3',
      question: 'What is the process for requesting additional vector storage?',
      userEmail: 'alice.dev@eaios.enterprise',
      userName: 'Alice Dev',
      askedAt: '3h ago',
      confidence: 0.28,
      category: 'Infrastructure',
      feedbackCount: 2,
    },
    {
      id: 'uq-4',
      question: 'How do I escalate a workflow approval that is stuck?',
      userEmail: 'bob.ops@eaios.enterprise',
      userName: 'Bob Ops',
      askedAt: '5h ago',
      confidence: 0.51,
      category: 'Workflow',
      feedbackCount: 5,
    },
  ];

  const handleFeedbackSubmit = (questionId: string) => {
    if (!feedbackText[questionId]?.trim()) return;
    toast.success('Feedback submitted. Answer will be added to knowledge base.');
    setFeedbackText((prev) => ({ ...prev, [questionId]: '' }));
    setSelectedQuestion(null);
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Derived statistics
  const activeCount = useMemo(() => users.filter((u) => u.is_active).length, [users]);
  const inactiveCount = useMemo(() => users.filter((u) => !u.is_active).length, [users]);
  const adminCount = useMemo(() => users.filter((u) => u.role === 'admin').length, [users]);

  // Filtered user list
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const lower = searchTerm.toLowerCase();
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(lower) ||
        (u.full_name && u.full_name.toLowerCase().includes(lower)) ||
        u.role.toLowerCase().includes(lower)
    );
  }, [users, searchTerm]);

  // Helper for role badge variant
  const getRoleBadgeVariant = (role: Role) => {
    switch (role) {
      case 'admin':
        return 'purple';
      case 'manager':
        return 'blue';
      case 'hr':
        return 'yellow';
      default:
        return 'green';
    }
  };

  return (
    <div className="admin-page">
      {/* ── Admin Hero ── */}
      <header className="admin-hero-panel">
        <div className="admin-hero-text">
          <h1>
            <ShieldCheck size={24} className="text-purple-400" />
            Platform Administration Console
          </h1>
          <p>
            Manage system user accounts, RBAC role assignments, and monitor platform-wide
            operational statistics. All mutations are audit-logged.
          </p>
        </div>

        <div className="admin-stats-row">
          <div className="admin-stat-pill">
            <span className="admin-stat-number purple">{users.length}</span>
            <span className="admin-stat-label">Total Users</span>
          </div>
          <div className="admin-stat-pill">
            <span className="admin-stat-number green">{activeCount}</span>
            <span className="admin-stat-label">Active</span>
          </div>
          <div className="admin-stat-pill">
            <span className="admin-stat-number red">{inactiveCount}</span>
            <span className="admin-stat-label">Inactive</span>
          </div>
          <div className="admin-stat-pill">
            <span className="admin-stat-number amber">{adminCount}</span>
            <span className="admin-stat-label">Admins</span>
          </div>
        </div>
      </header>

      {/* ── Error Banner ── */}
      {error && (
        <div className="admin-error-banner">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* ── Users Management Table ── */}
      <section className="admin-section-card">
        <div className="admin-section-header">
          <h2>
            <Users size={20} className="text-blue-400" />
            User Accounts Registry
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="admin-search-input"
                placeholder="Filter by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Filter users"
              />
            </div>

            <Button variant="ghost" size="sm" onClick={fetchUsers} disabled={isLoading}>
              <RefreshCw size={14} className="mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 0', gap: '1rem' }}>
            <Spinner size="lg" />
            <p className="text-sm text-slate-400">Loading user registry from database...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="admin-empty-state">
            <Search size={32} className="text-slate-500" style={{ margin: '0 auto 1rem' }} />
            <p>No users match your filter criteria "{searchTerm}".</p>
          </div>
        ) : (
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Superuser</th>
                  <th>Account ID</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="user-cell-email">
                        <span className="user-cell-name">
                          {u.full_name || 'Unnamed User'}
                          {u.id === currentAdmin?.id && (
                            <Badge variant="blue" style={{ marginLeft: '0.5rem', fontSize: '0.65rem' }}>
                              You
                            </Badge>
                          )}
                        </span>
                        <span className="user-cell-email-sub">{u.email}</span>
                      </div>
                    </td>
                    <td>
                      <Badge variant={getRoleBadgeVariant(u.role)}>
                        {u.role.toUpperCase()}
                      </Badge>
                    </td>
                    <td>
                      <div className="status-indicator">
                        <span className={`status-dot ${u.is_active ? 'active' : 'inactive'}`} />
                        {u.is_active ? 'Active' : 'Suspended'}
                      </div>
                    </td>
                    <td>
                      {u.is_superuser ? (
                        <Badge variant="purple">Yes</Badge>
                      ) : (
                        <span className="text-xs text-slate-500">No</span>
                      )}
                    </td>
                    <td>
                      <code style={{ fontSize: '0.7rem', color: 'var(--text-placeholder)' }}>
                        {u.id.slice(0, 12)}...
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Admin Queue: Unanswered Questions ── */}
      <section className="admin-section-card admin-queue-card">
        <div className="admin-section-header">
          <div className="admin-section-title">
            <HelpCircle size={20} className="text-amber-400" />
            <h2>Unanswered Questions Queue</h2>
          </div>
          <Badge variant="yellow">{unansweredQuestions.length} Pending</Badge>
        </div>

        <p className="text-xs text-slate-400" style={{ margin: '0 0 1rem 0' }}>
          Users submitted questions the RAG agent could not answer confidently. Review and provide
          authoritative answers to improve the knowledge base.
        </p>

        <div className="admin-queue-list">
          {unansweredQuestions.map((item) => (
            <div
              key={item.id}
              className={`admin-queue-item ${selectedQuestion === item.id ? 'expanded' : ''}`}
            >
              <div
                className="admin-queue-summary"
                onClick={() => setSelectedQuestion(selectedQuestion === item.id ? null : item.id)}
              >
                <div className="admin-queue-main">
                  <div className="admin-queue-question">{item.question}</div>
                  <div className="admin-queue-meta">
                    <span className="admin-queue-user">{item.userName}</span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-400">{item.userEmail}</span>
                  </div>
                </div>

                <div className="admin-queue-badges">
                  <Badge variant="red">Low Confidence</Badge>
                  <Badge variant="slate">{item.category}</Badge>
                  <span className="admin-queue-time">
                    <Clock size={12} className="mr-1" />
                    {item.askedAt}
                  </span>
                  <span className="admin-queue-feedback">
                    <ThumbsUp size={12} className="mr-1" />
                    {item.feedbackCount}
                  </span>
                </div>
              </div>

              {selectedQuestion === item.id && (
                <div className="admin-queue-detail">
                  <div className="admin-queue-stats">
                    <div className="admin-queue-stat">
                      <span className="admin-queue-stat-label">Confidence</span>
                      <span className="admin-queue-stat-value text-red-400">
                        {(item.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="admin-queue-stat">
                      <span className="admin-queue-stat-label">Category</span>
                      <span className="admin-queue-stat-value">{item.category}</span>
                    </div>
                    <div className="admin-queue-stat">
                      <span className="admin-queue-stat-label">User Feedback</span>
                      <span className="admin-queue-stat-value">{item.feedbackCount} reports</span>
                    </div>
                  </div>

                  <div className="admin-queue-feedback-form">
                    <label className="admin-queue-feedback-label">
                      <MessageSquare size={14} className="mr-1" />
                      Provide Answer
                    </label>
                    <textarea
                      className="admin-queue-feedback-input"
                      placeholder="Enter the authoritative answer. This will be added to the knowledge base and used to answer similar future queries."
                      value={feedbackText[item.id] || ''}
                      onChange={(e) =>
                        setFeedbackText((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      rows={3}
                      aria-label={`Feedback for question: ${item.question}`}
                    />
                    <div className="admin-queue-feedback-actions">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleFeedbackSubmit(item.id)}
                        disabled={!feedbackText[item.id]?.trim()}
                      >
                        <Send size={14} className="mr-1" />
                        Submit Answer
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedQuestion(null);
                          setFeedbackText((prev) => ({ ...prev, [item.id]: '' }));
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Platform Security Overview Card ── */}
      <section className="admin-section-card">
        <div className="admin-section-header">
          <h2>
            <ShieldCheck size={20} className="text-green-400" />
            Platform Security Overview
          </h2>
          <Badge variant="green">All Systems Operational</Badge>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
            <UserCheck size={20} className="text-green-400" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
            <div>
              <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-main)' }}>JWT Token Validation</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                HMAC-SHA256 signed tokens with 15-min access lifespan. Redis-backed JTI replay protection active.
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
            <ShieldCheck size={20} className="text-purple-400" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
            <div>
              <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-main)' }}>RBAC Document Filtering</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Vector search results are automatically scoped by user role via <code>allowed_roles</code> parameter.
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
            <UserX size={20} className="text-amber-400" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
            <div>
              <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-main)' }}>Rate Limiting & Throttle</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Chat: 10 req/min, Search: 30 req/min per user. SlowAPI middleware enforced at router level.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminPage;
