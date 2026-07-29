import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  LayoutDashboard,
  User,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import { SearchOverlay } from './SearchOverlay';
import './layout.css';

interface TopbarProps {
  isCollapsed: boolean;
  onToggleMobile: () => void;
}

export const Topbar = ({ isCollapsed, onToggleMobile }: TopbarProps) => {
  const { logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayName = 'DB';
  const initials = 'DB';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
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
    <header
      className={cn('topbar', isCollapsed && 'topbar-collapsed')}
      role="banner"
    >
      {/* ── Left: Hamburger + Search ── */}
      <div className="topbar-left">
        <button
          type="button"
          className="topbar-hamburger"
          onClick={onToggleMobile}
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>

        <div
          className="topbar-search"
          onClick={() => setIsSearchOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsSearchOpen(true);
            }
          }}
        >
          <Search size={16} className="topbar-search-icon" aria-hidden="true" />
          <input
            type="text"
            className="topbar-search-input"
            placeholder="Search documents, meetings, workflows..."
            readOnly
            aria-label="Global search"
          />
          <kbd className="topbar-search-kbd">Ctrl K</kbd>
        </div>
      </div>

      {/* ── Right Actions ── */}
      <div className="topbar-actions">
        <button
          type="button"
          className="topbar-icon-btn"
          aria-label="Notifications"
        >
          <Bell size={18} aria-hidden="true" />
        </button>

        <div className="topbar-dropdown-wrapper" ref={dropdownRef}>
          <button
            type="button"
            className="topbar-avatar-btn"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
          >
            <div className="topbar-avatar-ring" aria-hidden="true">
              {initials}
            </div>
            <span className="topbar-user-name">{displayName}</span>
            <ChevronDown size={16} aria-hidden="true" />
          </button>

          {isDropdownOpen && (
            <div className="topbar-dropdown" role="menu">
              <NavLink
                to={ROUTES.DASHBOARD}
                className="topbar-dropdown-item"
                onClick={() => setIsDropdownOpen(false)}
                role="menuitem"
              >
                <LayoutDashboard size={16} aria-hidden="true" />
                Dashboard
              </NavLink>
              <NavLink
                to={ROUTES.PROFILE}
                className="topbar-dropdown-item"
                onClick={() => setIsDropdownOpen(false)}
                role="menuitem"
              >
                <User size={16} aria-hidden="true" />
                Profile
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
                onClick={() => {
                  logout();
                  setIsDropdownOpen(false);
                }}
                role="menuitem"
              >
                <LogOut size={16} aria-hidden="true" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {isSearchOpen && (
        <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      )}
    </header>
  );
};
