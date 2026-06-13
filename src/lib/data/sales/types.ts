// Sales & Quotations Types

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'converted' | 'expired' | 'cancelled';
// Modern B2C 5-stage workflow. Legacy 'draft' / 'locked' kept for back-compat
// (mapped via DB migration: draft→estimate, locked→ready_to_pick).
export type SalesOrderStatus =
  | 'estimate'
  | 'confirmed'
  | 'paid'
  | 'invoiced'
  | 'ready_to_pick'
  | 'dispatched'
  | 'delivered'
  | 'cancelled'
  // Phase 2 — extended workflow states
  | 'awaiting_advance'
  | 'fulfilling'
  | 'ready_to_invoice'
  | 'invoicing'
  | 'delivering'
  | 'closed'
  // Legacy values kept so existing localStorage / DB rows still type-check.
  | 'draft'
  | 'locked';
export type SubscriptionStatus = 'draft' | 'active' | 'paused' | 'cancelled';
export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';
export type TaxType = 'inclusive' | 'exclusive';
export type DiscountType = 'percentage' | 'fixed';

// B2C custom location & loyalty types ----------------------------------------
export type LocationType = 'house' | 'flat' | 'office';
export type LoyaltyTier = 'bronze' | 'silver' | 'gold';
export type LinePerLineDiscountType =
  | 'flat_order'
  | 'item'
  | 'loyalty'
  | 'seasonal'
  | null;
export type OrderDiscountType = 'percent' | 'amount' | null;
export type GSTType = 'cgst_sgst' | 'igst';

/** Where a sales-order line is being sourced from. */
export type ProductSource = 'display' | 'warehouse' | 'vendor' | 'factory';

/** Predefined customization option types attached to a product. */
export type ProductCustomizationOptionType = 'size' | 'colour' | 'fabric' | 'polish';

export interface ProductCustomizationOption {
  id: string;
  productId: string;
  optionType: ProductCustomizationOptionType;
  optionValue: string;
  additionalPrice: number;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Reusable B2C billing/delivery address block. Used as a mixin on Quotation
 * and SalesOrder. All fields are optional at the type level so legacy records
 * keep validating; runtime form validation enforces required-ness.
 */
export interface B2CAddressFields {
  // Billing
  billingCustomerName?: string;
  billingPhone1?: string;
  billingPhone2?: string;
  billingName?: string;
  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingCity?: string;
  billingState?: string;
  billingZip?: string;
  billingLocationType?: LocationType;
  billingRoadAvailableForTempo?: boolean;
  billingFloorNumber?: number;
  billingCargoElevator?: boolean;
  billingStaircaseWidth?: number;
  billingStaircaseHeight?: number;
  billingGSTIN?: string;
  billingOfficeFloorNumber?: number;
  billingOfficeCargoElevator?: boolean;
  billingOfficeStaircaseWidth?: number;
  billingOfficeStaircaseHeight?: number;

  // Delivery
  deliverySameAsBilling?: boolean;
  deliveryName?: string;
  deliveryAddressLine1?: string;
  deliveryAddressLine2?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryZip?: string;
  deliveryLocationType?: LocationType;
  deliveryRoadAvailableForTempo?: boolean;
  deliveryFloorNumber?: number;
  deliveryCargoElevator?: boolean;
  deliveryStaircaseWidth?: number;
  deliveryStaircaseHeight?: number;
  deliveryGSTIN?: string;
  deliveryOfficeFloorNumber?: number;
  deliveryOfficeCargoElevator?: boolean;
  deliveryOfficeStaircaseWidth?: number;
  deliveryOfficeStaircaseHeight?: number;
}

/** B2C per-line custom fields. All optional for back-compat. */
export interface B2CLineFields {
  barcode?: string;
  customization?: string;
  units?: number;                  // alias of `quantity` for B2C UI
  netAmount?: number;              // units × unitPrice
  gstRate?: number;                // single GST % rate per product
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  perLineDiscountType?: LinePerLineDiscountType;
  discountValue?: number;
  discountAmount?: number;
  finalAmount?: number;
}

/** B2C order summary fields. All optional for back-compat. */
export interface B2COrderSummary {
  totalUntaxed?: number;
  totalCGST?: number;
  totalSGST?: number;
  totalIGST?: number;
  totalGST?: number;
  grandTotal?: number;
  gstType?: GSTType;
  orderDiscountType?: OrderDiscountType;
  orderDiscountValue?: number;
  orderDiscountAmount?: number;
  // Loyalty
  pointsRedeemed?: number;
  pointsEarned?: number;
  redemptionAmount?: number;
}

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
  // B2C extension — see B2CLineFields
  barcode?: string;
  customization?: string;
  units?: number;
  netAmount?: number;
  gstRate?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  perLineDiscountType?: LinePerLineDiscountType;
  discountValue?: number;
  discountAmount?: number;
  finalAmount?: number;
}

export interface QuotationVersion {
  version: number;
  data: Omit<Quotation, 'versions'>;
  createdAt: string;
  createdBy: string;
  changeNotes?: string;
}

export interface Quotation extends B2CAddressFields, B2COrderSummary {
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
  // B2C extension — see B2CLineFields
  barcode?: string;
  customization?: string;
  units?: number;
  netAmount?: number;
  gstRate?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  perLineDiscountType?: LinePerLineDiscountType;
  discountValue?: number;
  discountAmount?: number;
  finalAmount?: number;

  // Phase 2 — enhanced sourcing & customization
  productSource?: ProductSource;
  customizationSize?: string;
  customizationColour?: string;
  customizationFabric?: string;
  customizationPolish?: string;
  customizationNotes?: string;
  customizationReferenceImages?: string[];
  lineEta?: string;
  vendorId?: string;
  factoryWorkOrderId?: string;
}

export interface OrderActivity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details?: string;
  timestamp: string;
}

export interface SalesOrder extends B2CAddressFields, B2COrderSummary {
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

  // Payment (recorded before invoice in GLF workflow)
  paidAmount?: number;
  paymentDate?: string;
  paymentMethod?: string;
  paymentReference?: string;

  // Phase 2 — enhanced SO workflow fields
  noQuoteFlag?: boolean;
  advancePercentRequired?: number;
  advancePercentReceived?: number;
  advanceOverrideBy?: string;
  advanceOverrideReason?: string;
  advanceOverrideAt?: string;
  termsAndConditions?: string;
  customerSignatureReceived?: boolean;
  customerSignatureDate?: string;
  etaOverall?: string;

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
