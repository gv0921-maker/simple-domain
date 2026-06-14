import { useRoleCheck } from '@/hooks/auth/useRoleCheck';

/**
 * @deprecated Use `useRoleCheck()` directly. Retained as a thin wrapper so
 * existing call sites keep working: `isAdmin` here means
 * `admin OR super_admin` (matches the historical semantic).
 */
export function useIsSuperAdmin() {
  const { isAdminOrSuper, loading } = useRoleCheck();
  return { isAdmin: isAdminOrSuper, loading };
}