import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';

const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === 'true';

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (BYPASS_AUTH || isAuthenticated) {
    return <Outlet />;
  }

  return <Navigate to="/login" replace />;
};
