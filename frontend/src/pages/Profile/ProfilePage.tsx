import { useState } from 'react';
import {
  User,
  Shield,
  Lock,
  LogOut,
  CheckCircle2,
  Laptop,
  Palette,
  Globe,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { ChangePasswordModal } from './ChangePasswordModal';
import { cn } from '@/utils/cn';
import './ProfilePage.css';

const ROLE_LABELS: Record<string, string> = {
  employee: 'Employee',
  manager: 'Manager',
  hr: 'HR',
  admin: 'Admin',
};

export const ProfilePage = () => {
  const { user, logout } = useAuth();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const roleLabel = ROLE_LABELS[user?.role ?? 'employee'] || 'Employee';

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* ── Profile Header ── */}
        <section className="profile-header-card">
          <div className="profile-header-avatar" aria-hidden="true">
            <div className="profile-avatar-circle">
              <User size={48} strokeWidth={1.5} />
            </div>
          </div>
          <div className="profile-header-body">
            <div className="profile-header-top">
              <h1 className="profile-full-name">
                {user?.full_name || 'Enterprise User'}
              </h1>
              <div className="profile-badges">
                <Badge variant="slate" className="profile-role-badge">
                  {roleLabel}
                </Badge>
                {user?.is_active && (
                  <Badge variant="green" className="profile-verified-badge">
                    <CheckCircle2 size={12} aria-hidden="true" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>
            <p className="profile-email">{user?.email || 'user@eaios.enterprise'}</p>
          </div>
          <div className="profile-header-actions">
            <Button variant="secondary" size="sm" className="profile-edit-btn">
              Edit Profile
            </Button>
          </div>
        </section>

        {/* ── Personal Information ── */}
        <section className="profile-section-card">
          <h2 className="profile-section-title">
            <User size={20} className="text-muted" aria-hidden="true" />
            Personal Information
          </h2>
          <div className="profile-info-list">
            <InfoRow label="Full Name" value={user?.full_name || 'Not specified'} />
            <InfoRow label="Email" value={user?.email || 'Not specified'} />
            <InfoRow label="Role" value={roleLabel} />
            <InfoRow
              label="Account Status"
              value={
                <span
                  className={cn(
                    'profile-status-dot',
                    user?.is_active ? 'profile-status-active' : 'profile-status-suspended'
                  )}
                >
                  {user?.is_active ? 'Active & Verified' : 'Suspended'}
                </span>
              }
            />
            <InfoRow label="Account ID" value={user?.id || 'N/A'} />
          </div>
        </section>

        {/* ── Security ── */}
        <section className="profile-section-card">
          <h2 className="profile-section-title">
            <Lock size={20} className="text-muted" aria-hidden="true" />
            Security
          </h2>
          <div className="profile-security-list">
            <button
              type="button"
              className="profile-security-row"
              onClick={() => setIsPasswordModalOpen(true)}
            >
              <div className="profile-security-icon">
                <Lock size={18} aria-hidden="true" />
              </div>
              <div className="profile-security-meta">
                <span className="profile-security-title">Password</span>
                <span className="profile-security-desc">Last changed 20 days ago</span>
              </div>
              <ChevronRight size={16} className="profile-security-chevron" aria-hidden="true" />
            </button>
            <div className="profile-security-row">
              <div className="profile-security-icon">
                <Laptop size={18} aria-hidden="true" />
              </div>
              <div className="profile-security-meta">
                <span className="profile-security-title">Recent Login</span>
                <span className="profile-security-desc">Web Application (Browser) • Just now</span>
              </div>
              <span className="profile-security-tag">Current Session</span>
            </div>
          </div>
        </section>

        {/* ── Preferences ── */}
        <section className="profile-section-card">
          <h2 className="profile-section-title">
            <Palette size={20} className="text-muted" aria-hidden="true" />
            Preferences
          </h2>
          <div className="profile-preferences-list">
            <div className="profile-preference-row">
              <div className="profile-preference-left">
                <Palette size={16} className="text-muted" aria-hidden="true" />
                <div>
                  <span className="profile-preference-title">Theme</span>
                  <span className="profile-preference-desc">Dark / Corporate White</span>
                </div>
              </div>
              <span className="profile-preference-value">System Default</span>
            </div>
            <div className="profile-preference-row">
              <div className="profile-preference-left">
                <Globe size={16} className="text-muted" aria-hidden="true" />
                <div>
                  <span className="profile-preference-title">Language</span>
                  <span className="profile-preference-desc">Display language</span>
                </div>
              </div>
              <span className="profile-preference-value">English</span>
            </div>
            <div className="profile-divider" role="separator" />
            <ToggleSwitch
              label="Email Preferences"
              description="Receive product updates and notifications"
              checked={true}
              onCheckedChange={() => {}}
            />
            <ToggleSwitch
              label="Auto Save"
              description="Automatically save drafts and changes"
              checked={true}
              onCheckedChange={() => {}}
            />
            <ToggleSwitch
              label="Desktop Notifications"
              description="Show notifications in the browser"
              checked={false}
              onCheckedChange={() => {}}
            />
          </div>
        </section>

        {/* ── Account Actions ── */}
        <section className="profile-section-card profile-danger-card">
          <h2 className="profile-section-title">
            <Shield size={20} className="text-error" aria-hidden="true" />
            <span className="profile-danger-title">Account Actions</span>
          </h2>
          <p className="profile-danger-desc">
            Sign out of your account. You will need to sign in again to access the dashboard.
          </p>
          <Button variant="danger" className="profile-signout-btn" onClick={logout}>
            <LogOut size={16} aria-hidden="true" />
            Sign Out
          </Button>
        </section>
      </div>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="profile-info-row">
    <span className="profile-info-label">{label}</span>
    <span className="profile-info-value">{value}</span>
  </div>
);

export default ProfilePage;
