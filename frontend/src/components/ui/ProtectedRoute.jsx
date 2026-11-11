import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { PageLoader } from '@/components/ui/LoadingSpinner';

/** roles: who may open the pages below, e.g. ['admin', 'superadmin']. */
export default function ProtectedRoute({ roles }) {
  const { isAuthenticated, user, sessionChecked } = useAuthStore();
  const location = useLocation();

  if (!sessionChecked) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
