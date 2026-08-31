import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Home,
  ArrowLeft,
  MessageSquare,
  Search,
  Plug,
  ShieldCheck,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { staggerContainer, staggerItem } from '@/lib/motion';
import './NotFoundPage.css';

export const NotFoundPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  return (
    <motion.div className="not-found-page" variants={staggerContainer}>
      {/* ── Animated 404 Code ── */}
      <motion.div className="not-found-glitch-wrapper" variants={staggerItem}>
        <div className="not-found-code">404</div>
      </motion.div>

      {/* ── Icon Ring ── */}
      <motion.div className="not-found-icon-ring" variants={staggerItem}>
        <Compass size={32} className="text-muted" />
      </motion.div>

      {/* ── Text Content ── */}
      <motion.div className="not-found-text-block" variants={staggerItem}>
        <h2>Route Not Found in Knowledge Base</h2>
        <p>
          The requested URL does not match any registered route in the UnifyAI application router.
          This may be a mistyped URL, an expired link, or a route that requires different
          permissions.
        </p>

      </motion.div>

      {/* ── Primary Actions ── */}
      <motion.div className="not-found-actions" variants={staggerItem}>
        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
          <Button variant="primary" size="lg" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} className="mr-1" />
            Go Back
          </Button>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => navigate(isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN)}
          >
            <Home size={18} className="mr-1" />
            {isAuthenticated ? 'Dashboard' : 'Login'}
          </Button>
        </motion.div>
      </motion.div>

      {/* ── Quick Navigation Suggestions ── */}
      {isAuthenticated && (
        <motion.div className="not-found-suggestions" variants={staggerItem}>
          <motion.span className="suggestions-label" variants={staggerItem}>Quick Navigation</motion.span>

          <motion.div className="suggestions-grid" variants={staggerContainer}>
            {[
              { icon: MessageSquare, label: 'AI Assistant', route: ROUTES.CHAT },
              { icon: Search, label: 'Vector Search', route: ROUTES.SEARCH },
              { icon: Plug, label: 'Integrations', route: ROUTES.INTEGRATIONS },
              ...((user?.role === 'admin' || user?.role === 'manager') ? [{ icon: ShieldCheck, label: 'Admin Panel', route: ROUTES.ADMIN }] : []),
            ].map((suggestion) => (
              <motion.div
                key={suggestion.route}
                className="suggestion-card"
                variants={staggerItem}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(suggestion.route)}
              >
                <suggestion.icon size={18} className="suggestion-icon text-muted" />
                <span>{suggestion.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default NotFoundPage;
