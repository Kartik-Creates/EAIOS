import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Plug,
  ShieldCheck,
  Mic,
  Wand2,
  User,
  Settings,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useAuth } from '@/hooks/useAuth';
import { useAvatar } from '@/hooks/useAvatar';
import { NAV_ITEMS } from '@/constants/routes';
import { AppLogo } from '@/components/common/AppLogo';
import { iconHoverVariants } from '@/lib/motion';
import { DropdownWrapper } from '@/lib/motion';
import './layout.css';

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  MessageSquare,
  Plug,
  ShieldCheck,
  Mic,
  Wand2,
};

interface SidebarProps {
  isHovered: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export const Sidebar = ({
  isHovered,
  isMobileOpen,
  onCloseMobile,
  onMouseEnter,
  onMouseLeave,
}: SidebarProps) => {
  const { user, logout } = useAuth();
  const { avatarUrl } = useAvatar(user?.id);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const visibleNavItems = NAV_ITEMS.filter(
    (item) =>
      (!item.adminOnly || user?.role === 'admin') &&
      item.label !== 'Profile' &&
      item.label !== 'Search'
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <>
      <div
        className={cn('sidebar-overlay', isMobileOpen && 'overlay-visible')}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside
        className={cn(
          'sidebar',
          !isHovered && 'sidebar-collapsed',
          isMobileOpen && 'sidebar-mobile-open'
        )}
        aria-label="Main navigation"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="sidebar-header">
          <NavLink to="/" className="sidebar-logo" aria-label="UnifyAI Home">
            <AppLogo className="app-logo-sidebar" />
          </NavLink>
        </div>

        <nav className="sidebar-nav" aria-label="Application pages">
          {visibleNavItems.map((item) => {
            const Icon = ICON_MAP[item.icon];
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  cn('sidebar-nav-item', isActive && 'active')
                }
                aria-label={item.label}
              >
                {Icon && (
                  <motion.span
                    className="sidebar-nav-icon"
                    variants={iconHoverVariants}
                    initial="rest"
                    whileHover="hover"
                  >
                    <Icon size={20} aria-hidden="true" />
                  </motion.span>
                )}
                <span className="sidebar-nav-label">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* ── Sidebar Profile ── */}
        <div className="sidebar-profile-wrapper" ref={profileRef}>
          <motion.button
            type="button"
            className="sidebar-profile-btn"
            onClick={() => setIsProfileOpen((prev) => !prev)}
            aria-expanded={isProfileOpen}
            aria-haspopup="true"
            variants={iconHoverVariants}
            initial="rest"
            whileHover="hover"
            whileTap="tap"
          >
            <div className="sidebar-profile-avatar" aria-hidden="true">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" />
              ) : (
                <User size={20} strokeWidth={1.5} />
              )}
            </div>
            <div className="sidebar-profile-info">
              <span className="sidebar-profile-name">{user?.full_name || 'User'}</span>
              <span className="sidebar-profile-email">{user?.email || ''}</span>
            </div>
          </motion.button>

          <AnimatePresence>
            {isProfileOpen && (
              <DropdownWrapper className="sidebar-profile-dropdown" isOpen={isProfileOpen}>
                <div className="sidebar-profile-dropdown-user">
                  <div className="sidebar-profile-dropdown-avatar" aria-hidden="true">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Profile" />
                    ) : (
                      <User size={20} strokeWidth={1.5} />
                    )}
                  </div>
                  <div className="sidebar-profile-dropdown-info">
                    <span className="sidebar-profile-dropdown-name">{user?.full_name || 'User'}</span>
                    <span className="sidebar-profile-dropdown-email">{user?.email || ''}</span>
                  </div>
                </div>
                <div className="topbar-dropdown-divider" role="separator" />
                <NavLink
                  to="/profile"
                  className="topbar-dropdown-item"
                  onClick={() => setIsProfileOpen(false)}
                  role="menuitem"
                >
                  <User size={16} aria-hidden="true" />
                  Profile
                </NavLink>
                <div className="topbar-dropdown-divider" role="separator" />
                <NavLink
                  to="/dashboard"
                  className="topbar-dropdown-item"
                  onClick={() => setIsProfileOpen(false)}
                  role="menuitem"
                >
                  <LayoutDashboard size={16} aria-hidden="true" />
                  Dashboard
                </NavLink>
                <div className="topbar-dropdown-divider" role="separator" />
                <button
                  type="button"
                  className="topbar-dropdown-item"
                  disabled
                  role="menuitem"
                >
                  <Settings size={16} aria-hidden="true" />
                  Settings
                </button>
                <div className="topbar-dropdown-divider" role="separator" />
                <button
                  type="button"
                  className="topbar-dropdown-item"
                  disabled
                  role="menuitem"
                >
                  <LogOut size={16} aria-hidden="true" />
                  Change Password
                </button>
                <div className="topbar-dropdown-divider" role="separator" />
                <button
                  type="button"
                  className="topbar-dropdown-item"
                  onClick={() => {
                    logout();
                    setIsProfileOpen(false);
                  }}
                  role="menuitem"
                >
                  <LogOut size={16} aria-hidden="true" />
                  Sign Out
                </button>
              </DropdownWrapper>
            )}
          </AnimatePresence>
        </div>
      </aside>
    </>
  );
};
