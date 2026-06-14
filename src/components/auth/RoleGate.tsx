import type { ReactNode } from 'react';
import { useRoleCheck, type RoleCheck } from '@/hooks/auth/useRoleCheck';

type Capability = {
  [K in keyof RoleCheck]: RoleCheck[K] extends boolean ? K : never
}[keyof RoleCheck];

interface RoleGateProps {
  roles?: string[];        // any of these
  superAdmin?: boolean;    // shorthand for super_admin only
  adminOrSuper?: boolean;  // shorthand for admin or super_admin
  capability?: Capability; // higher-level capability flag from useRoleCheck
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component-level RBAC gate. Hides children unless the current user satisfies
 * the supplied role/capability check. Returns `fallback` (default null) when
 * denied. Renders nothing while role data is still loading to avoid a flash
 * of admin UI for non-admin users.
 */
export function RoleGate({
  roles, superAdmin, adminOrSuper, capability, children, fallback = null,
}: RoleGateProps) {
  const check = useRoleCheck();
  if (check.loading) return null;

  let allowed = true;
  if (superAdmin) allowed = allowed && check.isSuperAdmin;
  if (adminOrSuper) allowed = allowed && check.isAdminOrSuper;
  if (roles && roles.length) allowed = allowed && check.hasAnyRole(roles);
  if (capability) allowed = allowed && Boolean(check[capability]);

  return <>{allowed ? children : fallback}</>;
}