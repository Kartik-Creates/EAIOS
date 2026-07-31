import { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { cn } from '@/utils/cn';
import './layout.css';

export const DashboardLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  const handleToggleMobile = useCallback(() => setIsMobileOpen((prev) => !prev), []);
  const handleCloseMobile = useCallback(() => setIsMobileOpen(false), []);

  return (
    <div className="dashboard-layout">
      <Sidebar
        isHovered={isSidebarHovered}
        isMobileOpen={isMobileOpen}
        onCloseMobile={handleCloseMobile}
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
      />

      <Topbar
        isCollapsed={!isSidebarHovered}
        onToggleMobile={handleToggleMobile}
      />

      <main
        className={cn(
          'dashboard-content',
          !isSidebarHovered && 'content-collapsed'
        )}
        aria-label="Page content"
      >
        <Outlet />
      </main>
    </div>
  );
};