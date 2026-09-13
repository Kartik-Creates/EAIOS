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
  FileText,
  type LucideIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useAuth } from '@/hooks/useAuth';
import { useAvatar } from '@/hooks/useAvatar';
import { useLanguage } from '@/hooks/useLanguage';
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
  FileText,
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
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHelpPopupOpen, setIsHelpPopupOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const helpPopupRef = useRef<HTMLDivElement>(null);

  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'manager';

  const visibleNavItems = NAV_ITEMS.filter(
    (item) =>
      (!item.adminOnly || isManagerOrAdmin) &&
      item.label !== 'Profile' &&
      item.label !== 'Search' &&
      item.label !== 'Terms & Conditions' &&
      item.label !== 'Privacy Policy' &&
      item.label !== 'Personalization' &&
      item.label !== 'Settings'
  );

  useEffect(() => {
    if (!isHovered) {
      setIsProfileOpen(false);
      setIsHelpPopupOpen(false);
    }
  }, [isHovered]);

  // Close both popups when mobile is closed
  useEffect(() => {
    if (isMobileOpen) {
      setIsProfileOpen(false);
      setIsHelpPopupOpen(false);
    }
  }, [isMobileOpen]);

  // Handle click-outside for Help popup only
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isHelpPopupOpen && helpPopupRef.current && !helpPopupRef.current.contains(event.target as Node)) {
        setIsHelpPopupOpen(false);
      }
    };

    if (isHelpPopupOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isHelpPopupOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileOpen(false);
        setIsHelpPopupOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
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
            const Icon = ICON_MAP[item.icon ?? ''];
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
                <span className="sidebar-nav-label">
                  {item.translationKey ? t(item.translationKey) : item.label}
                </span>
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

          {isProfileOpen && (
            <motion.div
              className="sidebar-profile-dropdown"
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <div role="menu">
                <div className="profile-dropdown-menu">
                  <button
                    type="button"
                    className="profile-dropdown-item"
                    onClick={() => navigate(ROUTES.PROFILE)}
                    role="menuitem"
                  >
                    <User size={14} aria-hidden="true" />
                    <span>{t('navigation.profile')}</span>
                  </button>
                  <button
                    type="button"
                    className="profile-dropdown-item"
                    onClick={() => navigate(ROUTES.SETTINGS)}
                    role="menuitem"
                  >
                    <Settings size={14} aria-hidden="true" />
                    <span>{t('navigation.settings')}</span>
                  </button>
                  <button
                    type="button"
                    className="profile-dropdown-item"
                    onClick={() => {
                      setIsProfileOpen(false);
                      setIsHelpPopupOpen(true);
                    }}
                    role="menuitem"
                  >
                    <FileText size={14} aria-hidden="true" />
                    <span>Help</span>
                  </button>
                  <div className="profile-dropdown-divider" role="separator" aria-hidden="true" />
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
                    <span>{t('common.logout')}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {isHelpPopupOpen && (
              <motion.div
                ref={helpPopupRef}
                className="sidebar-help-popup"
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={(e) => e.stopPropagation()}
              >
                <div role="menu">
                  <div className="profile-dropdown-menu">
                    <div className="help-popup-header">
                      <FileText size={14} aria-hidden="true" />
                      <span>Help</span>
                    </div>
                    <button
                      type="button"
                      className="profile-dropdown-item"
                      onClick={() => {
                        navigate(ROUTES.TERMS);
                        setIsHelpPopupOpen(false);
                      }}
                      role="menuitem"
                    >
                      <span>Terms of Service</span>
                    </button>
                    <button
                      type="button"
                      className="profile-dropdown-item"
                      onClick={() => {
                        navigate(ROUTES.PRIVACY);
                        setIsHelpPopupOpen(false);
                      }}
                      role="menuitem"
                    >
                      <span>Privacy Policy</span>
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