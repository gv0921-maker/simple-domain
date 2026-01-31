// Sales & Quotations Types

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'expired' | 'cancelled';
export type SalesOrderStatus = 'draft' | 'confirmed' | 'locked' | 'cancelled';
export type SubscriptionStatus = 'draft' | 'active' | 'paused' | 'cancelled';
export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';
export type TaxType = 'inclusive' | 'exclusive';
export type DiscountType = 'percentage' | 'fixed';

// Quotation Interfaces
export interface QuotationLine {
  id: string;
  productId: string;
  productName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  discountType: DiscountType;
  taxIds: string[];
  subtotal: number;
  taxAmount: number;
  total: number;
  stockAvailable?: number;
}

export interface QuotationVersion {
  version: number;
  data: Omit<Quotation, 'versions'>;
  createdAt: string;
  createdBy: string;
  changeNotes?: string;
}

export interface Quotation {
  id: string;
  reference: string;
  customerId: string;
  customerName: string;
  contactId?: string;
  contactName?: string;
  opportunityId?: string;
  
  // Dates
  quotationDate: string;
  validUntil: string;
  
  // Assignment
  salespersonId?: string;
  salespersonName?: string;
  salesTeam?: string;
  
  // Pricing
  currency: string;
  pricelistId?: string;
  paymentTerms?: string;
  
  // Lines & Totals
  lines: QuotationLine[];
  globalDiscount: number;
  globalDiscountType: DiscountType;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  
  // Content
  notes?: string;
  termsAndConditions?: string;
  
  // Status & Workflow
  status: QuotationStatus;
  sentAt?: string;
  acceptedAt?: string;
  convertedToOrderId?: string;
  
  // Versioning
  currentVersion: number;
  versions: QuotationVersion[];
  
  // Audit
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Sales Order Interfaces
export interface SalesOrderLine {
  id: string;
  productId: string;
  productName: string;
  description?: string;
  quantity: number;
  deliveredQuantity: number;
  invoicedQuantity: number;
  unitPrice: number;
  discount: number;
  discountType: DiscountType;
  taxIds: string[];
  subtotal: number;
  taxAmount: number;
  total: number;
  reservedStock: boolean;
}

export interface OrderActivity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details?: string;
  timestamp: string;
}

export interface SalesOrder {
  id: string;
  reference: string;
  quotationId?: string;
  
  // Customer
  customerId: string;
  customerName: string;
  contactId?: string;
  contactName?: string;
  
  // Addresses
  deliveryAddress?: string;
  billingAddress?: string;
  
  // Dates
  orderDate: string;
  commitmentDate?: string;
  deliveryDate?: string;
  
  // Assignment
  salespersonId?: string;
  salespersonName?: string;
  salesTeam?: string;
  
  // Pricing
  currency: string;
  pricelistId?: string;
  paymentTerms?: string;
  fiscalPositionId?: string;
  
  // Lines & Totals
  lines: SalesOrderLine[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  
  // Content
  notes?: string;
  
  // Status & Workflow
  status: SalesOrderStatus;
  lockedAt?: string;
  lockedBy?: string;
  confirmedAt?: string;
  confirmedBy?: string;
  
  // Integration
  deliveryStatus?: 'pending' | 'partial' | 'done';
  invoiceStatus?: 'not_invoiced' | 'partial' | 'invoiced';
  invoiceIds?: string[];
  
  // Timeline
  activities: OrderActivity[];
  
  // Audit
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Pricelist Interfaces
export interface PricelistRule {
  id: string;
  productId?: string;
  categoryId?: string;
  minQuantity: number;
  price?: number;
  discountPercentage?: number;
  startDate?: string;
  endDate?: string;
}

export interface Pricelist {
  id: string;
  name: string;
  code: string;
  currency: string;
  isActive: boolean;
  isDefault: boolean;
  parentPricelistId?: string; // Inheritance
  rules: PricelistRule[];
  createdAt: string;
  updatedAt: string;
}

// Tax & Fiscal Interfaces
export interface TaxRule {
  id: string;
  name: string;
  code: string;
  rate: number;
  type: TaxType;
  isActive: boolean;
  description?: string;
}

export interface FiscalPosition {
  id: string;
  name: string;
  code: string;
  countryCode?: string;
  taxMappings: { fromTaxId: string; toTaxId: string }[];
  isActive: boolean;
}

// Subscription Interfaces
export interface SubscriptionLine {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export interface Subscription {
  id: string;
  reference: string;
  customerId: string;
  customerName: string;
  
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  
  startDate: string;
  nextBillingDate: string;
  endDate?: string;
  
  lines: SubscriptionLine[];
  subtotal: number;
  taxAmount: number;
  total: number;
  
  currency: string;
  paymentTerms?: string;
  
  lastOrderId?: string;
  orderHistory: string[];
  
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Customer/Contact for Sales
export interface SalesCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  type: 'individual' | 'company';
  
  // Addresses
  defaultBillingAddress?: string;
  defaultDeliveryAddress?: string;
  
  // Sales defaults
  defaultPricelistId?: string;
  defaultPaymentTerms?: string;
  fiscalPositionId?: string;
  salespersonId?: string;
  creditLimit?: number;
  
  // Portal
  portalEnabled: boolean;
  portalToken?: string;
  
  tags: string[];
  notes?: string;
  
  createdAt: string;
  updatedAt: string;
}

// Sales Permissions
export type SalesPermission = 
  | 'view_quotations'
  | 'create_quotations'
  | 'edit_quotations'
  | 'delete_quotations'
  | 'send_quotations'
  | 'confirm_quotations'
  | 'view_orders'
  | 'create_orders'
  | 'edit_orders'
  | 'delete_orders'
  | 'confirm_orders'
  | 'cancel_orders'
  | 'lock_orders'
  | 'manage_pricelists'
  | 'apply_extra_discount'
  | 'modify_taxes'
  | 'view_reports'
  | 'export_data';

export interface SalesRolePermissions {
  roleId: string;
  permissions: SalesPermission[];
  maxDiscountPercentage?: number;
  recordScope: 'own' | 'team' | 'company' | 'all';
}
