import { useState, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { cn } from '@/utils/cn';
import { FloatingChatAssistant } from '@/components/chat/FloatingChatAssistant';
import './layout.css';

export const DashboardLayout = () => {
  const location = useLocation();
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

      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          className={cn(
            'dashboard-content',
            !isSidebarHovered && 'content-collapsed'
          )}
          aria-label="Page content"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>

      {location.pathname !== '/chat' && <FloatingChatAssistant />}
    </div>
  );
};