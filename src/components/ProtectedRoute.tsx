import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessRoute } from '@/lib/services/settings';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user || !canAccessRoute(user.id, location.pathname)) {
    return (
      <Navigate
        to="/"
        replace
        state={{ accessDenied: true, deniedPath: location.pathname }}
      />
    );
  }

  return <>{children}</>;
}
