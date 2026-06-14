import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessRoute } from '@/lib/services/settings';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, user, authReady } = useAuth();
  const location = useLocation();

  // Wait until the initial session probe + RBAC hydration complete before
  // making any auth/permission decision. Without this guard, the very first
  // render redirects to /login (and a permission check would run against an
  // empty RBAC cache).
  if (!authReady) {
    return (
      <div className="flex items-center justify-center min-h-screen text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

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
