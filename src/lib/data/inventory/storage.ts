// Inventory module storage and CRUD operations

import { getItem, setItem } from '../../storage';
import {
  Product, ProductVariant, Lot, SerialNumber, Warehouse, Location,
  StockMove, StockMoveLine, InventoryTransfer, InventoryAdjustment,
  ReorderRule, ValuationLayer, BarcodeOperation, InventoryRolePermissions,
  DEFAULT_INVENTORY_ROLES, StockMoveState, Activity
} from './types';

// ========== DEFAULT DATA ==========
const DEFAULT_PRODUCTS: Product[] = [
  {
    id: '1', sku: '102880', name: 'Cushion Cover (Punch)', type: 'stockable',
    category: 'Accessories', unitOfMeasure: 'Units', costMethod: 'average',
    costPrice: 150, salePrice: 299, stockOnHand: 45, reorderLevel: 20,
    barcode: '8901234567890', trackInventory: true, trackLots: false, trackSerials: false,
    createdAt: '2025-01-15T10:00:00Z', updatedAt: '2025-01-20T14:30:00Z',
  },
  {
    id: '2', sku: '102881', name: 'Wooden Chair - Oak', type: 'stockable',
    category: 'Furniture', unitOfMeasure: 'Units', costMethod: 'fifo',
    costPrice: 2500, salePrice: 4999, stockOnHand: 12, reorderLevel: 5,
    barcode: '8901234567891', trackInventory: true, trackLots: true, trackSerials: false,
    createdAt: '2025-01-10T09:00:00Z', updatedAt: '2025-01-18T11:00:00Z',
  },
  {
    id: '3', sku: '102882', name: 'Office Desk - Modern', type: 'stockable',
    category: 'Furniture', unitOfMeasure: 'Units', costMethod: 'average',
    costPrice: 8000, salePrice: 15999, stockOnHand: 8, reorderLevel: 3,
    trackInventory: true, trackLots: false, trackSerials: true,
    createdAt: '2025-01-05T08:00:00Z', updatedAt: '2025-01-22T16:00:00Z',
  },
  {
    id: '4', sku: '102883', name: 'LED Table Lamp', type: 'stockable',
    category: 'Lighting', unitOfMeasure: 'Units', costMethod: 'average',
    costPrice: 800, salePrice: 1499, stockOnHand: 0, reorderLevel: 10,
    trackInventory: true, trackLots: false, trackSerials: true,
    createdAt: '2025-01-12T12:00:00Z', updatedAt: '2025-01-25T09:00:00Z',
  },
  {
    id: '5', sku: '102884', name: 'Packaging Tape', type: 'consumable',
    category: 'Consumables', unitOfMeasure: 'Rolls', costMethod: 'average',
    costPrice: 50, salePrice: 0, stockOnHand: 200, reorderLevel: 50,
    trackInventory: false, trackLots: false, trackSerials: false,
    createdAt: '2025-01-01T08:00:00Z', updatedAt: '2025-01-01T08:00:00Z',
  },
  {
    id: '6', sku: 'SVC001', name: 'Installation Service', type: 'service',
    category: 'Services', unitOfMeasure: 'Hours', costMethod: 'average',
    costPrice: 500, salePrice: 1000, stockOnHand: 0, reorderLevel: 0,
    trackInventory: false, trackLots: false, trackSerials: false,
    createdAt: '2025-01-01T08:00:00Z', updatedAt: '2025-01-01T08:00:00Z',
  },
];

const DEFAULT_WAREHOUSES: Warehouse[] = [
  { id: '1', name: 'Main Warehouse', code: 'GLF', address: 'Industrial Area, Block A', isActive: true },
  { id: '2', name: 'Factory', code: 'GLF-FAC', address: 'Manufacturing Zone', isActive: true },
  { id: '3', name: 'Retail Store', code: 'GLF-RET', address: 'City Center Mall', isActive: true },
];

