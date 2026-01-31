// Inventory module types

export type TransferStatus = 'draft' | 'waiting' | 'ready' | 'done' | 'cancelled';
export type ProductType = 'stockable' | 'consumable' | 'service';
export type CostMethod = 'fifo' | 'average' | 'lifo';
export type LocationType = 'internal' | 'customer' | 'vendor' | 'transit' | 'virtual' | 'production';
export type StockMoveState = 'draft' | 'waiting' | 'confirmed' | 'assigned' | 'done' | 'cancelled';
export type AdjustmentReason = 'count' | 'damage' | 'theft' | 'expiry' | 'correction' | 'other';

// ========== PRODUCTS ==========
export interface Product {
  id: string;
  sku: string;
  name: string;
  type: ProductType;
  category: string;
  unitOfMeasure: string;
  costMethod: CostMethod;
  costPrice: number;
  salePrice: number;
  stockOnHand: number;
  reorderLevel: number;
  barcode?: string;
  barcodes?: string[]; // Multiple barcodes
  trackInventory: boolean;
  trackLots: boolean;
  trackSerials: boolean;
  variants?: ProductVariant[];
  defaultLocationId?: string;
  weight?: number;
  volume?: number;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  attributes: Record<string, string>; // e.g. { color: 'red', size: 'large' }
  additionalPrice: number;
  stockOnHand: number;
  barcode?: string;
}

// ========== LOTS & SERIALS ==========
export interface Lot {
  id: string;
  name: string; // Lot number
  productId: string;
  quantity: number;
  manufacturingDate?: string;
  expirationDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SerialNumber {
  id: string;
  name: string; // Serial number
  productId: string;
  lotId?: string;
  locationId?: string;
  status: 'available' | 'reserved' | 'sold' | 'scrapped';
  createdAt: string;
}

// ========== WAREHOUSES & LOCATIONS ==========
export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address?: string;
  isActive: boolean;
  defaultReceiptLocationId?: string;
  defaultDeliveryLocationId?: string;
  defaultInternalLocationId?: string;
}

export interface Location {
  id: string;
  name: string;
  code: string;
  warehouseId: string;
  parentId?: string;
  type: LocationType;
  isActive: boolean;
  barcode?: string;
  aisle?: string;
  shelf?: string;
  bin?: string;
}

// ========== STOCK MOVES ==========
export interface StockMoveLine {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  demandQty: number;
  reservedQty: number;
  doneQty: number;
  unitOfMeasure: string;
  lotId?: string;
  lotName?: string;
  serialNumbers?: string[];
  sourceLocationId: string;
  destinationLocationId: string;
}

