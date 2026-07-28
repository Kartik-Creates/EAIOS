import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { cn } from '@/utils/cn';
import './layout.css';

/**
 * DashboardLayout
 *
 * The persistent application shell used by all authenticated pages.
 * Composes the Sidebar + Topbar + page content (<Outlet />).
 * Manages sidebar collapse and mobile open/close state locally —
 * these are purely UI concerns and do not belong in AuthContext.
 */
export const DashboardLayout = () => {
  const [isCollapsed, setIsCollapsed]     = useState(false);
  const [isMobileOpen, setIsMobileOpen]   = useState(false);

  const handleToggleCollapse = () => setIsCollapsed((prev) => !prev);
  const handleToggleMobile   = () => setIsMobileOpen((prev) => !prev);
  const handleCloseMobile    = () => setIsMobileOpen(false);

  return (
    <div className="dashboard-layout">
      <Sidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        onToggleCollapse={handleToggleCollapse}
        onCloseMobile={handleCloseMobile}
      />

      <Topbar
        isCollapsed={isCollapsed}
        onToggleMobile={handleToggleMobile}
      />

      <main
        className={cn(
          'dashboard-content',
          isCollapsed && 'content-collapsed'
        )}
        aria-label="Page content"
      >
        <Outlet />
      </main>
    </div>
  );
};