const DEFAULT_LOCATIONS: Location[] = [
  { id: 'loc-1', name: 'Stock', code: 'GLF/Stock', warehouseId: '1', type: 'internal', isActive: true },
  { id: 'loc-2', name: 'Delivery Orders', code: 'GLF/Delivery', warehouseId: '1', parentId: 'loc-1', type: 'internal', isActive: true },
  { id: 'loc-3', name: 'Receipts', code: 'GLF/Receipts', warehouseId: '1', parentId: 'loc-1', type: 'internal', isActive: true },
  { id: 'loc-4', name: 'Quality Control', code: 'GLF/QC', warehouseId: '1', type: 'internal', isActive: true },
  { id: 'loc-5', name: 'Scrap', code: 'GLF/Scrap', warehouseId: '1', type: 'virtual', isActive: true },
  { id: 'loc-6', name: 'Customer', code: 'Customers', warehouseId: '', type: 'customer', isActive: true },
  { id: 'loc-7', name: 'Vendor', code: 'Vendors', warehouseId: '', type: 'vendor', isActive: true },
  { id: 'loc-8', name: 'Transit', code: 'Transit', warehouseId: '', type: 'transit', isActive: true },
  { id: 'loc-9', name: 'Production Floor', code: 'FAC/Production', warehouseId: '2', type: 'production', isActive: true },
  { id: 'loc-10', name: 'Raw Materials', code: 'FAC/Raw', warehouseId: '2', type: 'internal', isActive: true },
  { id: 'loc-11', name: 'Aisle A - Shelf 1', code: 'GLF/A1', warehouseId: '1', parentId: 'loc-1', type: 'internal', isActive: true, aisle: 'A', shelf: '1' },
  { id: 'loc-12', name: 'Aisle A - Shelf 2', code: 'GLF/A2', warehouseId: '1', parentId: 'loc-1', type: 'internal', isActive: true, aisle: 'A', shelf: '2' },
];

const DEFAULT_LOTS: Lot[] = [
  { id: 'lot-1', name: 'LOT-2025-001', productId: '2', quantity: 6, manufacturingDate: '2025-01-01', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'lot-2', name: 'LOT-2025-002', productId: '2', quantity: 6, manufacturingDate: '2025-01-15', expirationDate: '2027-01-15', createdAt: '2025-01-15T00:00:00Z', updatedAt: '2025-01-15T00:00:00Z' },
];

const DEFAULT_SERIALS: SerialNumber[] = [
  { id: 'ser-1', name: 'DESK-2025-0001', productId: '3', locationId: 'loc-1', status: 'available', createdAt: '2025-01-01T00:00:00Z' },
  { id: 'ser-2', name: 'DESK-2025-0002', productId: '3', locationId: 'loc-1', status: 'available', createdAt: '2025-01-01T00:00:00Z' },
  { id: 'ser-3', name: 'DESK-2025-0003', productId: '3', locationId: 'loc-1', status: 'sold', createdAt: '2025-01-01T00:00:00Z' },
  { id: 'ser-4', name: 'LAMP-2025-0001', productId: '4', locationId: 'loc-1', status: 'available', createdAt: '2025-01-01T00:00:00Z' },
];

