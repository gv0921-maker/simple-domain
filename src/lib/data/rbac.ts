// Role-Based Access Control data management.
//
// This module preserves a SYNCHRONOUS read API (hasPermission, isSuperAdminUser,
// getRoles, canAccessRoute, etc.) used by guards and hooks throughout the app.
// Data is sourced from Supabase via hydrateRbacFromSupabase()/bootstrapRbac()
// and kept in an in-memory cache. Mutations (saveRole, deleteRole, setUserRoles,
// addAuditLog) update the cache immediately and write through to Supabase in the
// background.

import { getModuleTabIds, getModuleTabs } from './moduleTabs';
import { supabase } from '@/integrations/supabase/client';

export type PermissionLevel = 'none' | 'view' | 'create' | 'edit' | 'delete' | 'admin';
export type RecordScope = 'own' | 'team' | 'department' | 'all';

export interface TabPermission {
  moduleId: string;
  allowedTabs: string[]; // Tab IDs that are allowed, empty = all allowed
}

export interface Permission {
  module: string;
  level: PermissionLevel;
  scope: RecordScope;
  teamId?: string; // optional team scoping when scope='team'
  canImport?: boolean;
  canExport?: boolean;
  canPrint?: boolean;
  // Granular CRM action toggles
  canModifyPipeline?: boolean;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean; // System roles can't be deleted
  permissions: Permission[];
  tabPermissions?: TabPermission[]; // Tab-level permissions per module
  inheritsFrom?: string[]; // Role IDs this role inherits from
  createdAt: string;
  updatedAt: string;
}

