import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Canonical role-check hook. Reads `user_roles` for the current user and
 * exposes structured capability booleans aligned with docs/RBAC_MATRIX.md.
 *
 * Prefer this over ad-hoc patterns (raw queries, `user.role === ...`, etc.).
 * `useIsSuperAdmin` is retained as a thin wrapper for backwards compat.
 */
export function useRoleCheck() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user) { setRoles([]); setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from('user_roles' as any)
        .select('role')
        .eq('user_id', user.id);
      if (!cancelled) {
        setRoles(((data ?? []) as any[]).map(r => r.role));
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const has = (r: string) => roles.includes(r);
  const hasAny = (rs: string[]) => rs.some(r => roles.includes(r));

  const isSuperAdmin = has('super_admin');
  const isAdminOrSuper = hasAny(['admin', 'super_admin']);
  const isAdminOrHR = hasAny(['admin', 'super_admin', 'hr_manager']);
  const isFactoryIncharge = has('factory_incharge');

  return {
    roles,
    loading,
    hasRole: has,
    hasAnyRole: hasAny,
    isSuperAdmin,
    isAdminOrSuper,
    isAdminOrHR,
    isFactoryIncharge,
    // Capability map — single source of truth for UI gating.
    canAccessPayroll: isSuperAdmin,
    canAccessAppraisals: isSuperAdmin,
    canAccessAuditLogs: isSuperAdmin,
    canManageSettings: isAdminOrSuper,
    canManagePayrollSettings: isSuperAdmin,
    canManageCompanySettings: isSuperAdmin,
    canManageNumbering: isSuperAdmin,
    canManageHolidays: isSuperAdmin,
    canManageWorkSchedules: isSuperAdmin,
    canManagePaymentAccounts: isSuperAdmin,
    canManageVendors: isAdminOrSuper,
    canAccessShopFloor: isFactoryIncharge || isAdminOrSuper,
    canApproveLeave: isAdminOrSuper || hasAny(['hr_manager']),
    canVoidInvoice: isSuperAdmin,
    canVoidCreditNote: isSuperAdmin,
    canProcessRefund: isSuperAdmin,
    canApproveReturn: isSuperAdmin,
    canApproveWriteOff: isSuperAdmin,
    canApproveSkipStockCount: isSuperAdmin,
    canOverrideAdvanceGate: isAdminOrSuper,
  };
}

export type RoleCheck = ReturnType<typeof useRoleCheck>;