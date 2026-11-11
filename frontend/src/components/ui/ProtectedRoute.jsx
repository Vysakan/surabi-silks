import { Navigate, Outlet } from 'react-router';
import { useAuthStore } from '@/stores/useAuthStore';

export default function ProtectedRoute({ role }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const hasRole = !role || user?.role === role || (role === 'admin' && user?.role === 'root_admin');
  if (!hasRole) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
