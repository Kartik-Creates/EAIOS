import { useState } from 'react';
import {
  User,
  Shield,
  Lock,
  LogOut,
  CheckCircle2,
  Laptop,
  Palette,
  ChevronRight,
  Moon,
  Sun,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useAvatar } from '@/hooks/useAvatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { EditProfileModal } from './EditProfileModal';
import { ChangePasswordModal } from './ChangePasswordModal';
import { cn } from '@/utils/cn';
import { staggerContainer, staggerItem } from '@/lib/motion';
import './ProfilePage.css';

const ROLE_LABELS: Record<string, string> = {
  employee: 'Employee',
  manager: 'Manager',
  hr: 'HR',
  admin: 'Admin',
};

export const ProfilePage = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { avatarUrl } = useAvatar(user?.id);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const roleLabel = ROLE_LABELS[user?.role ?? 'employee'] || 'Employee';

  return (
    <motion.div className="profile-page">
      <motion.div className="profile-container profile-container-wide" variants={staggerContainer}>
        {/* ── Profile Header ── */}
        <motion.section className="profile-header-card" variants={staggerItem} whileHover={{ y: -2 }}>
          <motion.div className="profile-header-avatar" aria-hidden="true" whileHover={{ scale: 1.05 }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="profile-header-img" />
            ) : (
              <div className="profile-avatar-circle">
                <User size={48} strokeWidth={1.5} />
              </div>
            )}
          </motion.div>
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
            <Button variant="secondary" size="sm" className="profile-edit-btn" onClick={() => setIsEditProfileOpen(true)}>
              Edit Profile
            </Button>
          </div>
        </motion.section>

        {/* ── Personal Information ── */}
        <motion.section className="profile-section-card" variants={staggerItem}>
          <h2 className="profile-section-title">
            <User size={20} className="text-muted" aria-hidden="true" />
            Personal Information
          </h2>
          <div className="profile-info-list profile-info-list-wide">
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
        </motion.section>

        {/* ── Security ── */}
        <motion.section className="profile-section-card" variants={staggerItem}>
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
        </motion.section>

        {/* ── Preferences ── */}
        <motion.section className="profile-section-card" variants={staggerItem}>
          <h2 className="profile-section-title">
            <Palette size={20} className="text-muted" aria-hidden="true" />
            Preferences
          </h2>
          <div className="profile-preferences-list">
            <div className="profile-theme-row">
              <div className="profile-theme-left">
                <div className="profile-theme-icon">
                  {theme === 'dark' ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
                </div>
                <div>
                  <span className="profile-preference-title">Theme</span>

                </div>
              </div>
              <ToggleSwitch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
            </div>
          </div>
        </motion.section>

        {/* ── Account Actions ── */}
        <motion.section className="profile-section-card profile-danger-card" variants={staggerItem}>
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
        </motion.section>
      </motion.div>

      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </motion.div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="profile-info-row">
    <span className="profile-info-label">{label}</span>
    <span className="profile-info-value">{value}</span>
  </div>
);

export default ProfilePage;
