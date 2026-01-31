import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRole, getRole } from '@/lib/data/rbac';
import { 
  DEFAULT_INVENTORY_ROLES,
  type InventoryPermission,
  type InventoryRolePermissions
} from '@/lib/data/inventory/types';
import { getItem } from '@/lib/storage';

// Mapping from RBAC roles to inventory roles
const RBAC_TO_INVENTORY_ROLE: Record<string, string> = {
  'super_admin': 'inventory_admin',
  'admin': 'inventory_admin',
  'warehouse_operator': 'warehouse_operator',
  'warehouse_manager': 'warehouse_manager',
  'sales_manager': 'inventory_readonly',
  'sales_rep': 'inventory_readonly',
  'accountant': 'inventory_readonly',
  'read_only': 'inventory_readonly',
};

export function useInventoryPermissions() {
  const { user } = useAuth();

  const permissions = useMemo(() => {
    if (!user) {
      return {
        role: null as InventoryRolePermissions | null,
        permissions: [] as InventoryPermission[],
        warehouseScope: 'own' as const,
        assignedWarehouses: [] as string[],
        can: (permission: InventoryPermission) => false,
        canAccessWarehouse: (warehouseId: string) => false,
      };
    }

    // Get user's RBAC roles
    const userRole = getUserRole(user.id);
    if (!userRole || userRole.roleIds.length === 0) {
      return {
        role: null,
        permissions: [],
        warehouseScope: 'own' as const,
        assignedWarehouses: [],
        can: () => false,
        canAccessWarehouse: () => false,
      };
    }

    // Get the highest privilege RBAC role
    let inventoryRoleId = 'inventory_readonly';
    for (const roleId of userRole.roleIds) {
      if (RBAC_TO_INVENTORY_ROLE[roleId]) {
        const mapped = RBAC_TO_INVENTORY_ROLE[roleId];
        // Priority: admin > manager > operator > readonly
        if (mapped === 'inventory_admin') {
          inventoryRoleId = mapped;
          break;
        } else if (mapped === 'warehouse_manager' && inventoryRoleId !== 'inventory_admin') {
          inventoryRoleId = mapped;
        } else if (mapped === 'warehouse_operator' && !['inventory_admin', 'warehouse_manager'].includes(inventoryRoleId)) {
          inventoryRoleId = mapped;
        }
      }
    }

    // Get inventory role permissions
    const inventoryRoles = getItem<InventoryRolePermissions[]>('inventory_role_permissions', DEFAULT_INVENTORY_ROLES);
    const role = inventoryRoles.find(r => r.roleId === inventoryRoleId) || DEFAULT_INVENTORY_ROLES.find(r => r.roleId === 'inventory_readonly')!;

    // Get user's assigned warehouses (for non-admin roles)
    const userWarehouseAssignments = getItem<Record<string, string[]>>('user_warehouse_assignments', {});
    const assignedWarehouses = userWarehouseAssignments[user.id] || [];

    return {
      role,
      permissions: role.permissions,
      warehouseScope: role.warehouseScope,
      assignedWarehouses,
      can: (permission: InventoryPermission) => role.permissions.includes(permission),
      canAccessWarehouse: (warehouseId: string) => {
        if (role.warehouseScope === 'all') return true;
        if (role.warehouseScope === 'assigned') {
          return assignedWarehouses.includes(warehouseId);
        }
        return false;
      },
    };
  }, [user]);

  return permissions;
}

// Utility hook for checking multiple permissions
export function useInventoryAccess() {
  const perms = useInventoryPermissions();

  return {
    ...perms,
    canViewInventory: perms.can('view_inventory'),
    canCreateMoves: perms.can('create_stock_moves'),
    canValidateReceipts: perms.can('validate_receipts'),
    canValidateDeliveries: perms.can('validate_deliveries'),
    canAdjustInventory: perms.can('perform_adjustments'),
    canApproveAdjustments: perms.can('approve_adjustments'),
    canManageWarehouses: perms.can('manage_warehouses'),
    canManageLocations: perms.can('manage_locations'),
    canManageReorderRules: perms.can('manage_reorder_rules'),
    canViewValuation: perms.can('view_valuation'),
    canOverrideReservations: perms.can('override_reservations'),
    canManageLots: perms.can('manage_lots'),
    canManageSerials: perms.can('manage_serials'),
    canUseBarcode: perms.can('use_barcode_scanner'),
    isAdmin: perms.role?.roleId === 'inventory_admin',
    isManager: perms.role?.roleId === 'warehouse_manager',
    isOperator: perms.role?.roleId === 'warehouse_operator',
    isReadOnly: perms.role?.roleId === 'inventory_readonly',
  };
}
