import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchRolesWithPermissions,
  createRoleApi,
  updateRoleApi,
  deleteRoleApi,
  fetchUserRoleAssignments,
  setUserRoleAssignments,
  fetchAuditLogs,
  insertAuditLogApi,
  type UserRoleAssignment,
} from '@/lib/services/settings/api';
import type { Role, AuditLog } from '@/lib/data/rbac';
import { hydrateRbacFromSupabase } from '@/lib/data/rbac';

const ROLES_KEY = ['settings', 'roles'] as const;
const ASSIGNMENTS_KEY = ['settings', 'user-role-assignments'] as const;
const AUDIT_KEY = ['settings', 'audit-logs'] as const;

export function useRoles() {
  return useQuery<Role[]>({
    queryKey: ROLES_KEY,
    queryFn: fetchRolesWithPermissions,
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createRoleApi,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ROLES_KEY });
      await hydrateRbacFromSupabase();
    },
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateRoleApi,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ROLES_KEY });
      await hydrateRbacFromSupabase();
    },
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteRoleApi,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ROLES_KEY });
      await hydrateRbacFromSupabase();
    },
  });
}

export function useUserRoleAssignments() {
  return useQuery<UserRoleAssignment[]>({
    queryKey: ASSIGNMENTS_KEY,
    queryFn: fetchUserRoleAssignments,
  });
}

export function useSetUserRoleAssignments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { userId: string; roleIds: string[]; assignedBy?: string }) =>
      setUserRoleAssignments(vars.userId, vars.roleIds, vars.assignedBy),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ASSIGNMENTS_KEY });
      await hydrateRbacFromSupabase();
    },
  });
}

export function useAuditLogs(limit = 500) {
  return useQuery<AuditLog[]>({
    queryKey: [...AUDIT_KEY, limit],
    queryFn: () => fetchAuditLogs(limit),
  });
}

export function useInsertAuditLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: insertAuditLogApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: AUDIT_KEY }),
  });
}