// Settings/RBAC async service layer backed by Supabase.
import { supabase } from '@/integrations/supabase/client';
import type {
  Role,
  Permission,
  PermissionLevel,
  RecordScope,
  AuditLog,
} from '@/lib/data/rbac';

export interface UserRoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  assignedAt: string;
  assignedBy?: string | null;
}

// ---------- Mappers ----------
function mapRoleRow(row: any, permRows: any[]): Role {
  const permissions: Permission[] = permRows
    .filter((p) => p.role_id === row.id)
    .map((p) => ({
      module: p.module,
      level: p.level as PermissionLevel,
      scope: (p.scope ?? 'all') as RecordScope,
      canImport: !!p.can_import,
      canExport: !!p.can_export,
      canPrint: true,
    }));
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    isSystem: !!row.is_system,
    permissions,
    tabPermissions: [],
    inheritsFrom: (row.inherits_from ?? []) as string[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAuditRow(row: any): AuditLog {
  return {
    id: row.id,
    userId: row.user_id ?? '',
    userName: row.user_name ?? 'System',
    action: row.action as AuditLog['action'],
    resource: row.resource,
    resourceId: row.resource_id ?? undefined,
    details: row.details ?? '',
    ipAddress: row.ip_address ?? undefined,
    timestamp: row.created_at,
  };
}

// ---------- Roles ----------
export async function fetchRolesWithPermissions(): Promise<Role[]> {
  const [{ data: roleRows, error: rerr }, { data: permRows, error: perr }] = await Promise.all([
    supabase.from('app_roles').select('*').order('is_system', { ascending: false }).order('name'),
    supabase.from('app_role_permissions').select('*'),
  ]);
  if (rerr) throw rerr;
  if (perr) throw perr;
  return (roleRows ?? []).map((r) => mapRoleRow(r, permRows ?? []));
}

export async function createRoleApi(input: {
  name: string;
  description?: string;
  permissions: Permission[];
  inheritsFrom?: string[];
}): Promise<Role> {
  const { data: role, error } = await supabase
    .from('app_roles')
    .insert({
      name: input.name,
      description: input.description ?? '',
      is_system: false,
      inherits_from: input.inheritsFrom ?? [],
    })
    .select()
    .single();
  if (error) throw error;

  if (input.permissions.length) {
    const rows = input.permissions
      .filter((p) => p.level !== 'none')
      .map((p) => ({
        role_id: role.id,
        module: p.module,
        level: p.level,
        scope: p.scope === 'department' ? 'all' : (p.scope ?? 'all'),
        can_import: !!p.canImport,
        can_export: !!p.canExport,
      }));
    if (rows.length) {
      const { error: pErr } = await supabase.from('app_role_permissions').insert(rows);
      if (pErr) throw pErr;
    }
  }
  return (await fetchRolesWithPermissions()).find((r) => r.id === role.id)!;
}

export async function updateRoleApi(role: Role): Promise<Role> {
  const { error } = await supabase
    .from('app_roles')
    .update({
      name: role.name,
      description: role.description,
      inherits_from: role.inheritsFrom ?? [],
    })
    .eq('id', role.id);
  if (error) throw error;

  // Replace permissions
  const { error: delErr } = await supabase
    .from('app_role_permissions')
    .delete()
    .eq('role_id', role.id);
  if (delErr) throw delErr;

  const rows = role.permissions
    .filter((p) => p.level !== 'none')
    .map((p) => ({
      role_id: role.id,
      module: p.module,
      level: p.level,
      scope: p.scope === 'department' ? 'all' : (p.scope ?? 'all'),
      can_import: !!p.canImport,
      can_export: !!p.canExport,
    }));
  if (rows.length) {
    const { error: insErr } = await supabase.from('app_role_permissions').insert(rows);
    if (insErr) throw insErr;
  }
  return (await fetchRolesWithPermissions()).find((r) => r.id === role.id)!;
}

export async function deleteRoleApi(id: string): Promise<void> {
  const { error } = await supabase.from('app_roles').delete().eq('id', id);
  if (error) throw error;
}

// ---------- User role assignments ----------
export async function fetchUserRoleAssignments(): Promise<UserRoleAssignment[]> {
  const { data, error } = await supabase
    .from('app_user_role_assignments')
    .select('*');
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    roleId: row.role_id,
    assignedAt: row.assigned_at,
    assignedBy: row.assigned_by,
  }));
}

export async function setUserRoleAssignments(
  userId: string,
  roleIds: string[],
  assignedBy?: string
): Promise<void> {
  // Only operate when userId looks like a real auth uuid
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return;

  const { error: delErr } = await supabase
    .from('app_user_role_assignments')
    .delete()
    .eq('user_id', userId);
  if (delErr) throw delErr;

  if (!roleIds.length) return;
  const validRoleIds = roleIds.filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  if (!validRoleIds.length) return;

  const rows = validRoleIds.map((rid) => ({
    user_id: userId,
    role_id: rid,
    assigned_by: assignedBy ?? null,
  }));
  const { error: insErr } = await supabase.from('app_user_role_assignments').insert(rows);
  if (insErr) throw insErr;
}

// ---------- Audit logs ----------
export async function fetchAuditLogs(limit = 500): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('app_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapAuditRow);
}

export async function insertAuditLogApi(entry: {
  userId?: string;
  userName?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
}): Promise<void> {
  const { error } = await supabase.from('app_audit_logs').insert({
    user_id: entry.userId ?? null,
    user_name: entry.userName ?? null,
    action: entry.action,
    resource: entry.resource,
    resource_id: entry.resourceId ?? null,
    details: entry.details ?? null,
    ip_address: entry.ipAddress ?? null,
  });
  if (error) throw error;
}