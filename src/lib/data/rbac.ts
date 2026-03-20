// Role-Based Access Control data management

import { getItem, setItem } from '../storage';
import { getModuleTabIds, getModuleTabs } from './moduleTabs';

export type PermissionLevel = 'none' | 'view' | 'create' | 'edit' | 'delete' | 'admin';
export type RecordScope = 'own' | 'department' | 'all';

export interface TabPermission {
  moduleId: string;
  allowedTabs: string[]; // Tab IDs that are allowed, empty = all allowed
}

export interface Permission {
  module: string;
  level: PermissionLevel;
  scope: RecordScope;
  canImport?: boolean;
  canExport?: boolean;
  canPrint?: boolean;
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
  'helpdesk',
  'discuss',
  'email-marketing',
  'pos',
  'website',
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
  { prefix: '/helpdesk', module: 'helpdesk' },
  { prefix: '/discuss', module: 'discuss' },
  { prefix: '/email-marketing', module: 'email-marketing' },
  { prefix: '/website', module: 'website' },
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

// Default roles
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

const DEFAULT_USER_ROLES: UserRole[] = [
  { userId: '1', roleIds: ['super_admin'] },
  { userId: '2', roleIds: ['sales_manager'] },
  { userId: '3', roleIds: ['warehouse_operator'] },
];

// CRUD operations
export function getRoles(): Role[] {
  return getItem<Role[]>('roles', DEFAULT_ROLES);
}

export function getRole(id: string): Role | undefined {
  return getRoles().find((r) => r.id === id);
}

export function saveRole(role: Role): void {
  const roles = getRoles();
  const index = roles.findIndex((r) => r.id === role.id);
  if (index >= 0) {
    roles[index] = { ...role, updatedAt: new Date().toISOString() };
  } else {
    roles.push({ ...role, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  setItem('roles', roles);
}

export function deleteRole(id: string): boolean {
  const role = getRole(id);
  if (role?.isSystem) return false;
  const roles = getRoles().filter((r) => r.id !== id);
  setItem('roles', roles);
  return true;
}

export function getUserRoles(): UserRole[] {
  return getItem<UserRole[]>('userRoles', DEFAULT_USER_ROLES);
}

export function getUserRole(userId: string): UserRole | undefined {
  return getUserRoles().find((ur) => ur.userId === userId);
}

export function setUserRoles(userId: string, roleIds: string[]): void {
  const userRoles = getUserRoles();
  const index = userRoles.findIndex((ur) => ur.userId === userId);
  if (index >= 0) {
    userRoles[index].roleIds = roleIds;
  } else {
    userRoles.push({ userId, roleIds });
  }
  setItem('userRoles', userRoles);
}

function isSuperAdminUser(userId: string): boolean {
  const userRole = getUserRole(userId);
  return Boolean(userRole?.roleIds.includes('super_admin'));
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

export function hasModulePermission(userId: string, module: string, permission: 'import' | 'export' | 'print'): boolean {
  if (isSuperAdminUser(userId)) return true;

  const permissions = getUserPermissions(userId);
  const modulePermission = permissions.find((p) => p.module === module);
  if (!modulePermission) return false;
  const isAdmin = modulePermission.level === 'admin';
  switch (permission) {
    case 'import': return modulePermission.canImport ?? isAdmin;
    case 'export': return modulePermission.canExport ?? isAdmin;
    case 'print': return modulePermission.canPrint ?? isAdmin;
    default: return false;
  }
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

// Audit logging
export function getAuditLogs(): AuditLog[] {
  return getItem<AuditLog[]>('auditLogs', []);
}

export function addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
  const logs = getAuditLogs();
  logs.unshift({
    ...log,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  });
  // Keep last 1000 logs
  if (logs.length > 1000) logs.pop();
  setItem('auditLogs', logs);
}