export interface UserRole {
  userId: string;
  roleIds: string[];
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'permission_change';
  resource: string;
  resourceId?: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

// All available modules
export const MODULES = [
  'inventory',
  'manufacturing',
  'sales',
  'crm',
  'accounting',
  'hr',
  'projects',
  'discuss',
  'pos',
  'settings',
  'users',
  'reports',
] as const;

export type ModuleName = typeof MODULES[number];

const ROUTE_MODULE_PREFIXES: Array<{ prefix: string; module: ModuleName }> = [
  { prefix: '/inventory', module: 'inventory' },
  { prefix: '/barcode', module: 'inventory' },
  { prefix: '/sales', module: 'sales' },
  { prefix: '/crm', module: 'crm' },
  { prefix: '/manufacturing', module: 'manufacturing' },
  { prefix: '/shop-floor', module: 'manufacturing' },
  { prefix: '/accounting', module: 'accounting' },
  { prefix: '/invoicing', module: 'accounting' },
  { prefix: '/employees', module: 'hr' },
  { prefix: '/attendance', module: 'hr' },
  { prefix: '/leave', module: 'hr' },
  { prefix: '/payroll', module: 'hr' },
  { prefix: '/appraisals', module: 'hr' },
  { prefix: '/discuss', module: 'discuss' },
  { prefix: '/chat', module: 'discuss' },
  { prefix: '/projects', module: 'projects' },
  { prefix: '/pos', module: 'pos' },
  { prefix: '/settings', module: 'settings' },
  { prefix: '/reports', module: 'reports' },
  { prefix: '/dashboards', module: 'reports' },
];

const ROUTE_PERMISSION_OVERRIDES: Array<{ pattern: RegExp; level: PermissionLevel }> = [
  { pattern: /^\/sales\/orders\/(?!new$)[^/]+$/, level: 'edit' },
  { pattern: /^\/sales\/quotations\/(?!new$)[^/]+$/, level: 'edit' },
  { pattern: /^\/settings\/studio$/, level: 'admin' },
];

function normalizePathname(pathname: string): string {
  if (!pathname) return '/';
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
}

export function getModuleForPath(pathname: string): ModuleName | null {
  const normalized = normalizePathname(pathname);
  const match = ROUTE_MODULE_PREFIXES.find(
    ({ prefix }) => normalized === prefix || normalized.startsWith(`${prefix}/`)
  );
  return match?.module ?? null;
}

export function getRequiredPermissionForPath(pathname: string): PermissionLevel {
  const normalized = normalizePathname(pathname);

  const explicitRule = ROUTE_PERMISSION_OVERRIDES.find(({ pattern }) => pattern.test(normalized));
  if (explicitRule) return explicitRule.level;

  if (/\/new(\/|$)/.test(normalized)) return 'create';
  if (/\/edit(\/|$)/.test(normalized)) return 'edit';
  return 'view';
}

function getTabFromPath(moduleId: string, pathname: string): string | null {
  const normalized = normalizePathname(pathname);

  // Route aliases for pages that map to an existing tab but do not share its base href
  if (moduleId === 'inventory' && (normalized.startsWith('/inventory/transfers') || normalized.startsWith('/barcode'))) {
    return 'operations';
  }

  if (moduleId === 'crm' && normalized.startsWith('/crm/opportunities')) {
    return 'opportunities';
  }

  const tabs = getModuleTabs(moduleId);
  if (tabs.length === 0) return null;

  const matchedTab = tabs
    .filter((tab) => {
      const tabHref = normalizePathname(tab.href);
      return normalized === tabHref || normalized.startsWith(`${tabHref}/`);
    })
    .sort((a, b) => b.href.length - a.href.length)[0];

  return matchedTab?.id ?? null;
}

function hasExplicitTabRestriction(userId: string, moduleId: string): boolean {
  return getUserTabPermissions(userId).some((tp) => tp.moduleId === moduleId);
}

export function canAccessRoute(userId: string, pathname: string): boolean {
  const normalized = normalizePathname(pathname);

  if (normalized === '/') return true;

  const moduleId = getModuleForPath(normalized);
  if (!moduleId) return false;

  const requiredLevel = getRequiredPermissionForPath(normalized);
  if (!hasPermission(userId, moduleId, requiredLevel)) return false;

  const tabId = getTabFromPath(moduleId, normalized);
  if (!tabId) {
    const moduleTabIds = getModuleTabIds(moduleId);
    if (moduleTabIds.length === 0) return true;

    // If a role explicitly restricts tabs for this module, unmapped routes are denied
    // to prevent bypassing tab restrictions via alternate URLs.
    if (hasExplicitTabRestriction(userId, moduleId)) return false;

    return true;
  }

  return hasTabAccess(userId, moduleId, tabId);
}

// Default roles used as a fallback BEFORE Supabase hydration completes.
const DEFAULT_ROLES: Role[] = [
  {
    id: 'super_admin',
    name: 'Super Admin',
    description: 'Full system access with all permissions',
    isSystem: true,
    permissions: MODULES.map((m) => ({ module: m, level: 'admin' as PermissionLevel, scope: 'all' as RecordScope, canImport: true, canExport: true, canPrint: true })),
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Administrative access to most modules',
    isSystem: true,
    permissions: MODULES.filter((m) => m !== 'settings').map((m) => ({ module: m, level: 'admin' as PermissionLevel, scope: 'all' as RecordScope, canImport: true, canExport: true, canPrint: true })),
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'sales_manager',
    name: 'Sales Manager',
    description: 'Manage sales team and CRM',
    isSystem: true,
    permissions: [
      { module: 'sales', level: 'admin', scope: 'all', canImport: true, canExport: true, canPrint: true },
      { module: 'crm', level: 'admin', scope: 'all', canImport: true, canExport: true, canPrint: true },
      { module: 'inventory', level: 'view', scope: 'all', canExport: true, canPrint: true },
      { module: 'reports', level: 'view', scope: 'department', canExport: true, canPrint: true },
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'sales_rep',
    name: 'Sales Representative',
    description: 'Handle leads and opportunities',
    isSystem: true,
    permissions: [
      { module: 'sales', level: 'edit', scope: 'own' },
      { module: 'crm', level: 'edit', scope: 'own' },
      { module: 'inventory', level: 'view', scope: 'all' },
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'warehouse_operator',
    name: 'Warehouse Operator',
    description: 'Manage inventory operations',
    isSystem: true,
    permissions: [
      { module: 'inventory', level: 'edit', scope: 'all' },
      { module: 'manufacturing', level: 'view', scope: 'all' },
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'accountant',
    name: 'Accountant',
    description: 'Handle financial operations',
    isSystem: true,
    permissions: [
      { module: 'accounting', level: 'admin', scope: 'all' },
      { module: 'sales', level: 'view', scope: 'all' },
      { module: 'inventory', level: 'view', scope: 'all' },
      { module: 'reports', level: 'view', scope: 'all' },
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'hr_manager',
    name: 'HR Manager',
    description: 'Manage employee records',
    isSystem: true,
    permissions: [
      { module: 'hr', level: 'admin', scope: 'all' },
      { module: 'reports', level: 'view', scope: 'department' },
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'pos_operator',
    name: 'POS Operator',
    description: 'Point of sale operations',
    isSystem: true,
    permissions: [
      { module: 'pos', level: 'edit', scope: 'own' },
      { module: 'inventory', level: 'view', scope: 'all' },
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'read_only',
    name: 'Read-Only User',
    description: 'View-only access to allowed modules',
    isSystem: true,
    permissions: MODULES.map((m) => ({ module: m, level: 'view' as PermissionLevel, scope: 'all' as RecordScope, canExport: false, canImport: false, canPrint: true })),
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

// =========================================================================
// In-memory cache. Hydrated from Supabase on app boot via bootstrapRbac().
// =========================================================================
let _rolesCache: Role[] = [...DEFAULT_ROLES];
let _userRolesCache: UserRole[] = [];
let _auditCache: AuditLog[] = [];
let _hydrated = false;

export function isRbacHydrated(): boolean {
  return _hydrated;
}

// Map a Supabase app_roles row + permissions into a Role.
function rowToRole(row: any, permRows: any[]): Role {
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

export async function hydrateRbacFromSupabase(): Promise<void> {
  try {
    const [rolesRes, permsRes, assignsRes, auditRes] = await Promise.all([
      supabase.from('app_roles').select('*'),
      supabase.from('app_role_permissions').select('*'),
      supabase.from('app_user_role_assignments').select('*'),
      supabase.from('app_audit_logs').select('*').order('created_at', { ascending: false }).limit(500),
    ]);
    if (rolesRes.error) throw rolesRes.error;
    if (permsRes.error) throw permsRes.error;
    if (assignsRes.error) throw assignsRes.error;

    _rolesCache = (rolesRes.data ?? []).map((r) => rowToRole(r, permsRes.data ?? []));

    // Group assignments per user
    const byUser = new Map<string, string[]>();
    for (const a of assignsRes.data ?? []) {
      const arr = byUser.get(a.user_id) ?? [];
      arr.push(a.role_id);
      byUser.set(a.user_id, arr);
    }
    _userRolesCache = Array.from(byUser.entries()).map(([userId, roleIds]) => ({ userId, roleIds }));

    if (!auditRes.error && auditRes.data) {
      _auditCache = auditRes.data.map((row: any) => ({
        id: row.id,
        userId: row.user_id ?? '',
        userName: row.user_name ?? 'System',
        action: row.action as AuditLog['action'],
        resource: row.resource,
        resourceId: row.resource_id ?? undefined,
        details: row.details ?? '',
        ipAddress: row.ip_address ?? undefined,
        timestamp: row.created_at,
      }));
    }

    _hydrated = true;
  } catch (e) {
    // Keep defaults if hydration fails (e.g. unauthenticated)
    console.warn('[rbac] hydration failed:', e);
  }
}

/** Convenience: call once after a user logs in. */
export async function bootstrapRbac(_userId?: string): Promise<void> {
  await hydrateRbacFromSupabase();
}

// =========================================================================
// Sync read API (cache-backed)
// =========================================================================
export function getRoles(): Role[] {
  return [..._rolesCache];
}

export function getRole(id: string): Role | undefined {
  return _rolesCache.find((r) => r.id === id);
}

function isUuid(s: string): boolean {
  return /^[0-9a-f-]{36}$/i.test(s);
}

/**
 * Persist a role. Updates cache immediately, then write-through to Supabase
 * in the background. Returns nothing (sync) to preserve the legacy contract.
 */
export function saveRole(role: Role): void {
  const isNew = !isUuid(role.id) || !_rolesCache.some((r) => r.id === role.id);
  const now = new Date().toISOString();

  if (isNew) {
    const newId = isUuid(role.id) ? role.id : crypto.randomUUID();
    const created: Role = { ...role, id: newId, createdAt: now, updatedAt: now };
    _rolesCache = [..._rolesCache, created];

    // Background insert
    void (async () => {
      try {
        const { data, error } = await supabase
          .from('app_roles')
          .insert({
            id: newId,
            name: role.name,
            description: role.description ?? '',
            is_system: false,
            inherits_from: role.inheritsFrom ?? [],
          })
          .select()
          .single();
        if (error) throw error;
        if (role.permissions.length) {
          const rows = role.permissions
            .filter((p) => p.level !== 'none')
            .map((p) => ({
              role_id: data.id,
              module: p.module,
              level: p.level,
              scope: p.scope === 'department' ? 'all' : (p.scope ?? 'all'),
              can_import: !!p.canImport,
              can_export: !!p.canExport,
            }));
          if (rows.length) {
            await supabase.from('app_role_permissions').insert(rows);
          }
        }
      } catch (e) {
        console.warn('[rbac] saveRole insert failed:', e);
      }
    })();
  } else {
    _rolesCache = _rolesCache.map((r) => (r.id === role.id ? { ...role, updatedAt: now } : r));

    // Background update + replace permissions
    void (async () => {
      try {
        await supabase
          .from('app_roles')
          .update({
            name: role.name,
            description: role.description ?? '',
            inherits_from: role.inheritsFrom ?? [],
          })
          .eq('id', role.id);
        await supabase.from('app_role_permissions').delete().eq('role_id', role.id);
        if (role.permissions.length) {
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
            await supabase.from('app_role_permissions').insert(rows);
          }
        }
      } catch (e) {
        console.warn('[rbac] saveRole update failed:', e);
      }
    })();
  }
}

export function deleteRole(id: string): boolean {
  const role = getRole(id);
  if (role?.isSystem) return false;
  _rolesCache = _rolesCache.filter((r) => r.id !== id);
  if (isUuid(id)) {
    void supabase.from('app_roles').delete().eq('id', id).then(({ error }) => {
      if (error) console.warn('[rbac] deleteRole failed:', error);
    });
  }
  return true;
}

export function getUserRoles(): UserRole[] {
  return _userRolesCache.map((ur) => ({ userId: ur.userId, roleIds: [...ur.roleIds] }));
}

export function getUserRole(userId: string): UserRole | undefined {
  const found = _userRolesCache.find((ur) => ur.userId === userId);
  return found ? { userId: found.userId, roleIds: [...found.roleIds] } : undefined;
}

export function setUserRoles(userId: string, roleIds: string[]): void {
  // Update cache immediately
  const existing = _userRolesCache.findIndex((ur) => ur.userId === userId);
  if (existing >= 0) {
    _userRolesCache[existing] = { userId, roleIds: [...roleIds] };
  } else {
    _userRolesCache = [..._userRolesCache, { userId, roleIds: [...roleIds] }];
  }

  // Persist only for real auth uuids and uuid role ids
  if (!isUuid(userId)) return;
  const validRoleIds = roleIds.filter(isUuid);

  void (async () => {
    try {
      await supabase.from('app_user_role_assignments').delete().eq('user_id', userId);
      if (validRoleIds.length) {
        await supabase.from('app_user_role_assignments').insert(
          validRoleIds.map((rid) => ({ user_id: userId, role_id: rid }))
        );
      }
    } catch (e) {
      console.warn('[rbac] setUserRoles failed:', e);
    }
  })();
}

export function isSuperAdminUser(userId: string): boolean {
  const userRole = getUserRole(userId);
  if (!userRole) return false;
  // Match against new system role names AND legacy enum-style ids
  if (userRole.roleIds.includes('super_admin')) return true;
  return userRole.roleIds.some((rid) => {
    const role = getRole(rid);
    return role?.name === 'Super Admin';
  });
}

// Permission checking
export function getUserPermissions(userId: string): Permission[] {
  const userRole = getUserRole(userId);
  if (!userRole) return [];

  const permissions: Permission[] = [];
  const processedRoles = new Set<string>();

  function processRole(roleId: string) {
    if (processedRoles.has(roleId)) return;
    processedRoles.add(roleId);

    const role = getRole(roleId);
    if (!role) return;

    // Process inherited roles first
    role.inheritsFrom?.forEach(processRole);

    // Add this role's permissions
    role.permissions.forEach((p) => {
      const existing = permissions.find((ep) => ep.module === p.module);
      if (!existing || getPermissionWeight(p.level) > getPermissionWeight(existing.level)) {
        if (existing) {
          existing.level = p.level;
          existing.scope = p.scope;
          // Merge additional permissions (union - if any role grants it, it's granted)
          existing.canImport = existing.canImport || p.canImport;
          existing.canExport = existing.canExport || p.canExport;
          existing.canPrint = existing.canPrint || p.canPrint;
        } else {
          permissions.push({ ...p });
        }
      } else if (existing) {
        // Even if level is lower, merge additional permissions
        existing.canImport = existing.canImport || p.canImport;
        existing.canExport = existing.canExport || p.canExport;
        existing.canPrint = existing.canPrint || p.canPrint;
      }
    });
  }

  userRole.roleIds.forEach(processRole);
  return permissions;
}

function getPermissionWeight(level: PermissionLevel): number {
  const weights: Record<PermissionLevel, number> = {
    none: 0,
    view: 1,
    create: 2,
    edit: 3,
    delete: 4,
    admin: 5,
  };
  return weights[level];
}

export function hasPermission(userId: string, module: string, requiredLevel: PermissionLevel): boolean {
  if (isSuperAdminUser(userId)) return true;

  const permissions = getUserPermissions(userId);
  const modulePermission = permissions.find((p) => p.module === module);
  if (!modulePermission) return false;
  return getPermissionWeight(modulePermission.level) >= getPermissionWeight(requiredLevel);
}

export function hasModulePermission(userId: string, module: string, permission: 'import' | 'export' | 'print' | 'modify_pipeline'): boolean {
  if (isSuperAdminUser(userId)) return true;

  const permissions = getUserPermissions(userId);
  const modulePermission = permissions.find((p) => p.module === module);
  if (!modulePermission) return false;
  const isAdmin = modulePermission.level === 'admin';
  switch (permission) {
    case 'import': return modulePermission.canImport ?? isAdmin;
    case 'export': return modulePermission.canExport ?? isAdmin;
    case 'print': return modulePermission.canPrint ?? isAdmin;
    case 'modify_pipeline': return modulePermission.canModifyPipeline ?? isAdmin;
    default: return false;
  }
}

export function getUserTeamId(userId: string): string | undefined {
  const perms = getUserPermissions(userId);
  return perms.find(p => p.scope === 'team')?.teamId;
}

export function getModuleRecordScope(userId: string, module: string): RecordScope | 'none' {
  if (isSuperAdminUser(userId)) return 'all';

  const permissions = getUserPermissions(userId);
  const modulePermission = permissions.find((p) => p.module === module);
  if (!modulePermission || modulePermission.level === 'none') return 'none';
  return modulePermission.scope || 'own';
}

// Tab permission checking
export function getUserTabPermissions(userId: string): TabPermission[] {
  const userRole = getUserRole(userId);
  if (!userRole) return [];

  const tabPermissions: TabPermission[] = [];
  const processedRoles = new Set<string>();

  function processRole(roleId: string) {
    if (processedRoles.has(roleId)) return;
    processedRoles.add(roleId);

    const role = getRole(roleId);
    if (!role) return;

    // Process inherited roles first
    role.inheritsFrom?.forEach(processRole);

    // Merge tab permissions - union of all allowed tabs
    role.tabPermissions?.forEach((tp) => {
      const existing = tabPermissions.find((e) => e.moduleId === tp.moduleId);
      if (existing) {
        // Merge allowed tabs (union)
        const mergedTabs = new Set([...existing.allowedTabs, ...tp.allowedTabs]);
        existing.allowedTabs = Array.from(mergedTabs);
      } else {
        tabPermissions.push({ ...tp, allowedTabs: [...tp.allowedTabs] });
      }
    });
  }

  userRole.roleIds.forEach(processRole);
  return tabPermissions;
}

export function hasTabAccess(userId: string, moduleId: string, tabId: string): boolean {
  if (isSuperAdminUser(userId)) return true;

  // First check if user has module access
  if (!hasPermission(userId, moduleId, 'view')) return false;

  const tabPermissions = getUserTabPermissions(userId);
  const moduleTabPerm = tabPermissions.find((tp) => tp.moduleId === moduleId);
  const permissions = getUserPermissions(userId);
  const modulePerm = permissions.find((p) => p.module === moduleId);
  const isAdmin = modulePerm?.level === 'admin';

  if (isAdmin) return true;

  // No explicit tab permissions means no tab restrictions
  if (!moduleTabPerm) return true;

  // Explicit empty list means deny all tabs for non-admin users
  if (moduleTabPerm.allowedTabs.length === 0) return false;

  return moduleTabPerm.allowedTabs.includes(tabId);
}

export function getAccessibleTabs(userId: string, moduleId: string): string[] {
  const allTabIds = getModuleTabIds(moduleId);

  if (isSuperAdminUser(userId)) {
    return allTabIds;
  }

  if (!hasPermission(userId, moduleId, 'view')) return [];

  const permissions = getUserPermissions(userId);
  const modulePerm = permissions.find((p) => p.module === moduleId);
  
  // Admins get all tabs
  if (modulePerm?.level === 'admin') {
    return allTabIds;
  }

  const tabPermissions = getUserTabPermissions(userId);
  const moduleTabPerm = tabPermissions.find((tp) => tp.moduleId === moduleId);

  // If no restrictions, return all tabs
  if (!moduleTabPerm) {
    return allTabIds;
  }

  // Explicit empty allowedTabs means deny all tabs for non-admin users
  if (moduleTabPerm.allowedTabs.length === 0) {
    return [];
  }

  return moduleTabPerm.allowedTabs.filter((tabId) => allTabIds.includes(tabId));
}

// =========================================================================
// Audit logging (cache-backed, Supabase write-through)
// =========================================================================
export function getAuditLogs(): AuditLog[] {
  return [..._auditCache];
}

export function addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
  const entry: AuditLog = {
    ...log,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  _auditCache = [entry, ..._auditCache].slice(0, 1000);

  void (async () => {
    try {
      await supabase.from('app_audit_logs').insert({
        user_id: log.userId || null,
        user_name: log.userName || null,
        action: log.action,
        resource: log.resource,
        resource_id: log.resourceId ?? null,
        details: log.details ?? null,
        ip_address: log.ipAddress ?? null,
      });
    } catch (e) {
      console.warn('[rbac] addAuditLog failed:', e);
    }
  })();
}
