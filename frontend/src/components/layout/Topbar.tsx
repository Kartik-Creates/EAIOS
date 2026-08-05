import { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Bell,
  Moon,
  Sun,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useTheme } from '@/hooks/useTheme';
import { DropdownWrapper, iconHoverVariants } from '@/lib/motion';
import './layout.css';

interface NotificationItem {
  id: string;
  source: string;
  sourceIcon: React.ReactNode;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}

const NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    source: 'Slack',
    sourceIcon: <span className="text-[#E01E5A]">S</span>,
    title: 'John mentioned you in #engineering',
    description: '@you Can you review the latest PR when you get a chance?',
    timestamp: '2 min ago',
    read: false,
  },
  {
    id: '2',
    source: 'Jira',
    sourceIcon: <span className="text-[#0052CC]">J</span>,
    title: 'TASK-142 moved to "In Review"',
    description: 'Status changed from In Progress to In Review by Sarah',
    timestamp: '15 min ago',
    read: false,
  },
  {
    id: '3',
    source: 'Slack',
    sourceIcon: <span className="text-[#E01E5A]">S</span>,
    title: 'Daily standup starts in 10 minutes',
    description: 'Reminder: Engineering standup in #engineering channel',
    timestamp: 'Today',
    read: true,
  },
];

interface TopbarProps {
  isCollapsed: boolean;
  onToggleMobile: () => void;
}

export const Topbar = ({ isCollapsed, onToggleMobile }: TopbarProps) => {
  const { theme, toggleTheme } = useTheme();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(NOTIFICATIONS);
  const notificationRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

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

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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
                      <span>You're all caught up!</span>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        className={cn(
                          'topbar-notification-item',
                          !notification.read && 'topbar-notification-item-unread'
                        )}
                        role="menuitem"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: 0.05 }}
                      >
                        <div className="topbar-notification-item-icon">
                          {notification.sourceIcon}
                        </div>
                        <div className="topbar-notification-item-content">
                          <div className="topbar-notification-item-header">
                            <span className="topbar-notification-item-source">{notification.source}</span>
                            <span className="topbar-notification-item-time">{notification.timestamp}</span>
                          </div>
                          <p className="topbar-notification-item-title">{notification.title}</p>
                          <p className="topbar-notification-item-desc">{notification.description}</p>
                        </div>
                        <div className="topbar-notification-item-indicator">
                          {notification.read ? (
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
