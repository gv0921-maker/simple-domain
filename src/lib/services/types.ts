// Service contracts. Each service interface is the API surface that
// any future implementation (Supabase, REST, Postgres) must satisfy.
// Return shapes use `Promise<T> | T` so the current synchronous
// localStorage impl AND future asynchronous impls both fit.

import type { Contact, Opportunity, Activity, Note, Pipeline, CRMStats } from '@/lib/crm/types';
import type {
  Quotation,
  SalesOrder,
  Pricelist,
  Subscription,
  TaxRule,
  FiscalPosition,
} from '@/lib/data/sales/types';
import type {
  Product,
  Warehouse,
  Location,
  StockMove,
  InventoryAdjustment,
  ReorderRule,
  InventoryTransfer,
} from '@/lib/data/inventory/types';

type Maybe<T> = Promise<T> | T;

// ============ CRM ============
export interface CRMService {
  // Contacts
  getContacts: () => Maybe<Contact[]>;
  getContact: (id: string) => Maybe<Contact | undefined>;
  saveContact: (contact: Partial<Contact>) => Maybe<Contact>;
  deleteContact: (id: string) => Maybe<void>;

  // Opportunities
  getOpportunities: () => Maybe<Opportunity[]>;
  getOpportunity: (id: string) => Maybe<Opportunity | undefined>;
  saveOpportunity: (opp: Partial<Opportunity>) => Maybe<Opportunity>;
  deleteOpportunity: (id: string) => Maybe<void>;
  updateOpportunityStage: (id: string, stage: string) => Maybe<void>;

  // Activities (no email send; activity records remain)
  getActivities: (relatedTo: string, relatedId: string) => Maybe<Activity[]>;
  saveActivity: (activity: Partial<Activity>) => Maybe<Activity>;

  // Notes
  getNotes: (relatedTo: string, relatedId: string) => Maybe<Note[]>;
  saveNote: (note: Partial<Note>) => Maybe<Note>;

  // Pipelines
  getPipelines: () => Maybe<Pipeline[]>;
  savePipeline: (pipeline: Partial<Pipeline>) => Maybe<Pipeline>;
  deletePipeline: (id: string) => Maybe<void>;

  // Stats
  getCRMStats: () => Maybe<CRMStats>;
}

// ============ Sales ============
export interface SalesService {
  // Quotations
  getQuotations: () => Maybe<Quotation[]>;
  getQuotation: (id: string) => Maybe<Quotation | undefined>;
  saveQuotation: (q: Partial<Quotation>) => Maybe<Quotation>;
  deleteQuotation: (id: string) => Maybe<void>;

  // Sales Orders
  getSalesOrders: () => Maybe<SalesOrder[]>;
  getSalesOrder: (id: string) => Maybe<SalesOrder | undefined>;
  saveSalesOrder: (o: Partial<SalesOrder>) => Maybe<SalesOrder>;
  deleteSalesOrder: (id: string) => Maybe<void>;

  // Pricelists
  getPricelists: () => Maybe<Pricelist[]>;
  savePricelist: (p: Partial<Pricelist>) => Maybe<Pricelist>;
  deletePricelist: (id: string) => Maybe<void>;

  // Subscriptions
  getSubscriptions: () => Maybe<Subscription[]>;
  saveSubscription: (s: Partial<Subscription>) => Maybe<Subscription>;

  // Tax / fiscal
  getTaxRules: () => Maybe<TaxRule[]>;
  getFiscalPositions: () => Maybe<FiscalPosition[]>;
}

// ============ Inventory ============
export interface InventoryService {
  // Products
  getProducts: () => Maybe<Product[]>;
  getProduct: (id: string) => Maybe<Product | undefined>;
  saveProduct: (p: Partial<Product>) => Maybe<Product>;
  deleteProduct: (id: string) => Maybe<void>;

  // Warehouses & Locations
  getWarehouses: () => Maybe<Warehouse[]>;
  saveWarehouse: (w: Partial<Warehouse>) => Maybe<Warehouse>;
  deleteWarehouse: (id: string) => Maybe<void>;
  getLocations: () => Maybe<Location[]>;

  // Stock moves & transfers
  getStockMoves: () => Maybe<StockMove[]>;
  getTransfers: () => Maybe<InventoryTransfer[]>;

  // Adjustments & reorder rules
  getInventoryAdjustments?: () => Maybe<InventoryAdjustment[]>;
  getReorderRules: () => Maybe<ReorderRule[]>;

  // Barcode lookups
  getProductByBarcode: (barcode: string) => Maybe<Product | undefined>;
}

// ============ Accounting ============
export interface AccountingService {
  getAccounts: () => Maybe<unknown[]>;
  getInvoices: () => Maybe<unknown[]>;
  getJournalEntries: () => Maybe<unknown[]>;
  getPayments: () => Maybe<unknown[]>;
  getFinancialSummary: () => Maybe<unknown>;
}

// ============ HR ============
export interface HRService {
  // Placeholder — HR pages do not exist yet.
  // Implementations may expose: getEmployees, getDepartments,
  // getLeaves, getAttendance, getPayroll, getContracts.
  [key: string]: unknown;
}

// ============ Manufacturing ============
export interface ManufacturingService {
  getWorkOrders: () => Maybe<unknown[]>;
  getWorkCenters: () => Maybe<unknown[]>;
  getBOMs: () => Maybe<unknown[]>;
  getECOs?: () => Maybe<unknown[]>;
}

// ============ Settings ============
export interface SettingsService {
  // RBAC
  getRoles: () => Maybe<unknown[]>;
  getUserRole: (userId: string) => Maybe<unknown>;
  canAccessRoute: (path: string, userId?: string) => Maybe<boolean>;
  // Audit
  getAuditLogs: () => Maybe<unknown[]>;
  addAuditLog: (entry: unknown) => Maybe<unknown>;
}