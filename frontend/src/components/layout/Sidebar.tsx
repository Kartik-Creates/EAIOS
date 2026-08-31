import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
  ChevronRight,
  Palette,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { cn } from '@/utils/cn';
import { useAuth } from '@/hooks/useAuth';
import { useAvatar } from '@/hooks/useAvatar';
import { NAV_ITEMS } from '@/constants/routes';
import { ROUTES } from '@/constants/routes';
import { AppLogo } from '@/components/common/AppLogo';
import { iconHoverVariants, dropdownVariants } from '@/lib/motion';
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
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'manager';

  const visibleNavItems = NAV_ITEMS.filter(
    (item) =>
      (!item.adminOnly || isManagerOrAdmin) &&
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

  useEffect(() => {
    if (!isHovered) {
      setIsProfileOpen(false);
    }
  }, [isHovered]);

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
          <button
            type="button"
            className="sidebar-profile-btn"
            onClick={() => setIsProfileOpen((prev) => !prev)}
            aria-expanded={isProfileOpen}
            aria-haspopup="true"
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
          </button>

          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                className="sidebar-profile-dropdown"
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div role="menu">
                  <button
                    type="button"
                    className="profile-dropdown-header"
                    onClick={() => navigate(ROUTES.PROFILE)}
                    role="menuitem"
                  >
                    <div className="profile-dropdown-user">
                      <div className="profile-dropdown-avatar" aria-hidden="true">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Profile" />
                        ) : (
                          <User size={20} strokeWidth={1.5} />
                        )}
                      </div>
                      <div className="profile-dropdown-info">
                        <span className="profile-dropdown-name">{user?.full_name || 'User'}</span>
                        <span className="profile-dropdown-email">{user?.email || ''}</span>
                      </div>
                    </div>
                    <div className="profile-dropdown-header-right">
                      <ChevronRight size={12} className="text-muted" />
                    </div>
                  </button>

                  <div className="profile-dropdown-divider" role="separator" />

                  <div className="profile-dropdown-menu">

                    <button
                      type="button"
                      className="profile-dropdown-item"
                      onClick={() => toast.success('Personalization coming soon')}
                      role="menuitem"
                    >
                      <Palette size={14} aria-hidden="true" />
                      <span>Personalization</span>
                    </button>
                    <button
                      type="button"
                      className="profile-dropdown-item"
                      onClick={() => navigate(ROUTES.PROFILE)}
                      role="menuitem"
                    >
                      <User size={14} aria-hidden="true" />
                      <span>Profile</span>
                    </button>
                    <button
                      type="button"
                      className="profile-dropdown-item"
                      onClick={() => toast.success('Settings coming soon')}
                      role="menuitem"
                    >
                      <Settings size={14} aria-hidden="true" />
                      <span>Settings</span>
                    </button>

                    <div className="profile-dropdown-divider" role="separator" />

                    <button
                      type="button"
                      className="profile-dropdown-item"
                      onClick={() => toast.success('Help coming soon')}
                      role="menuitem"
                    >
                      <HelpCircle size={14} aria-hidden="true" />
                      <span>Help</span>
                    </button>
                    <button
                      type="button"
                      className="profile-dropdown-item profile-dropdown-item-danger"
                      onClick={() => {
                        logout();
                        setIsProfileOpen(false);
                      }}
                      role="menuitem"
                    >
                      <LogOut size={14} aria-hidden="true" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>
    </>
  );
};
