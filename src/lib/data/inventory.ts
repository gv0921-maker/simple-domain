// Inventory data management with localStorage

import { getItem, setItem } from '../storage';

export type TransferStatus = 'draft' | 'waiting' | 'ready' | 'done' | 'cancelled';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unitOfMeasure: string;
  costPrice: number;
  salePrice: number;
  stockOnHand: number;
  reorderLevel: number;
  barcode?: string;
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  additionalPrice: number;
  stockOnHand: number;
}

export interface StockMove {
  productId: string;
  productName: string;
  demand: number;
  quantity: number;
  unit: string;
  available: boolean;
}

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
  moves: StockMove[];
  notes: string[];
  activities: Activity[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details?: string;
  timestamp: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address?: string;
  isActive: boolean;
}

// Default demo data
const DEFAULT_PRODUCTS: Product[] = [
  {
    id: '1',
    sku: '102880',
    name: 'Cushion Cover (Punch)',
    category: 'Accessories',
    unitOfMeasure: 'Units',
    costPrice: 150,
    salePrice: 299,
    stockOnHand: 45,
    reorderLevel: 20,
    barcode: '8901234567890',
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-20T14:30:00Z',
  },
  {
    id: '2',
    sku: '102881',
    name: 'Wooden Chair - Oak',
    category: 'Furniture',
    unitOfMeasure: 'Units',
    costPrice: 2500,
    salePrice: 4999,
    stockOnHand: 12,
    reorderLevel: 5,
    barcode: '8901234567891',
    createdAt: '2025-01-10T09:00:00Z',
    updatedAt: '2025-01-18T11:00:00Z',
  },
  {
    id: '3',
    sku: '102882',
    name: 'Office Desk - Modern',
    category: 'Furniture',
    unitOfMeasure: 'Units',
    costPrice: 8000,
    salePrice: 15999,
    stockOnHand: 8,
    reorderLevel: 3,
    createdAt: '2025-01-05T08:00:00Z',
    updatedAt: '2025-01-22T16:00:00Z',
  },
  {
    id: '4',
    sku: '102883',
    name: 'LED Table Lamp',
    category: 'Lighting',
    unitOfMeasure: 'Units',
    costPrice: 800,
    salePrice: 1499,
    stockOnHand: 0,
    reorderLevel: 10,
    createdAt: '2025-01-12T12:00:00Z',
    updatedAt: '2025-01-25T09:00:00Z',
  },
];

const DEFAULT_TRANSFERS: InventoryTransfer[] = [
  {
    id: '1',
    reference: 'GLF/EST/25-26/00670',
    contact: 'MR ALLWYN L PEREIRA',
    contactPhone: '9845164282',
    operationType: 'GLF: ITEM - ESTIMATE',
    sourceLocation: 'GLF/Stock',
    destinationLocation: 'GLF/Stock/Delivery Orders',
    scheduledDate: '2025-09-08T11:32:00Z',
    estimateDate: '2025-08-08T11:00:00Z',
    status: 'waiting',
    productAvailability: 'not_available',
    sourceDocument: 'S00598-VIKESH',
    backOrderOf: 'GLF/EST/25-26/00669',
    moves: [
      {
        productId: '1',
        productName: '[102880] Cushion Cover (Punch)',
        demand: 3,
        quantity: 0,
        unit: 'Units',
        available: false,
      },
    ],
    notes: ['CUSHION NOT RECEIVED', 'CUSHION PENDING'],
    activities: [
      {
        id: 'a1',
        userId: '1',
        userName: 'Vikesh',
        action: 'Transfer created',
        timestamp: '2025-08-09T10:38:00Z',
      },
      {
        id: 'a2',
        userId: '1',
        userName: 'Vikesh',
        action: 'Scheduled Date changed',
        details: '09/08/2025 → 26/08/2025',
        timestamp: '2025-08-23T17:12:00Z',
      },
      {
        id: 'a3',
        userId: '2',
        userName: 'Management',
        action: 'Responsible changed',
        details: 'None → Vikesh',
        timestamp: '2025-08-29T12:21:00Z',
      },
      {
        id: 'a4',
        userId: '1',
        userName: 'Vikesh',
        action: 'Scheduled Date changed',
        details: '26/08/2025 → 08/09/2025',
        timestamp: '2025-09-04T19:21:00Z',
      },
    ],
    createdBy: 'Vikesh',
    createdAt: '2025-08-23T17:12:00Z',
    updatedAt: '2025-09-04T19:21:00Z',
  },
];

const DEFAULT_WAREHOUSES: Warehouse[] = [
  { id: '1', name: 'Main Warehouse', code: 'GLF', address: 'Industrial Area, Block A', isActive: true },
  { id: '2', name: 'Factory', code: 'GLF-FAC', address: 'Manufacturing Zone', isActive: true },
  { id: '3', name: 'Retail Store', code: 'GLF-RET', address: 'City Center Mall', isActive: true },
];

// CRUD operations for Products
export function getProducts(): Product[] {
  return getItem<Product[]>('products', DEFAULT_PRODUCTS);
}

export function getProduct(id: string): Product | undefined {
  return getProducts().find((p) => p.id === id);
}

export function saveProduct(product: Product): void {
  const products = getProducts();
  const index = products.findIndex((p) => p.id === product.id);
  if (index >= 0) {
    products[index] = { ...product, updatedAt: new Date().toISOString() };
  } else {
    products.push({ ...product, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  setItem('products', products);
}

export function deleteProduct(id: string): void {
  const products = getProducts().filter((p) => p.id !== id);
  setItem('products', products);
}

// CRUD operations for Transfers
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

export function updateTransferStatus(id: string, status: TransferStatus, userId: string, userName: string): void {
  const transfer = getTransfer(id);
  if (transfer) {
    transfer.status = status;
    transfer.activities.push({
      id: crypto.randomUUID(),
      userId,
      userName,
      action: `Status changed to ${status}`,
      timestamp: new Date().toISOString(),
    });
    saveTransfer(transfer);
  }
}

// Warehouses
export function getWarehouses(): Warehouse[] {
  return getItem<Warehouse[]>('warehouses', DEFAULT_WAREHOUSES);
}

export function saveWarehouse(warehouse: Warehouse): void {
  const warehouses = getWarehouses();
  const index = warehouses.findIndex((w) => w.id === warehouse.id);
  if (index >= 0) {
    warehouses[index] = warehouse;
  } else {
    warehouses.push({ ...warehouse, id: crypto.randomUUID() });
  }
  setItem('warehouses', warehouses);
}

export function deleteWarehouse(id: string): void {
  const warehouses = getWarehouses().filter((w) => w.id !== id);
  setItem('warehouses', warehouses);
}

export function deleteTransfer(id: string): void {
  const transfers = getTransfers().filter((t) => t.id !== id);
  setItem('transfers', transfers);
}