export interface StockMove {
  id: string;
  reference: string;
  operationType: 'receipt' | 'delivery' | 'internal' | 'adjustment' | 'production' | 'return';
  sourceLocationId: string;
  sourceLocationName: string;
  destinationLocationId: string;
  destinationLocationName: string;
  partnerId?: string;
  partnerName?: string;
  scheduledDate: string;
  effectiveDate?: string;
  state: StockMoveState;
  lines: StockMoveLine[];
  sourceDocument?: string;
  backOrderId?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ========== INVENTORY TRANSFERS (LEGACY COMPAT) ==========
export interface InventoryTransfer {
  id: string;
  reference: string;
  contact: string;
  contactPhone?: string;
  operationType: string;
  sourceLocation: string;
  destinationLocation: string;
  scheduledDate: string;
  estimateDate?: string;
  status: TransferStatus;
  productAvailability: 'available' | 'partial' | 'not_available';
  sourceDocument?: string;
  backOrderOf?: string;
  moves: LegacyStockMove[];
  notes: string[];
  activities: Activity[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LegacyStockMove {
  productId: string;
  productName: string;
  demand: number;
  quantity: number;
  unit: string;
  available: boolean;
}

export interface Activity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details?: string;
  timestamp: string;
}

// ========== INVENTORY ADJUSTMENTS ==========
export interface InventoryAdjustment {
  id: string;
  reference: string;
  locationId: string;
  locationName: string;
  reason: AdjustmentReason;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'done';
  lines: AdjustmentLine[];
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdjustmentLine {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  theoreticalQty: number;
  countedQty: number;
  difference: number;
  lotId?: string;
  serialNumbers?: string[];
  unitCost: number;
  valueDifference: number;
}

// ========== REORDER RULES ==========
export interface ReorderRule {
  id: string;
  productId: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  locationId?: string;
  minQty: number;
  maxQty: number;
  reorderQty: number;
  leadTimeDays: number;
  isActive: boolean;
  lastTriggered?: string;
  createdAt: string;
  updatedAt: string;
}

// ========== STOCK VALUATION ==========
export interface ValuationLayer {
  id: string;
  productId: string;
  quantity: number;
  unitCost: number;
  totalValue: number;
  remainingQty: number;
  stockMoveId: string;
  createdAt: string;
}

export interface StockValuation {
  productId: string;
  productName: string;
  productSku: string;
  quantityOnHand: number;
  unitCost: number;
  totalValue: number;
  valuationMethod: CostMethod;
}

// ========== BARCODE OPERATIONS ==========
export interface BarcodeOperation {
  id: string;
  type: 'receipt' | 'pick' | 'pack' | 'transfer' | 'count';
  stockMoveId?: string;
  adjustmentId?: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  scannedItems: ScannedItem[];
  operatorId: string;
  operatorName: string;
  startedAt: string;
  completedAt?: string;
}

export interface ScannedItem {
  barcode: string;
  productId: string;
  productName: string;
  quantity: number;
  lotName?: string;
  serialNumber?: string;
  locationBarcode?: string;
  scannedAt: string;
}

// ========== INVENTORY PERMISSIONS ==========
export type InventoryPermission =
  | 'view_inventory'
  | 'create_stock_moves'
  | 'validate_receipts'
  | 'validate_deliveries'
  | 'perform_adjustments'
  | 'approve_adjustments'
  | 'manage_warehouses'
  | 'manage_locations'
  | 'manage_reorder_rules'
  | 'view_valuation'
  | 'override_reservations'
  | 'manage_lots'
  | 'manage_serials'
  | 'use_barcode_scanner';

export interface InventoryRolePermissions {
  roleId: string;
  roleName: string;
  permissions: InventoryPermission[];
  warehouseScope: 'own' | 'assigned' | 'all';
  assignedWarehouseIds?: string[];
}

// Default inventory roles
export const DEFAULT_INVENTORY_ROLES: InventoryRolePermissions[] = [
  {
    roleId: 'inventory_admin',
    roleName: 'Inventory Admin',
    permissions: [
      'view_inventory', 'create_stock_moves', 'validate_receipts', 'validate_deliveries',
      'perform_adjustments', 'approve_adjustments', 'manage_warehouses', 'manage_locations',
      'manage_reorder_rules', 'view_valuation', 'override_reservations', 'manage_lots',
      'manage_serials', 'use_barcode_scanner'
    ],
    warehouseScope: 'all'
  },
  {
    roleId: 'warehouse_manager',
    roleName: 'Warehouse Manager',
    permissions: [
      'view_inventory', 'create_stock_moves', 'validate_receipts', 'validate_deliveries',
      'perform_adjustments', 'approve_adjustments', 'manage_locations', 'manage_reorder_rules',
      'view_valuation', 'manage_lots', 'manage_serials', 'use_barcode_scanner'
    ],
    warehouseScope: 'assigned'
  },
  {
    roleId: 'warehouse_operator',
    roleName: 'Warehouse Operator',
    permissions: [
      'view_inventory', 'create_stock_moves', 'validate_receipts', 'validate_deliveries',
      'perform_adjustments', 'manage_lots', 'manage_serials', 'use_barcode_scanner'
    ],
    warehouseScope: 'assigned'
  },
  {
    roleId: 'inventory_readonly',
    roleName: 'Inventory Read-only',
    permissions: ['view_inventory', 'view_valuation'],
    warehouseScope: 'all'
  }
];
