import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Search,
  Plug,
  User,
  ShieldCheck,
  Mic,
  Wand2,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/hooks/useAuth';
import { NAV_ITEMS } from '@/constants/routes';
import './layout.css';

// ── Map icon name strings to lucide components ──
// We use a string-keyed record because NAV_ITEMS stores icon names as strings
const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  MessageSquare,
  Search,
  Plug,
  User,
  ShieldCheck,
  Mic,
  Wand2,
};

interface SidebarProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}

export const Sidebar = ({
  isCollapsed,
  isMobileOpen,
  onToggleCollapse,
  onCloseMobile,
}: SidebarProps) => {
  const { user } = useAuth();

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || user?.role === 'admin'
  );

  return (
    <>
      {/* Mobile overlay — clicking it closes the sidebar */}
      <div
        className={cn('sidebar-overlay', isMobileOpen && 'overlay-visible')}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside
        className={cn(
          'sidebar',
          isCollapsed && 'sidebar-collapsed',
          isMobileOpen && 'sidebar-mobile-open'
        )}
        aria-label="Main navigation"
      >
        {/* ── Logo ── */}
        <NavLink to="/" className="sidebar-logo" aria-label="EAIOS Home">
          <div className="sidebar-logo-badge">EA</div>
          <span className="sidebar-logo-text">EAIOS</span>
        </NavLink>

        {/* ── Nav Links ── */}
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
                data-tooltip={isCollapsed ? item.label : undefined}
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

        {/* ── Collapse Toggle (desktop only) ── */}
        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight size={18} aria-hidden="true" />
            ) : (
              <>
                <ChevronLeft size={18} aria-hidden="true" />
                <span className="sidebar-collapse-label">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
