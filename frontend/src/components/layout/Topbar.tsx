import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/Badge';
import { NAV_ITEMS, ROUTES } from '@/constants/routes';
import { ROLES } from '@/constants/roles';
import type { Role } from '@/types/auth.types';
import './layout.css';

// Map role → Badge variant
const ROLE_BADGE_VARIANT: Record<Role, 'purple' | 'blue' | 'green' | 'slate'> = {
  admin:    'purple',
  manager:  'blue',
  hr:       'green',
  employee: 'slate',
};

interface TopbarProps {
  isCollapsed: boolean;
  onToggleMobile: () => void;
}

export const Topbar = ({ isCollapsed, onToggleMobile }: TopbarProps) => {
  const { user } = useAuth();
  const location = useLocation();

  // Derive current page label from the active route
  const currentPage =
    NAV_ITEMS.find((item) => item.path === location.pathname)?.label ??
    (location.pathname === ROUTES.ROOT ? 'Dashboard' : 'EAIOS');

  // Build avatar initials from full_name or email
  const initials = (() => {
    if (user?.full_name) {
      const parts = user.full_name.trim().split(' ');
      return parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : parts[0].slice(0, 2).toUpperCase();
    }
    return user?.email?.slice(0, 2).toUpperCase() ?? 'U';
  })();

  const displayName = user?.full_name ?? user?.email ?? 'User';
  const role = user?.role ?? ROLES.EMPLOYEE;
  const badgeVariant = ROLE_BADGE_VARIANT[role];

  return (
    <header
      className={cn('topbar', isCollapsed && 'topbar-collapsed')}
      role="banner"
    >
      {/* ── Hamburger (mobile only) ── */}
      <button
        type="button"
        className="topbar-hamburger"
        onClick={onToggleMobile}
        aria-label="Toggle navigation menu"
      >
        <Menu size={22} />
      </button>

      {/* ── Breadcrumb ── */}
      <div className="topbar-breadcrumb" aria-label="Breadcrumb">
        <span>EAIOS</span>
        <span aria-hidden="true">/</span>
        <span className="topbar-breadcrumb-current">{currentPage}</span>
      </div>

      {/* ── Right Actions ── */}
      <div className="topbar-actions">
        {user?.role && (
          <Badge variant={badgeVariant}>
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </Badge>
        )}

        <button
          type="button"
          className="topbar-avatar-btn"
          aria-label={`Signed in as ${displayName}`}
        >
          <div className="topbar-avatar-ring" aria-hidden="true">
            {initials}
          </div>
          <span className="topbar-user-name">{displayName}</span>
        </button>
      </div>
    </header>
  );
};
