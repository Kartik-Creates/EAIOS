import { NavLink } from 'react-router-dom';
import {
  MessageSquare,
  Plug,
  ShieldCheck,
  Mic,
  Wand2,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/hooks/useAuth';
import { NAV_ITEMS } from '@/constants/routes';
import './layout.css';

const ICON_MAP: Record<string, LucideIcon> = {
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
  const { user } = useAuth();

  const visibleNavItems = NAV_ITEMS.filter(
    (item) =>
      (!item.adminOnly || user?.role === 'admin') &&
      item.label !== 'Dashboard' &&
      item.label !== 'Profile' &&
      item.label !== 'Search'
  );

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
          <NavLink to="/" className="sidebar-logo" aria-label="EAIOS Home">
            <div className="sidebar-logo-badge"><img src="" alt="" /></div>
            <span className="sidebar-logo-text">UNIFY-AI</span>
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
                  <span className="sidebar-nav-icon">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                )}
                <span className="sidebar-nav-label">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
