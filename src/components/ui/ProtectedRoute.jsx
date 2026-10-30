import { Navigate, Outlet } from 'react-router';
import { useAuthStore } from '@/stores/useAuthStore';

export default function ProtectedRoute({ role }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role !== role) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
