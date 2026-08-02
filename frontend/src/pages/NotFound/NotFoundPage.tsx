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
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import './NotFoundPage.css';

export const NotFoundPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="not-found-page">
      {/* ── Animated 404 Code ── */}
      <div className="not-found-glitch-wrapper">
        <div className="not-found-code">404</div>
      </div>

      {/* ── Icon Ring ── */}
      <div className="not-found-icon-ring">
        <Compass size={32} className="text-muted" />
      </div>

      {/* ── Text Content ── */}
      <div className="not-found-text-block">
        <h2>Route Not Found in Knowledge Base</h2>
        <p>
           The requested URL does not match any registered route in the UNIFY-AI application router.
          This may be a mistyped URL, an expired link, or a route that requires different
          permissions.
        </p>
      </div>

      {/* ── Primary Actions ── */}
      <div className="not-found-actions">
        <Button variant="primary" size="lg" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} className="mr-1" />
          Go Back
        </Button>

        <Button
          variant="ghost"
          size="lg"
          onClick={() => navigate(isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN)}
        >
          <Home size={18} className="mr-1" />
          {isAuthenticated ? 'Dashboard' : 'Login'}
        </Button>
      </div>

      {/* ── Quick Navigation Suggestions ── */}
      {isAuthenticated && (
        <div className="not-found-suggestions">
          <span className="suggestions-label">Quick Navigation</span>

          <div className="suggestions-grid">
            <div className="suggestion-card" onClick={() => navigate(ROUTES.CHAT)}>
              <MessageSquare size={18} className="suggestion-icon text-muted" />
              <span>AI Assistant</span>
            </div>

            <div className="suggestion-card" onClick={() => navigate(ROUTES.SEARCH)}>
              <Search size={18} className="suggestion-icon text-muted" />
              <span>Vector Search</span>
            </div>

            <div className="suggestion-card" onClick={() => navigate(ROUTES.INTEGRATIONS)}>
              <Plug size={18} className="suggestion-icon text-muted" />
              <span>Integrations</span>
            </div>

            {user?.role === 'admin' && (
              <div className="suggestion-card" onClick={() => navigate(ROUTES.ADMIN)}>
                <ShieldCheck size={18} className="suggestion-icon text-muted" />
                <span>Admin Panel</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotFoundPage;
