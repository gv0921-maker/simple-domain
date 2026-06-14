import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRoleCheck } from '@/hooks/auth/useRoleCheck';
import { useToast } from '@/hooks/use-toast';

interface RouteGuardProps {
  children: ReactNode;
  requiredRoles?: string[];   // any of these grants access
  superAdmin?: boolean;       // shorthand
  adminOrSuper?: boolean;     // shorthand
  redirectTo?: string;        // default '/'
  denyMessage?: string;
}

/**
 * Route-level RBAC guard. Redirects to `redirectTo` (default '/') with a
 * toast when the user doesn't satisfy the required roles. Always enforces
 * authentication.
 */
export function RouteGuard({
  children, requiredRoles, superAdmin, adminOrSuper,
  redirectTo = '/', denyMessage,
}: RouteGuardProps) {
  const { isAuthenticated } = useAuth();
  const check = useRoleCheck();
  const location = useLocation();
  const { toast } = useToast();

  const denied =
    !check.loading && isAuthenticated && (
      (superAdmin && !check.isSuperAdmin) ||
      (adminOrSuper && !check.isAdminOrSuper) ||
      (requiredRoles && requiredRoles.length > 0 && !check.hasAnyRole(requiredRoles))
    );

  useEffect(() => {
    if (denied) {
      toast({
        title: 'Access denied',
        description: denyMessage ?? 'You do not have permission to view this page.',
        variant: 'destructive',
      });
    }
  }, [denied, denyMessage, toast]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (check.loading) return null;
  if (denied) {
    return <Navigate to={redirectTo} replace state={{ accessDenied: true, deniedPath: location.pathname }} />;
  }
  return <>{children}</>;
}