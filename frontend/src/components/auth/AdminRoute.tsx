import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === 'true';

export const AdminRoute = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    if (!isLoading && isAuthenticated && !isManagerOrAdmin && !BYPASS_AUTH) {
      toast.error("You don't have permission to access this page.");
    }
  }, [isLoading, isAuthenticated, isManagerOrAdmin]);

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isManagerOrAdmin && !BYPASS_AUTH) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
