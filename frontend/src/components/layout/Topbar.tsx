import {
  Menu,
  Moon,
  Sun,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useTheme } from '@/hooks/useTheme';
import { iconHoverVariants } from '@/lib/motion';
import './layout.css';





interface TopbarProps {
  isCollapsed: boolean;
  onToggleMobile: () => void;
}

export const Topbar = ({ isCollapsed, onToggleMobile }: TopbarProps) => {
  const { theme, toggleTheme } = useTheme();

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
          {theme === 'dark' ? (
            <Moon size={18} aria-hidden="true" />
          ) : (
            <Sun size={18} aria-hidden="true" />
          )}
        </motion.button>
      </div>
    </header>
  );
};