import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Menu,
  Bell,
  Moon,
  Sun,
  GitPullRequest,
  Calendar,
  FolderOpen,
  Workflow,
  CheckCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useTheme } from '@/hooks/useTheme';
import { DropdownWrapper, iconHoverVariants } from '@/lib/motion';
import { notificationService, type NotificationItem } from '@/services/notificationService';
import './layout.css';

const formatRelativeTime = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return 'Just now';
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return isoString;
  }
};

const getSourceIcon = (source: string) => {
  switch (source.toLowerCase()) {
    case 'github':
      return <GitPullRequest size={16} className="text-[#58A6FF]" />;
    case 'jira':
      return <span className="text-[#0052CC] font-bold text-xs">J</span>;
    case 'drive':
      return <FolderOpen size={16} className="text-[#34A853]" />;
    case 'meeting':
      return <Calendar size={16} className="text-[#FBBC05]" />;
    case 'workflow':
      return <Workflow size={16} className="text-[#A78BFA]" />;
    default:
      return <CheckCircle size={16} className="text-muted" />;
  }
};

interface TopbarProps {
  isCollapsed: boolean;
  onToggleMobile: () => void;
}

export const Topbar = ({ isCollapsed, onToggleMobile }: TopbarProps) => {
  const { theme, toggleTheme } = useTheme();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch {
      // Fallback silently if unauthenticated or network error
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Visibility-aware polling (every 2 minutes while tab is active, pauses when hidden)
  useEffect(() => {
    fetchNotifications();

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (!intervalId) {
        intervalId = setInterval(fetchNotifications, 120000); // 2 minutes
      }
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
        startPolling();
      } else {
        stopPolling();
      }
    };

    if (document.visibilityState === 'visible') {
      startPolling();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await notificationService.markAllAsRead();
    } catch (err) {
      console.warn('Failed to mark all as read:', err);
    }
  };

  const handleNotificationItemClick = async (notification: NotificationItem) => {
    if (!notification.is_read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      );
      try {
        await notificationService.markAsRead([notification.id]);
      } catch (err) {
        console.warn('Failed to mark notification as read:', err);
      }
    }
  };

  const handleNotificationClick = () => {
    setIsNotificationsOpen((prev) => !prev);
  };

  return (
    <header
      className={cn('topbar', isCollapsed && 'topbar-collapsed')}
      role="banner"
    >
      {/* ── Left: Hamburger ── */}
      <div className="topbar-left">
        <button
          type="button"
          className="topbar-hamburger"
          onClick={onToggleMobile}
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* ── Right Actions ── */}
      <div className="topbar-actions">
        {/* Theme Toggle */}
        <motion.button
          type="button"
          className="topbar-icon-btn"
          aria-label="Toggle theme"
          onClick={toggleTheme}
          variants={iconHoverVariants}
          initial="rest"
          whileHover="hover"
          whileTap="tap"
        >
          {theme === 'dark' ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
        </motion.button>

        {/* Notification Bell */}
        <div className="topbar-notification-wrapper" ref={notificationRef}>
          <motion.button
            type="button"
            className="topbar-icon-btn"
            aria-label="Notifications"
            onClick={handleNotificationClick}
            aria-expanded={isNotificationsOpen}
            variants={iconHoverVariants}
            initial="rest"
            whileHover="hover"
            whileTap="tap"
          >
            <Bell size={18} aria-hidden="true" />
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  key="badge"
                  className="topbar-notification-badge"
                  aria-label={`${unreadCount} unread notifications`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <AnimatePresence>
            {isNotificationsOpen && (
              <DropdownWrapper className="topbar-notification-dropdown" isOpen={isNotificationsOpen}>
                <div className="topbar-notification-header">
                  <h3 className="topbar-notification-title">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className="topbar-notification-mark-all"
                      onClick={handleMarkAllAsRead}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="topbar-notification-list">
                  {notifications.length === 0 ? (
                    <div className="topbar-notification-empty">
                      <span className="topbar-notification-empty-icon">📭</span>
                      <p>No notifications yet</p>
                      <span>{isLoading ? 'Loading...' : "You're all caught up!"}</span>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        className={cn(
                          'topbar-notification-item',
                          !notification.is_read && 'topbar-notification-item-unread'
                        )}
                        role="menuitem"
                        onClick={() => handleNotificationItemClick(notification)}
                        style={{ cursor: 'pointer' }}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: 0.05 }}
                      >
                        <div className="topbar-notification-item-icon">
                          {getSourceIcon(notification.source)}
                        </div>
                        <div className="topbar-notification-item-content">
                          <div className="topbar-notification-item-header">
                            <span className="topbar-notification-item-source">
                              {notification.source.charAt(0).toUpperCase() + notification.source.slice(1)}
                            </span>
                            <span className="topbar-notification-item-time">
                              {formatRelativeTime(notification.created_at)}
                            </span>
                          </div>
                          <p className="topbar-notification-item-title">{notification.title}</p>
                          {notification.description && (
                            <p className="topbar-notification-item-desc">{notification.description}</p>
                          )}
                        </div>
                        <div className="topbar-notification-item-indicator">
                          {notification.is_read ? (
                            <span className="text-muted">✓</span>
                          ) : (
                            <span className="text-accent">●</span>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </DropdownWrapper>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