const DEFAULT_STOCK_MOVES: StockMove[] = [
  {
    id: 'sm-1', reference: 'REC/2025/0001', operationType: 'receipt',
    sourceLocationId: 'loc-7', sourceLocationName: 'Vendors',
    destinationLocationId: 'loc-1', destinationLocationName: 'GLF/Stock',
    partnerId: 'vendor-1', partnerName: 'Supplier ABC',
    scheduledDate: '2025-01-20T10:00:00Z', effectiveDate: '2025-01-20T11:30:00Z',
    state: 'done',
    lines: [
      { id: 'sml-1', productId: '1', productName: 'Cushion Cover (Punch)', productSku: '102880', demandQty: 50, reservedQty: 0, doneQty: 50, unitOfMeasure: 'Units', sourceLocationId: 'loc-7', destinationLocationId: 'loc-1' }
    ],
    sourceDocument: 'PO-2025-001',
    createdBy: 'Vikesh', createdAt: '2025-01-20T09:00:00Z', updatedAt: '2025-01-20T11:30:00Z'
  },
  {
    id: 'sm-2', reference: 'DEL/2025/0001', operationType: 'delivery',
    sourceLocationId: 'loc-1', sourceLocationName: 'GLF/Stock',
    destinationLocationId: 'loc-6', destinationLocationName: 'Customers',
    partnerId: 'cust-1', partnerName: 'Acme Corporation',
    scheduledDate: '2025-01-25T14:00:00Z',
    state: 'confirmed',
    lines: [
      { id: 'sml-2', productId: '1', productName: 'Cushion Cover (Punch)', productSku: '102880', demandQty: 10, reservedQty: 10, doneQty: 0, unitOfMeasure: 'Units', sourceLocationId: 'loc-1', destinationLocationId: 'loc-6' },
      { id: 'sml-3', productId: '2', productName: 'Wooden Chair - Oak', productSku: '102881', demandQty: 4, reservedQty: 4, doneQty: 0, unitOfMeasure: 'Units', sourceLocationId: 'loc-1', destinationLocationId: 'loc-6', lotId: 'lot-1', lotName: 'LOT-2025-001' }
    ],
    sourceDocument: 'SO-2025-001',
    createdBy: 'Vikesh', createdAt: '2025-01-24T09:00:00Z', updatedAt: '2025-01-24T09:00:00Z'
  },
  {
    id: 'sm-3', reference: 'INT/2025/0001', operationType: 'internal',
    sourceLocationId: 'loc-1', sourceLocationName: 'GLF/Stock',
    destinationLocationId: 'loc-9', destinationLocationName: 'FAC/Production',
    scheduledDate: '2025-01-22T08:00:00Z', effectiveDate: '2025-01-22T08:30:00Z',
    state: 'done',
    lines: [
      { id: 'sml-4', productId: '2', productName: 'Wooden Chair - Oak', productSku: '102881', demandQty: 2, reservedQty: 0, doneQty: 2, unitOfMeasure: 'Units', sourceLocationId: 'loc-1', destinationLocationId: 'loc-9', lotId: 'lot-2', lotName: 'LOT-2025-002' }
    ],
    createdBy: 'Admin', createdAt: '2025-01-21T16:00:00Z', updatedAt: '2025-01-22T08:30:00Z'
  }
];

const DEFAULT_TRANSFERS: InventoryTransfer[] = [
  {
    id: '1', reference: 'GLF/EST/25-26/00670', contact: 'MR ALLWYN L PEREIRA',
    contactPhone: '9845164282', operationType: 'GLF: ITEM - ESTIMATE',
    sourceLocation: 'GLF/Stock', destinationLocation: 'GLF/Stock/Delivery Orders',
    scheduledDate: '2025-09-08T11:32:00Z', estimateDate: '2025-08-08T11:00:00Z',
    status: 'waiting', productAvailability: 'not_available',
    sourceDocument: 'S00598-VIKESH', backOrderOf: 'GLF/EST/25-26/00669',
    moves: [{ productId: '1', productName: '[102880] Cushion Cover (Punch)', demand: 3, quantity: 0, unit: 'Units', available: false }],
    notes: ['CUSHION NOT RECEIVED', 'CUSHION PENDING'],
    activities: [
      { id: 'a1', userId: '1', userName: 'Vikesh', action: 'Transfer created', timestamp: '2025-08-09T10:38:00Z' },
      { id: 'a2', userId: '1', userName: 'Vikesh', action: 'Scheduled Date changed', details: '09/08/2025 → 26/08/2025', timestamp: '2025-08-23T17:12:00Z' },
    ],
    createdBy: 'Vikesh', createdAt: '2025-08-23T17:12:00Z', updatedAt: '2025-09-04T19:21:00Z',
  },
];

