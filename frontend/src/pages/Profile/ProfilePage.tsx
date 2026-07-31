import { useState } from 'react';
import {
  User as UserIcon,
  Mail,
  Shield,
  Key,
  KeyRound,
  CheckCircle2,
  Clock,
  Laptop,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ChangePasswordModal } from './ChangePasswordModal';
import './ProfilePage.css';

export const ProfilePage = () => {
  const { user, logout, accessToken } = useAuth();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const userInitial = user?.full_name ? user.full_name[0].toUpperCase() : user?.email ? user.email[0].toUpperCase() : 'U';
  const roleName = user?.role ? user.role.toUpperCase() : 'EMPLOYEE';

  return (
    <div className="profile-page">
      {/* ── Hero Profile Header ── */}
      <header className="profile-hero-card">
        <div className="profile-avatar-large">
          {userInitial}
        </div>

        <div className="profile-hero-meta">
          <div className="profile-name-row">
            <h1>{user?.full_name || 'Enterprise User'}</h1>
            <Badge variant="slate">
              <Shield size={12} className="inline mr-1" />
              {roleName} ROLE
            </Badge>
            {user?.is_superuser && <Badge variant="slate">Superuser</Badge>}
          </div>

          <div className="profile-email-label">
            <Mail size={14} />
            <span>{user?.email || 'user@eaios.enterprise'}</span>
            <span className="mx-2">•</span>
            <span className="text-xs text-slate-400">Account ID: {user?.id || 'N/A'}</span>
          </div>
        </div>

        <div className="profile-hero-actions">
          <Button variant="secondary" size="sm" onClick={() => setIsPasswordModalOpen(true)}>
            <KeyRound size={16} className="mr-1" />
            Change Password
          </Button>

          <Button variant="ghost" size="sm" onClick={logout} className="text-red-400 hover:text-red-300">
            <LogOut size={16} className="mr-1" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* ── Profile Content Grid ── */}
      <div className="profile-content-grid">
        {/* ── Account Details Card ── */}
        <section className="profile-section-card">
          <div className="section-card-title">
            <UserIcon size={20} className="text-blue-400" />
            <h2>Account Details</h2>
          </div>

          <div className="info-list">
            <div className="info-item">
              <span className="info-item-label">
                <UserIcon size={14} /> Full Name
              </span>
              <span className="info-item-value">{user?.full_name || 'Not Specified'}</span>
            </div>

            <div className="info-item">
              <span className="info-item-label">
                <Mail size={14} /> Email Address
              </span>
              <span className="info-item-value">{user?.email}</span>
            </div>

            <div className="info-item">
              <span className="info-item-label">
                <Shield size={14} /> Assigned Role
              </span>
              <span className="info-item-value capitalize">{user?.role}</span>
            </div>

            <div className="info-item">
              <span className="info-item-label">
                <CheckCircle2 size={14} /> Account Status
              </span>
              <span className="info-item-value text-green-400">
                {user?.is_active ? 'Active & Verified' : 'Suspended'}
              </span>
            </div>
          </div>
        </section>

        {/* ── Access Control & RBAC Permissions Card ── */}
        <section className="profile-section-card">
          <div className="section-card-title">
            <Shield size={20} className="text-muted" />
            <h2>RBAC Permission Matrix</h2>
          </div>

          <p className="text-xs text-slate-400" style={{ margin: 0 }}>
            Your RAG semantic searches and AI queries are automatically filtered to document chunks matching your role.
          </p>

          <div className="rbac-rights-list">
            <div className="rbac-right-badge">
              <CheckCircle2 size={14} className="rbac-right-icon" />
              <span>Public & General Company Policies Access</span>
            </div>

            <div className="rbac-right-badge">
              <CheckCircle2 size={14} className="rbac-right-icon" />
              <span>Personal Integration & OAuth Connector Ingestion</span>
            </div>

            {(user?.role === 'manager' || user?.role === 'admin' || user?.role === 'hr') && (
              <div className="rbac-right-badge">
                <CheckCircle2 size={14} className="rbac-right-icon" />
                <span>Departmental & Confidential Team Documents Access</span>
              </div>
            )}

            {user?.role === 'admin' && (
              <>
                <div className="rbac-right-badge">
                  <CheckCircle2 size={14} className="rbac-right-icon" />
                  <span>Full Platform User Administration & Role Modification</span>
                </div>
                <div className="rbac-right-badge">
                  <CheckCircle2 size={14} className="rbac-right-icon" />
                  <span>Unanswered Query Review & Knowledge Base Management</span>
                </div>
              </>
            )}
          </div>
        </section>

        {/* ── JWT Session & Security Telemetry Card ── */}
        <section className="profile-section-card">
          <div className="section-card-title">
            <Key size={20} className="text-green-400" />
            <h2>Active Session Telemetry</h2>
          </div>

          <div className="session-detail-box">
            <div className="session-key-row">
              <span>Token Type:</span>
              <strong>JWT Bearer (HMAC-SHA256)</strong>
            </div>
            <div className="session-key-row">
              <span>Token Lifetime:</span>
              <strong>15 Minutes (Auto-refreshed via Redis JTI)</strong>
            </div>
            <div className="session-key-row">
              <span>Active Token Preview:</span>
              <strong>{accessToken ? `${accessToken.slice(0, 16)}...` : 'N/A'}</strong>
            </div>
          </div>

          <div className="info-list">
            <div className="info-item">
              <span className="info-item-label">
                <Laptop size={14} /> Session Device
              </span>
              <span className="info-item-value">Web Application (Browser)</span>
            </div>

            <div className="info-item">
              <span className="info-item-label">
                <Clock size={14} /> Replay Protection
              </span>
              <span className="info-item-value text-blue-400">Redis Blacklist Active</span>
            </div>
          </div>
        </section>
      </div>

      {/* ── Change Password Modal ── */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};

export default ProfilePage;
