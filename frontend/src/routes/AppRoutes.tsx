import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ROUTES } from '@/constants/routes';

// ── Page-level code splitting (each page bundle is loaded on demand) ──
const LoginPage    = lazy(() => import('@/pages/Login/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/Register/RegisterPage'));
const DashboardPage = lazy(() => import('@/pages/Dashboard/DashboardPage'));
const ChatPage      = lazy(() => import('@/pages/Chat/ChatPage'));
const SearchPage       = lazy(() => import('@/pages/Search/SearchPage'));
const IntegrationsPage = lazy(() => import('@/pages/Integrations/IntegrationsPage'));
const ProfilePage      = lazy(() => import('@/pages/Profile/ProfilePage'));
const AdminPage        = lazy(() => import('@/pages/Admin/AdminPage'));
const MeetingPage      = lazy(() => import('@/pages/Meeting/MeetingPage'));
const WorkflowPage     = lazy(() => import('@/pages/Workflow/WorkflowPage'));
const NotFoundPage     = lazy(() => import('@/pages/NotFound/NotFoundPage'));

// Full-screen loading fallback used by Suspense during lazy chunk loading
const PageLoader = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Spinner size="lg" />
  </div>
);

export const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ── Public Routes (no auth required) ── */}
        <Route path={ROUTES.LOGIN}    element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />

        {/* ── Protected Main Application Routes ── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path={ROUTES.ROOT}         element={<Navigate to={ROUTES.DASHBOARD} replace />} />
            <Route path={ROUTES.DASHBOARD}    element={<DashboardPage />} />
            <Route path={ROUTES.CHAT}         element={<ChatPage />} />
            <Route path={ROUTES.SEARCH}       element={<SearchPage />} />
            <Route path={ROUTES.INTEGRATIONS} element={<IntegrationsPage />} />
            <Route path={ROUTES.PROFILE}      element={<ProfilePage />} />
            <Route path={ROUTES.MEETING}      element={<MeetingPage />} />
            <Route path={ROUTES.WORKFLOW}     element={<ErrorBoundary><WorkflowPage /></ErrorBoundary>} />
          </Route>
        </Route>

        {/* ── Admin-Only Routes (auth + admin role required) ── */}
        <Route element={<AdminRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path={ROUTES.ADMIN} element={<AdminPage />} />
          </Route>
        </Route>

        {/* ── Catch-all ── */}
        <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};