const DEFAULT_ADJUSTMENTS: InventoryAdjustment[] = [
  {
    id: 'adj-1', reference: 'ADJ/2025/0001', locationId: 'loc-1', locationName: 'GLF/Stock',
    reason: 'count', status: 'done',
    lines: [
      { id: 'adjl-1', productId: '1', productName: 'Cushion Cover (Punch)', productSku: '102880', theoreticalQty: 50, countedQty: 45, difference: -5, unitCost: 150, valueDifference: -750 }
    ],
    notes: 'Quarterly inventory count', createdBy: 'Admin', approvedBy: 'Admin', approvedAt: '2025-01-20T10:00:00Z',
    createdAt: '2025-01-20T08:00:00Z', updatedAt: '2025-01-20T10:00:00Z'
  }
];

const DEFAULT_REORDER_RULES: ReorderRule[] = [
  { id: 'rr-1', productId: '1', productName: 'Cushion Cover (Punch)', warehouseId: '1', warehouseName: 'Main Warehouse', minQty: 20, maxQty: 100, reorderQty: 50, leadTimeDays: 7, isActive: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'rr-2', productId: '2', productName: 'Wooden Chair - Oak', warehouseId: '1', warehouseName: 'Main Warehouse', minQty: 5, maxQty: 30, reorderQty: 15, leadTimeDays: 14, isActive: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'rr-3', productId: '4', productName: 'LED Table Lamp', warehouseId: '1', warehouseName: 'Main Warehouse', minQty: 10, maxQty: 50, reorderQty: 25, leadTimeDays: 10, isActive: true, lastTriggered: '2025-01-25T09:00:00Z', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-25T09:00:00Z' },
];

// ========== PRODUCTS CRUD ==========
export function getProducts(): Product[] {
  return getItem<Product[]>('inventory_products', DEFAULT_PRODUCTS);
}

export function getProduct(id: string): Product | undefined {
  return getProducts().find((p) => p.id === id);
}

export function getProductByBarcode(barcode: string): Product | undefined {
  return getProducts().find((p) => p.barcode === barcode || p.barcodes?.includes(barcode));
}

export function saveProduct(product: Product): void {
  const products = getProducts();
  const index = products.findIndex((p) => p.id === product.id);
  if (index >= 0) {
    products[index] = { ...product, updatedAt: new Date().toISOString() };
  } else {
    products.push({ ...product, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  setItem('inventory_products', products);
}

export function deleteProduct(id: string): void {
  const products = getProducts().filter((p) => p.id !== id);
  setItem('inventory_products', products);
}

export function updateProductStock(productId: string, quantityChange: number): void {
  const products = getProducts();
  const product = products.find(p => p.id === productId);
  if (product) {
    product.stockOnHand += quantityChange;
    product.updatedAt = new Date().toISOString();
    setItem('inventory_products', products);
  }
}

// ========== WAREHOUSES CRUD ==========
export function getWarehouses(): Warehouse[] {
  return getItem<Warehouse[]>('inventory_warehouses', DEFAULT_WAREHOUSES);
}

export function getWarehouse(id: string): Warehouse | undefined {
  return getWarehouses().find((w) => w.id === id);
}

export function saveWarehouse(warehouse: Warehouse): void {
  const warehouses = getWarehouses();
  const index = warehouses.findIndex((w) => w.id === warehouse.id);
  if (index >= 0) {
    warehouses[index] = warehouse;
  } else {
    warehouses.push({ ...warehouse, id: crypto.randomUUID() });
  }
  setItem('inventory_warehouses', warehouses);
}

export function deleteWarehouse(id: string): void {
  const warehouses = getWarehouses().filter((w) => w.id !== id);
  setItem('inventory_warehouses', warehouses);
}

// ========== LOCATIONS CRUD ==========
export function getLocations(): Location[] {
  return getItem<Location[]>('inventory_locations', DEFAULT_LOCATIONS);
}

export function getLocation(id: string): Location | undefined {
  return getLocations().find((l) => l.id === id);
}

export function getLocationByBarcode(barcode: string): Location | undefined {
  return getLocations().find((l) => l.barcode === barcode);
}

export function getLocationsByWarehouse(warehouseId: string): Location[] {
  return getLocations().filter((l) => l.warehouseId === warehouseId);
}

export function saveLocation(location: Location): void {
  const locations = getLocations();
  const index = locations.findIndex((l) => l.id === location.id);
  if (index >= 0) {
    locations[index] = location;
  } else {
    locations.push({ ...location, id: crypto.randomUUID() });
  }
  setItem('inventory_locations', locations);
}

export function deleteLocation(id: string): void {
  const locations = getLocations().filter((l) => l.id !== id);
  setItem('inventory_locations', locations);
}

// ========== LOTS CRUD ==========
export function getLots(): Lot[] {
  return getItem<Lot[]>('inventory_lots', DEFAULT_LOTS);
}

export function getLot(id: string): Lot | undefined {
  return getLots().find((l) => l.id === id);
}

export function getLotsByProduct(productId: string): Lot[] {
  return getLots().filter((l) => l.productId === productId);
}

export function saveLot(lot: Lot): void {
  const lots = getLots();
  const index = lots.findIndex((l) => l.id === lot.id);
  if (index >= 0) {
    lots[index] = { ...lot, updatedAt: new Date().toISOString() };
  } else {
    lots.push({ ...lot, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  setItem('inventory_lots', lots);
}

export function deleteLot(id: string): void {
  const lots = getLots().filter((l) => l.id !== id);
  setItem('inventory_lots', lots);
}

// ========== SERIAL NUMBERS CRUD ==========
export function getSerialNumbers(): SerialNumber[] {
  return getItem<SerialNumber[]>('inventory_serials', DEFAULT_SERIALS);
}

export function getSerialNumber(id: string): SerialNumber | undefined {
  return getSerialNumbers().find((s) => s.id === id);
}

export function getSerialsByProduct(productId: string): SerialNumber[] {
  return getSerialNumbers().filter((s) => s.productId === productId);
}

export function getAvailableSerials(productId: string): SerialNumber[] {
  return getSerialNumbers().filter((s) => s.productId === productId && s.status === 'available');
}

export function saveSerialNumber(serial: SerialNumber): void {
  const serials = getSerialNumbers();
  const index = serials.findIndex((s) => s.id === serial.id);
  if (index >= 0) {
    serials[index] = serial;
  } else {
    serials.push({ ...serial, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
  }
  setItem('inventory_serials', serials);
}

export function updateSerialStatus(serialId: string, status: SerialNumber['status'], locationId?: string): void {
  const serials = getSerialNumbers();
  const serial = serials.find(s => s.id === serialId);
  if (serial) {
    serial.status = status;
    if (locationId) serial.locationId = locationId;
    setItem('inventory_serials', serials);
  }
}

// ========== STOCK MOVES CRUD ==========
export function getStockMoves(): StockMove[] {
  return getItem<StockMove[]>('inventory_stock_moves', DEFAULT_STOCK_MOVES);
}

export function getStockMove(id: string): StockMove | undefined {
  return getStockMoves().find((m) => m.id === id);
}

export function getStockMovesByState(state: StockMoveState): StockMove[] {
  return getStockMoves().filter((m) => m.state === state);
}

export function saveStockMove(move: StockMove): void {
  const moves = getStockMoves();
  const index = moves.findIndex((m) => m.id === move.id);
  if (index >= 0) {
    moves[index] = { ...move, updatedAt: new Date().toISOString() };
  } else {
    moves.push({ ...move, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  setItem('inventory_stock_moves', moves);
}

export function deleteStockMove(id: string): void {
  const moves = getStockMoves().filter((m) => m.id !== id);
  setItem('inventory_stock_moves', moves);
}

export function validateStockMove(moveId: string, userId: string, userName: string): void {
  const moves = getStockMoves();
  const move = moves.find(m => m.id === moveId);
  if (move && (move.state === 'confirmed' || move.state === 'assigned')) {
    // Update stock levels for each line
    move.lines.forEach(line => {
      updateProductStock(line.productId, move.operationType === 'receipt' ? line.doneQty : -line.doneQty);
    });
    move.state = 'done';
    move.effectiveDate = new Date().toISOString();
    move.updatedAt = new Date().toISOString();
    setItem('inventory_stock_moves', moves);
  }
}

// ========== LEGACY TRANSFERS (backward compat) ==========
export function getTransfers(): InventoryTransfer[] {
  return getItem<InventoryTransfer[]>('transfers', DEFAULT_TRANSFERS);
}

export function getTransfer(id: string): InventoryTransfer | undefined {
  return getTransfers().find((t) => t.id === id);
}

export function saveTransfer(transfer: InventoryTransfer): void {
  const transfers = getTransfers();
  const index = transfers.findIndex((t) => t.id === transfer.id);
  if (index >= 0) {
    transfers[index] = { ...transfer, updatedAt: new Date().toISOString() };
  } else {
    transfers.push({ ...transfer, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  setItem('transfers', transfers);
}

export function deleteTransfer(id: string): void {
  const transfers = getTransfers().filter((t) => t.id !== id);
  setItem('transfers', transfers);
}

// ========== ADJUSTMENTS CRUD ==========
export function getAdjustments(): InventoryAdjustment[] {
  return getItem<InventoryAdjustment[]>('inventory_adjustments', DEFAULT_ADJUSTMENTS);
}

export function getAdjustment(id: string): InventoryAdjustment | undefined {
  return getAdjustments().find((a) => a.id === id);
}

export function saveAdjustment(adjustment: InventoryAdjustment): void {
  const adjustments = getAdjustments();
  const index = adjustments.findIndex((a) => a.id === adjustment.id);
  if (index >= 0) {
    adjustments[index] = { ...adjustment, updatedAt: new Date().toISOString() };
  } else {
    adjustments.push({ ...adjustment, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  setItem('inventory_adjustments', adjustments);
}

export function approveAdjustment(adjustmentId: string, userId: string): void {
  const adjustments = getAdjustments();
  const adj = adjustments.find(a => a.id === adjustmentId);
  if (adj && adj.status === 'pending_approval') {
    // Apply the adjustments to stock
    adj.lines.forEach(line => {
      updateProductStock(line.productId, line.difference);
    });
    adj.status = 'done';
    adj.approvedBy = userId;
    adj.approvedAt = new Date().toISOString();
    adj.updatedAt = new Date().toISOString();
    setItem('inventory_adjustments', adjustments);
  }
}

// ========== REORDER RULES CRUD ==========
export function getReorderRules(): ReorderRule[] {
  return getItem<ReorderRule[]>('inventory_reorder_rules', DEFAULT_REORDER_RULES);
}

export function getReorderRule(id: string): ReorderRule | undefined {
  return getReorderRules().find((r) => r.id === id);
}

export function saveReorderRule(rule: ReorderRule): void {
  const rules = getReorderRules();
  const index = rules.findIndex((r) => r.id === rule.id);
  if (index >= 0) {
    rules[index] = { ...rule, updatedAt: new Date().toISOString() };
  } else {
    rules.push({ ...rule, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  setItem('inventory_reorder_rules', rules);
}

export function deleteReorderRule(id: string): void {
  const rules = getReorderRules().filter((r) => r.id !== id);
  setItem('inventory_reorder_rules', rules);
}

export function checkReorderRules(): ReorderRule[] {
  const rules = getReorderRules().filter(r => r.isActive);
  const products = getProducts();
  const triggered: ReorderRule[] = [];
  
  rules.forEach(rule => {
    const product = products.find(p => p.id === rule.productId);
    if (product && product.stockOnHand <= rule.minQty) {
      triggered.push(rule);
    }
  });
  
  return triggered;
}

// ========== INVENTORY PERMISSIONS ==========
export function getInventoryRolePermissions(): InventoryRolePermissions[] {
  return getItem<InventoryRolePermissions[]>('inventory_role_permissions', DEFAULT_INVENTORY_ROLES);
}

export function getUserInventoryPermissions(userId: string): InventoryRolePermissions | undefined {
  // This would integrate with the main RBAC system
  // For now, return warehouse_operator as default
  return getInventoryRolePermissions().find(r => r.roleId === 'warehouse_operator');
}

export function hasInventoryPermission(userId: string, permission: string): boolean {
  const userPerms = getUserInventoryPermissions(userId);
  return userPerms?.permissions.includes(permission as any) ?? false;
}

// ========== STOCK AVAILABILITY ==========
export function getStockAvailability(productId: string, warehouseId?: string): number {
  const product = getProduct(productId);
  if (!product) return 0;
  
  // For now, return total stock. In full implementation, would filter by warehouse/location
  return product.stockOnHand;
}

export function getForecastedStock(productId: string): { incoming: number; outgoing: number; forecasted: number } {
  const product = getProduct(productId);
  const moves = getStockMoves();
  
  let incoming = 0;
  let outgoing = 0;
  
  moves.forEach(move => {
    if (move.state !== 'done' && move.state !== 'cancelled') {
      move.lines.forEach(line => {
        if (line.productId === productId) {
          if (move.operationType === 'receipt') {
            incoming += line.demandQty - line.doneQty;
          } else if (move.operationType === 'delivery') {
            outgoing += line.demandQty - line.doneQty;
          }
        }
      });
    }
  });
  
  return {
    incoming,
    outgoing,
    forecasted: (product?.stockOnHand ?? 0) + incoming - outgoing
  };
}

// ========== STOCK RESERVATIONS ==========
export function reserveStock(productId: string, quantity: number, sourceDocument: string): boolean {
  const available = getStockAvailability(productId);
  if (available >= quantity) {
    // In full implementation, would create reservation records
    return true;
  }
  return false;
}

export function releaseReservation(productId: string, quantity: number, sourceDocument: string): void {
  // In full implementation, would remove reservation records
}

// ========== VALUATION ==========
export function getStockValuation(): { totalValue: number; byCategory: Record<string, number> } {
  const products = getProducts().filter(p => p.type === 'stockable' && p.trackInventory);
  let totalValue = 0;
  const byCategory: Record<string, number> = {};
  
  products.forEach(product => {
    const value = product.stockOnHand * product.costPrice;
    totalValue += value;
    byCategory[product.category] = (byCategory[product.category] || 0) + value;
  });
  
  return { totalValue, byCategory };
}

// ========== BARCODE OPERATIONS ==========
export function getBarcodeOperations(): BarcodeOperation[] {
  return getItem<BarcodeOperation[]>('inventory_barcode_operations', []);
}

export function saveBarcodeOperation(operation: BarcodeOperation): void {
  const operations = getBarcodeOperations();
  const index = operations.findIndex((o) => o.id === operation.id);
  if (index >= 0) {
    operations[index] = operation;
  } else {
    operations.push({ ...operation, id: crypto.randomUUID() });
  }
  setItem('inventory_barcode_operations', operations);
}

// ========== TRACEABILITY ==========
export function getForwardTraceability(serialOrLotId: string): StockMove[] {
  const moves = getStockMoves().filter(m => m.state === 'done');
  return moves.filter(move => 
    move.lines.some(line => 
      line.lotId === serialOrLotId || line.serialNumbers?.includes(serialOrLotId)
    )
  ).sort((a, b) => new Date(a.effectiveDate || a.createdAt).getTime() - new Date(b.effectiveDate || b.createdAt).getTime());
}

export function getBackwardTraceability(serialOrLotId: string): StockMove[] {
  return getForwardTraceability(serialOrLotId).reverse();
}
