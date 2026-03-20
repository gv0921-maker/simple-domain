import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessRoute } from '@/lib/data/rbac';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/select-user" state={{ from: location }} replace />;
  }

  if (!user || !canAccessRoute(user.id, location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
