// Sales module storage operations

import { getItem, setItem } from '../../storage';
import type {
  Quotation,
  SalesOrder,
  Pricelist,
  TaxRule,
  FiscalPosition,
  Subscription,
  SalesCustomer,
  SalesRolePermissions,
  QuotationLine,
  SalesOrderLine,
} from './types';
import { getProducts } from '../inventory';

// Default Tax Rules
const DEFAULT_TAX_RULES: TaxRule[] = [
  { id: 'tax_18', name: 'GST 18%', code: 'GST18', rate: 18, type: 'exclusive', isActive: true },
  { id: 'tax_12', name: 'GST 12%', code: 'GST12', rate: 12, type: 'exclusive', isActive: true },
  { id: 'tax_5', name: 'GST 5%', code: 'GST5', rate: 5, type: 'exclusive', isActive: true },
  { id: 'tax_0', name: 'Zero Rate', code: 'ZERO', rate: 0, type: 'exclusive', isActive: true },
  { id: 'tax_exempt', name: 'Exempt', code: 'EXEMPT', rate: 0, type: 'exclusive', isActive: true },
];

// Default Pricelists
const DEFAULT_PRICELISTS: Pricelist[] = [
  {
    id: 'pl_standard',
    name: 'Standard Pricelist',
    code: 'STD',
    currency: 'USD',
    isActive: true,
    isDefault: true,
    rules: [],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'pl_wholesale',
    name: 'Wholesale Pricelist',
    code: 'WHL',
    currency: 'USD',
    isActive: true,
    isDefault: false,
    rules: [
      { id: 'r1', minQuantity: 10, discountPercentage: 10 },
      { id: 'r2', minQuantity: 50, discountPercentage: 15 },
      { id: 'r3', minQuantity: 100, discountPercentage: 20 },
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'pl_vip',
    name: 'VIP Customer Pricelist',
    code: 'VIP',
    currency: 'USD',
    isActive: true,
    isDefault: false,
    rules: [
      { id: 'r4', minQuantity: 1, discountPercentage: 15 },
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

// Default Fiscal Positions
const DEFAULT_FISCAL_POSITIONS: FiscalPosition[] = [
  {
    id: 'fp_domestic',
    name: 'Domestic',
    code: 'DOM',
    taxMappings: [],
    isActive: true,
  },
  {
    id: 'fp_export',
    name: 'Export (Tax Free)',
    code: 'EXP',
    taxMappings: [
      { fromTaxId: 'tax_18', toTaxId: 'tax_0' },
      { fromTaxId: 'tax_12', toTaxId: 'tax_0' },
      { fromTaxId: 'tax_5', toTaxId: 'tax_0' },
    ],
    isActive: true,
  },
];

// Default Quotations
const DEFAULT_QUOTATIONS: Quotation[] = [
  {
    id: 'qt_1',
    reference: 'QT-2025-001',
    customerId: '1',
    customerName: 'John Smith',
    contactName: 'John Smith',
    quotationDate: '2025-01-20',
    validUntil: '2025-02-20',
    salespersonName: 'Sales Manager',
    currency: 'USD',
    pricelistId: 'pl_standard',
    paymentTerms: 'Net 30',
    lines: [
      {
        id: 'ql_1',
        productId: '2',
        productName: 'Wooden Chair - Oak',
        quantity: 20,
        unitPrice: 4999,
        discount: 10,
        discountType: 'percentage',
        taxIds: ['tax_18'],
        subtotal: 89982,
        taxAmount: 16196.76,
        total: 106178.76,
      },
    ],
    globalDiscount: 0,
    globalDiscountType: 'percentage',
    subtotal: 89982,
    discountAmount: 9998,
    taxAmount: 16196.76,
    total: 106178.76,
    notes: 'Thank you for your business!',
    termsAndConditions: 'Standard terms apply. Delivery within 2 weeks of order confirmation.',
    status: 'sent',
    sentAt: '2025-01-21T10:00:00Z',
    currentVersion: 1,
    versions: [],
    createdBy: 'Sales Manager',
    createdAt: '2025-01-20T10:00:00Z',
    updatedAt: '2025-01-21T10:00:00Z',
  },
  {
    id: 'qt_2',
    reference: 'QT-2025-002',
    customerId: '2',
    customerName: 'Sarah Johnson',
    contactName: 'Sarah Johnson',
    quotationDate: '2025-01-22',
    validUntil: '2025-02-22',
    salespersonName: 'Sales Rep',
    currency: 'USD',
    pricelistId: 'pl_vip',
    paymentTerms: 'Net 15',
    lines: [
      {
        id: 'ql_2',
        productId: '3',
        productName: 'Office Desk - Modern',
        quantity: 5,
        unitPrice: 15999,
        discount: 0,
        discountType: 'percentage',
        taxIds: ['tax_18'],
        subtotal: 79995,
        taxAmount: 14399.1,
        total: 94394.1,
      },
    ],
    globalDiscount: 5,
    globalDiscountType: 'percentage',
    subtotal: 79995,
    discountAmount: 3999.75,
    taxAmount: 13679.15,
    total: 89674.4,
    status: 'draft',
    currentVersion: 1,
    versions: [],
    createdBy: 'Sales Rep',
    createdAt: '2025-01-22T14:00:00Z',
    updatedAt: '2025-01-22T14:00:00Z',
  },
];

// Default Sales Orders
const DEFAULT_SALES_ORDERS: SalesOrder[] = [
  {
    id: 'so_1',
    reference: 'SO-2025-001',
    quotationId: 'qt_accepted',
    customerId: '1',
    customerName: 'John Smith - Acme Corp',
    deliveryAddress: '123 Main St, Business District',
    billingAddress: '123 Main St, Business District',
    orderDate: '2025-01-20',
    commitmentDate: '2025-02-05',
    deliveryDate: '2025-02-05',
    salespersonName: 'Sales Manager',
    currency: 'USD',
    paymentTerms: 'Net 30',
    lines: [
      {
        id: 'sol_1',
        productId: '2',
        productName: 'Wooden Chair - Oak',
        quantity: 10,
        deliveredQuantity: 0,
        invoicedQuantity: 0,
        unitPrice: 4999,
        discount: 5,
        discountType: 'percentage',
        taxIds: ['tax_18'],
        subtotal: 47490.5,
        taxAmount: 8548.29,
        total: 56038.79,
        reservedStock: true,
      },
    ],
    subtotal: 47490.5,
    discountAmount: 2499.5,
    taxAmount: 8548.29,
    total: 56038.79,
    status: 'confirmed',
    confirmedAt: '2025-01-20T11:00:00Z',
    confirmedBy: 'Sales Manager',
    deliveryStatus: 'pending',
    invoiceStatus: 'not_invoiced',
    activities: [
      {
        id: 'act_1',
        userId: '1',
        userName: 'Sales Manager',
        action: 'Order created',
        timestamp: '2025-01-20T10:00:00Z',
      },
      {
        id: 'act_2',
        userId: '1',
        userName: 'Sales Manager',
        action: 'Order confirmed',
        timestamp: '2025-01-20T11:00:00Z',
      },
    ],
    createdBy: 'Sales Manager',
    createdAt: '2025-01-20T10:00:00Z',
    updatedAt: '2025-01-20T11:00:00Z',
  },
];

// Default Subscriptions
const DEFAULT_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'sub_1',
    reference: 'SUB-2025-001',
    customerId: '1',
    customerName: 'John Smith - Acme Corp',
    status: 'active',
    billingCycle: 'monthly',
    startDate: '2025-01-01',
    nextBillingDate: '2025-02-01',
    lines: [
      {
        id: 'subl_1',
        productId: 'service_1',
        productName: 'Maintenance Service',
        quantity: 1,
        unitPrice: 500,
        discount: 0,
      },
    ],
    subtotal: 500,
    taxAmount: 90,
    total: 590,
    currency: 'USD',
    orderHistory: [],
    createdBy: 'Sales Manager',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

// Default Sales Role Permissions
const DEFAULT_SALES_PERMISSIONS: SalesRolePermissions[] = [
  {
    roleId: 'super_admin',
    permissions: [
      'view_quotations', 'create_quotations', 'edit_quotations', 'delete_quotations',
      'send_quotations', 'confirm_quotations', 'view_orders', 'create_orders',
      'edit_orders', 'delete_orders', 'confirm_orders', 'cancel_orders', 'lock_orders',
      'manage_pricelists', 'apply_extra_discount', 'modify_taxes', 'view_reports', 'export_data',
    ],
    recordScope: 'all',
  },
  {
    roleId: 'sales_manager',
    permissions: [
      'view_quotations', 'create_quotations', 'edit_quotations', 'delete_quotations',
      'send_quotations', 'confirm_quotations', 'view_orders', 'create_orders',
      'edit_orders', 'confirm_orders', 'cancel_orders', 'lock_orders',
      'manage_pricelists', 'apply_extra_discount', 'view_reports', 'export_data',
    ],
    maxDiscountPercentage: 30,
    recordScope: 'team',
  },
  {
    roleId: 'sales_rep',
    permissions: [
      'view_quotations', 'create_quotations', 'edit_quotations',
      'send_quotations', 'view_orders', 'create_orders', 'view_reports',
    ],
    maxDiscountPercentage: 15,
    recordScope: 'own',
  },
  {
    roleId: 'read_only',
    permissions: ['view_quotations', 'view_orders', 'view_reports'],
    recordScope: 'all',
  },
];

// Quotations CRUD
export function getQuotations(): Quotation[] {
  return getItem<Quotation[]>('sales_quotations', DEFAULT_QUOTATIONS);
}

export function getQuotation(id: string): Quotation | undefined {
  return getQuotations().find((q) => q.id === id);
}

export function saveQuotation(quotation: Quotation): Quotation {
  const quotations = getQuotations();
  const index = quotations.findIndex((q) => q.id === quotation.id);
  
  const now = new Date().toISOString();
  
  if (index >= 0) {
    quotations[index] = { ...quotation, updatedAt: now };
  } else {
    const newQuotation = {
      ...quotation,
      id: quotation.id || crypto.randomUUID(),
      reference: quotation.reference || generateQuotationReference(),
      createdAt: now,
      updatedAt: now,
    };
    quotations.push(newQuotation);
    setItem('sales_quotations', quotations);
    return newQuotation;
  }
  
  setItem('sales_quotations', quotations);
  return quotations[index];
}

export function deleteQuotation(id: string): void {
  const quotations = getQuotations().filter((q) => q.id !== id);
  setItem('sales_quotations', quotations);
}

export function generateQuotationReference(): string {
  const quotations = getQuotations();
  const year = new Date().getFullYear();
  const count = quotations.filter((q) => q.reference.includes(`${year}`)).length + 1;
  return `QT-${year}-${String(count).padStart(4, '0')}`;
}

// Sales Orders CRUD
export function getSalesOrders(): SalesOrder[] {
  return getItem<SalesOrder[]>('sales_orders', DEFAULT_SALES_ORDERS);
}

export function getSalesOrder(id: string): SalesOrder | undefined {
  return getSalesOrders().find((o) => o.id === id);
}

export function saveSalesOrder(order: SalesOrder): SalesOrder {
  const orders = getSalesOrders();
  const index = orders.findIndex((o) => o.id === order.id);
  
  const now = new Date().toISOString();
  
  if (index >= 0) {
    // Prevent editing locked orders
    if (orders[index].status === 'locked' && order.status !== 'cancelled') {
      throw new Error('Cannot edit locked orders');
    }
    orders[index] = { ...order, updatedAt: now };
  } else {
    const newOrder = {
      ...order,
      id: order.id || crypto.randomUUID(),
      reference: order.reference || generateOrderReference(),
      createdAt: now,
      updatedAt: now,
    };
    orders.push(newOrder);
    setItem('sales_orders', orders);
    return newOrder;
  }
  
  setItem('sales_orders', orders);
  return orders[index];
}

export function deleteSalesOrder(id: string): void {
  const order = getSalesOrder(id);
  if (order?.status === 'locked') {
    throw new Error('Cannot delete locked orders');
  }
  const orders = getSalesOrders().filter((o) => o.id !== id);
  setItem('sales_orders', orders);
}

export function generateOrderReference(): string {
  const orders = getSalesOrders();
  const year = new Date().getFullYear();
  const count = orders.filter((o) => o.reference.includes(`${year}`)).length + 1;
  return `SO-${year}-${String(count).padStart(4, '0')}`;
}

// Pricelists CRUD
export function getPricelists(): Pricelist[] {
  return getItem<Pricelist[]>('sales_pricelists', DEFAULT_PRICELISTS);
}

export function getPricelist(id: string): Pricelist | undefined {
  return getPricelists().find((p) => p.id === id);
}

export function savePricelist(pricelist: Pricelist): void {
  const pricelists = getPricelists();
  const index = pricelists.findIndex((p) => p.id === pricelist.id);
  
  if (index >= 0) {
    pricelists[index] = { ...pricelist, updatedAt: new Date().toISOString() };
  } else {
    pricelists.push({
      ...pricelist,
      id: pricelist.id || crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  
  setItem('sales_pricelists', pricelists);
}

export function deletePricelist(id: string): void {
  const pricelist = getPricelist(id);
  if (pricelist?.isDefault) {
    throw new Error('Cannot delete default pricelist');
  }
  const pricelists = getPricelists().filter((p) => p.id !== id);
  setItem('sales_pricelists', pricelists);
}

// Tax Rules CRUD
export function getTaxRules(): TaxRule[] {
  return getItem<TaxRule[]>('sales_tax_rules', DEFAULT_TAX_RULES);
}

export function getTaxRule(id: string): TaxRule | undefined {
  return getTaxRules().find((t) => t.id === id);
}

export function saveTaxRule(taxRule: TaxRule): void {
  const taxRules = getTaxRules();
  const index = taxRules.findIndex((t) => t.id === taxRule.id);
  
  if (index >= 0) {
    taxRules[index] = taxRule;
  } else {
    taxRules.push({ ...taxRule, id: taxRule.id || crypto.randomUUID() });
  }
  
  setItem('sales_tax_rules', taxRules);
}

// Fiscal Positions
export function getFiscalPositions(): FiscalPosition[] {
  return getItem<FiscalPosition[]>('sales_fiscal_positions', DEFAULT_FISCAL_POSITIONS);
}

export function getFiscalPosition(id: string): FiscalPosition | undefined {
  return getFiscalPositions().find((f) => f.id === id);
}

// Subscriptions CRUD
export function getSubscriptions(): Subscription[] {
  return getItem<Subscription[]>('sales_subscriptions', DEFAULT_SUBSCRIPTIONS);
}

export function getSubscription(id: string): Subscription | undefined {
  return getSubscriptions().find((s) => s.id === id);
}

export function saveSubscription(subscription: Subscription): void {
  const subscriptions = getSubscriptions();
  const index = subscriptions.findIndex((s) => s.id === subscription.id);
  
  if (index >= 0) {
    subscriptions[index] = { ...subscription, updatedAt: new Date().toISOString() };
  } else {
    subscriptions.push({
      ...subscription,
      id: subscription.id || crypto.randomUUID(),
      reference: subscription.reference || generateSubscriptionReference(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  
  setItem('sales_subscriptions', subscriptions);
}

export function generateSubscriptionReference(): string {
  const subscriptions = getSubscriptions();
  const year = new Date().getFullYear();
  const count = subscriptions.filter((s) => s.reference.includes(`${year}`)).length + 1;
  return `SUB-${year}-${String(count).padStart(4, '0')}`;
}

// Sales Permissions
export function getSalesRolePermissions(): SalesRolePermissions[] {
  return getItem<SalesRolePermissions[]>('sales_role_permissions', DEFAULT_SALES_PERMISSIONS);
}

export function getSalesRolePermission(roleId: string): SalesRolePermissions | undefined {
  return getSalesRolePermissions().find((p) => p.roleId === roleId);
}

// Calculation Helpers
export function calculateLineTotal(
  unitPrice: number,
  quantity: number,
  discount: number,
  discountType: 'percentage' | 'fixed',
  taxIds: string[]
): { subtotal: number; taxAmount: number; total: number } {
  const taxRules = getTaxRules();
  
  let subtotal = unitPrice * quantity;
  
  // Apply discount
  if (discountType === 'percentage') {
    subtotal = subtotal * (1 - discount / 100);
  } else {
    subtotal = subtotal - discount;
  }
  
  // Calculate tax
  let taxAmount = 0;
  taxIds.forEach((taxId) => {
    const tax = taxRules.find((t) => t.id === taxId);
    if (tax) {
      if (tax.type === 'exclusive') {
        taxAmount += subtotal * (tax.rate / 100);
      } else {
        // Inclusive tax
        const baseAmount = subtotal / (1 + tax.rate / 100);
        taxAmount += subtotal - baseAmount;
      }
    }
  });
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round((subtotal + taxAmount) * 100) / 100,
  };
}

export function applyPricelistPrice(
  productId: string,
  quantity: number,
  pricelistId?: string
): number {
  const products = getProducts();
  const product = products.find((p) => p.id === productId);
  if (!product) return 0;
  
  let price = product.salePrice;
  
  if (pricelistId) {
    const pricelist = getPricelist(pricelistId);
    if (pricelist) {
      // Find applicable rule
      const applicableRules = pricelist.rules
        .filter((r) => {
          const matchesProduct = !r.productId || r.productId === productId;
          const matchesQuantity = quantity >= r.minQuantity;
          const matchesDate = (!r.startDate || new Date() >= new Date(r.startDate)) &&
                              (!r.endDate || new Date() <= new Date(r.endDate));
          return matchesProduct && matchesQuantity && matchesDate;
        })
        .sort((a, b) => b.minQuantity - a.minQuantity);
      
      if (applicableRules.length > 0) {
        const rule = applicableRules[0];
        if (rule.price !== undefined) {
          price = rule.price;
        } else if (rule.discountPercentage !== undefined) {
          price = price * (1 - rule.discountPercentage / 100);
        }
      }
    }
  }
  
  return Math.round(price * 100) / 100;
}

// Check stock availability
export function checkStockAvailability(productId: string, quantity: number): {
  available: boolean;
  stockOnHand: number;
  shortfall: number;
} {
  const products = getProducts();
  const product = products.find((p) => p.id === productId);
  
  if (!product) {
    return { available: false, stockOnHand: 0, shortfall: quantity };
  }
  
  return {
    available: product.stockOnHand >= quantity,
    stockOnHand: product.stockOnHand,
    shortfall: Math.max(0, quantity - product.stockOnHand),
  };
}

// Convert quotation to order
export function convertQuotationToOrder(quotationId: string, userId: string, userName: string): SalesOrder | null {
  const quotation = getQuotation(quotationId);
  if (!quotation || quotation.status !== 'accepted') return null;
  
  const orderLines: SalesOrderLine[] = quotation.lines.map((line) => ({
    ...line,
    deliveredQuantity: 0,
    invoicedQuantity: 0,
    reservedStock: false,
  }));
  
  const order: SalesOrder = {
    id: crypto.randomUUID(),
    reference: generateOrderReference(),
    quotationId: quotation.id,
    customerId: quotation.customerId,
    customerName: quotation.customerName,
    contactId: quotation.contactId,
    contactName: quotation.contactName,
    orderDate: new Date().toISOString().split('T')[0],
    salespersonId: quotation.salespersonId,
    salespersonName: quotation.salespersonName,
    salesTeam: quotation.salesTeam,
    currency: quotation.currency,
    pricelistId: quotation.pricelistId,
    paymentTerms: quotation.paymentTerms,
    lines: orderLines,
    subtotal: quotation.subtotal,
    discountAmount: quotation.discountAmount,
    taxAmount: quotation.taxAmount,
    total: quotation.total,
    notes: quotation.notes,
    status: 'draft',
    deliveryStatus: 'pending',
    invoiceStatus: 'not_invoiced',
    activities: [
      {
        id: crypto.randomUUID(),
        userId,
        userName,
        action: 'Order created from quotation',
        details: `Converted from ${quotation.reference}`,
        timestamp: new Date().toISOString(),
      },
    ],
    createdBy: userName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  // Update quotation
  saveQuotation({ ...quotation, convertedToOrderId: order.id });
  
  // Save order
  return saveSalesOrder(order);
}
