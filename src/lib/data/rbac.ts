// Role-Based Access Control data management

import { getItem, setItem } from '../storage';
import { getModuleTabIds } from './moduleTabs';

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
  'pos',
  'website',
  'settings',
  'users',
  'reports',
] as const;

export type ModuleName = typeof MODULES[number];

// Default roles
const DEFAULT_ROLES: Role[] = [
  {
    id: 'super_admin',
    name: 'Super Admin',
    description: 'Full system access with all permissions',
    isSystem: true,
    permissions: MODULES.map((m) => ({ module: m, level: 'admin' as PermissionLevel, scope: 'all' as RecordScope })),
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Administrative access to most modules',
    isSystem: true,
    permissions: MODULES.filter((m) => m !== 'settings').map((m) => ({ module: m, level: 'admin' as PermissionLevel, scope: 'all' as RecordScope })),
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'sales_manager',
    name: 'Sales Manager',
    description: 'Manage sales team and CRM',
    isSystem: true,
    permissions: [
      { module: 'sales', level: 'admin', scope: 'all' },
      { module: 'crm', level: 'admin', scope: 'all' },
      { module: 'inventory', level: 'view', scope: 'all' },
      { module: 'reports', level: 'view', scope: 'department' },
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
    permissions: MODULES.map((m) => ({ module: m, level: 'view' as PermissionLevel, scope: 'all' as RecordScope })),
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
        } else {
          permissions.push({ ...p });
        }
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
  const permissions = getUserPermissions(userId);
  const modulePermission = permissions.find((p) => p.module === module);
  if (!modulePermission) return false;
  return getPermissionWeight(modulePermission.level) >= getPermissionWeight(requiredLevel);
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
  // First check if user has module access
  if (!hasPermission(userId, moduleId, 'view')) return false;

  const tabPermissions = getUserTabPermissions(userId);
  const moduleTabPerm = tabPermissions.find((tp) => tp.moduleId === moduleId);

  // If no tab permissions defined for this module, all tabs are allowed (admin default)
  if (!moduleTabPerm || moduleTabPerm.allowedTabs.length === 0) {
    // Check if user is admin - admins get all tabs
    const permissions = getUserPermissions(userId);
    const modulePerm = permissions.find((p) => p.module === moduleId);
    if (modulePerm?.level === 'admin') return true;
    
    // For non-admins without explicit tab permissions, check if any restrictions exist
    if (!moduleTabPerm) return true; // No restrictions = all allowed
    if (moduleTabPerm.allowedTabs.length === 0) return true; // Empty array = all allowed
  }

  return moduleTabPerm.allowedTabs.includes(tabId);
}

export function getAccessibleTabs(userId: string, moduleId: string): string[] {
  if (!hasPermission(userId, moduleId, 'view')) return [];

  const permissions = getUserPermissions(userId);
  const modulePerm = permissions.find((p) => p.module === moduleId);
  
  // Admins get all tabs
  if (modulePerm?.level === 'admin') {
    return getModuleTabIds(moduleId);
  }

  const tabPermissions = getUserTabPermissions(userId);
  const moduleTabPerm = tabPermissions.find((tp) => tp.moduleId === moduleId);

  // If no restrictions, return all tabs
  if (!moduleTabPerm || moduleTabPerm.allowedTabs.length === 0) {
    return getModuleTabIds(moduleId);
  }

  return moduleTabPerm.allowedTabs;
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
