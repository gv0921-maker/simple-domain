// Sales module — Supabase-backed async API.
//
// This sits alongside the legacy localStorage exports in
// `@/lib/services/sales` and is consumed via TanStack Query hooks in
// `@/hooks/sales`. Pages are migrated incrementally; do NOT remove the
// legacy exports until every consumer is moved over.

import { supabase } from '@/integrations/supabase/client';
import type {
  Quotation, QuotationLine, QuotationVersion,
  SalesOrder, SalesOrderLine, OrderActivity,
  Subscription, SubscriptionLine,
  QuotationStatus, SalesOrderStatus,
} from '@/lib/data/sales/types';

// ---------- Row shapes (DB-aligned) ----------
export interface SbCustomer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  gstin: string | null;
  contactPerson: string | null;
  isActive: boolean;
  type: 'individual' | 'company';
  company: string | null;
  defaultBillingAddress: string | null;
  defaultDeliveryAddress: string | null;
  defaultPricelistId: string | null;
  defaultPaymentTerms: string | null;
  fiscalPositionId: string | null;
  salespersonId: string | null;
  creditLimit: number | null;
  portalEnabled: boolean;
  portalToken: string | null;
  tags: string[];
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SbQuotationLine {
  id: string;
  quotationId: string;
  productId: string | null;
  description: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  subtotal: number;
}

export interface SbQuotation {
  id: string;
  reference: string;
  customerId: string | null;
  date: string;
  expiryDate: string | null;
  status: string;
  notes: string | null;
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  lines?: SbQuotationLine[];
}

export interface SbOrderLine {
  id: string;
  orderId: string;
  productId: string | null;
  description: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  subtotal: number;
  deliveredQty: number;
}

export interface SbSalesOrder {
  id: string;
  reference: string;
  quotationId: string | null;
  customerId: string | null;
  orderDate: string;
  deliveryDate: string | null;
  status: string;
  notes: string | null;
  subtotal: number;
  taxAmount: number;
  total: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  lines?: SbOrderLine[];
}

export interface SbPricelistItem {
  id: string;
  pricelistId: string;
  productId: string | null;
  price: number;
  minQty: number;
  categoryId: string | null;
  discountPercentage: number | null;
  startDate: string | null;
  endDate: string | null;
}

export interface SbPricelist {
  id: string;
  name: string;
  currency: string;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  code: string | null;
  isDefault: boolean;
  parentPricelistId: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  items?: SbPricelistItem[];
}

export interface SbSubscription {
  id: string;
  customerId: string | null;
  productId: string | null;
  startDate: string;
  nextBillingDate: string | null;
  status: string;
  price: number;
  billingPeriod: string;
  reference: string | null;
  customerName: string | null;
  billingCycle: string;
  endDate: string | null;
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  paymentTerms: string | null;
  lastOrderId: string | null;
  orderHistory: string[];
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  lines?: SbSubscriptionLine[];
}

export interface SbSubscriptionLine {
  id: string;
  subscriptionId: string;
  productId: string | null;
  productName: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export interface SbOrderActivity {
  id: string;
  orderId: string;
  userId: string | null;
  userName: string | null;
  action: string;
  details: string | null;
  timestamp: string;
}

export interface SbQuotationVersion {
  id: string;
  quotationId: string;
  version: number;
  data: unknown;
  changeNotes: string | null;
  createdBy: string | null;
  createdAt: string;
}

// ---------- Mappers ----------
const mapCustomer = (r: any): SbCustomer => ({
  id: r.id, name: r.name, email: r.email, phone: r.phone, address: r.address,
  gstin: r.gstin, contactPerson: r.contact_person, isActive: r.is_active,
  type: (r.type ?? 'individual') as 'individual' | 'company',
  company: r.company ?? null,
  defaultBillingAddress: r.default_billing_address ?? null,
  defaultDeliveryAddress: r.default_delivery_address ?? null,
  defaultPricelistId: r.default_pricelist_id ?? null,
  defaultPaymentTerms: r.default_payment_terms ?? null,
  fiscalPositionId: r.fiscal_position_id ?? null,
  salespersonId: r.salesperson_id ?? null,
  creditLimit: r.credit_limit !== null && r.credit_limit !== undefined ? Number(r.credit_limit) : null,
  portalEnabled: !!r.portal_enabled,
  portalToken: r.portal_token ?? null,
  tags: Array.isArray(r.tags) ? r.tags : [],
  notes: r.notes ?? null,
  createdBy: r.created_by, createdAt: r.created_at, updatedAt: r.updated_at,
});
const mapQuotationLine = (r: any): SbQuotationLine => ({
  id: r.id, quotationId: r.quotation_id, productId: r.product_id,
  description: r.description, quantity: Number(r.quantity),
  unitPrice: Number(r.unit_price), discount: Number(r.discount),
  taxRate: Number(r.tax_rate), subtotal: Number(r.subtotal),
});
const mapQuotation = (r: any): SbQuotation => ({
  id: r.id, reference: r.reference, customerId: r.customer_id, date: r.date,
  expiryDate: r.expiry_date, status: r.status, notes: r.notes,
  subtotal: Number(r.subtotal), taxAmount: Number(r.tax_amount),
  total: Number(r.total), currency: r.currency, createdBy: r.created_by,
  createdAt: r.created_at, updatedAt: r.updated_at,
  lines: r.quotation_lines?.map(mapQuotationLine),
});
const mapOrderLine = (r: any): SbOrderLine => ({
  id: r.id, orderId: r.order_id, productId: r.product_id,
  description: r.description, quantity: Number(r.quantity),
  unitPrice: Number(r.unit_price), discount: Number(r.discount),
  taxRate: Number(r.tax_rate), subtotal: Number(r.subtotal),
  deliveredQty: Number(r.delivered_qty),
});
const mapSalesOrder = (r: any): SbSalesOrder => ({
  id: r.id, reference: r.reference, quotationId: r.quotation_id,
  customerId: r.customer_id, orderDate: r.order_date,
  deliveryDate: r.delivery_date, status: r.status, notes: r.notes,
  subtotal: Number(r.subtotal), taxAmount: Number(r.tax_amount),
  total: Number(r.total), createdBy: r.created_by,
  createdAt: r.created_at, updatedAt: r.updated_at,
  lines: r.order_lines?.map(mapOrderLine),
});
const mapPricelistItem = (r: any): SbPricelistItem => ({
  id: r.id, pricelistId: r.pricelist_id, productId: r.product_id,
  price: Number(r.price), minQty: Number(r.min_qty),
  categoryId: r.category_id ?? null,
  discountPercentage: r.discount_percentage !== null && r.discount_percentage !== undefined ? Number(r.discount_percentage) : null,
  startDate: r.start_date ?? null,
  endDate: r.end_date ?? null,
});
const mapPricelist = (r: any): SbPricelist => ({
  id: r.id, name: r.name, currency: r.currency, startDate: r.start_date,
  endDate: r.end_date, isActive: r.is_active, createdBy: r.created_by,
  code: r.code ?? null,
  isDefault: !!r.is_default,
  parentPricelistId: r.parent_pricelist_id ?? null,
  createdAt: r.created_at, updatedAt: r.updated_at,
  items: r.pricelist_items?.map(mapPricelistItem),
});
const mapSubscriptionLine = (r: any): SbSubscriptionLine => ({
  id: r.id, subscriptionId: r.subscription_id, productId: r.product_id,
  productName: r.product_name ?? null,
  quantity: Number(r.quantity), unitPrice: Number(r.unit_price),
  discount: Number(r.discount),
});
const mapSubscription = (r: any): SbSubscription => ({
  id: r.id, customerId: r.customer_id, productId: r.product_id,
  startDate: r.start_date, nextBillingDate: r.next_billing_date,
  status: r.status, price: Number(r.price), billingPeriod: r.billing_period,
  reference: r.reference ?? null,
  customerName: r.customer_name ?? null,
  billingCycle: r.billing_cycle ?? 'monthly',
  endDate: r.end_date ?? null,
  subtotal: Number(r.subtotal ?? 0),
  taxAmount: Number(r.tax_amount ?? 0),
  total: Number(r.total ?? 0),
  currency: r.currency ?? 'INR',
  paymentTerms: r.payment_terms ?? null,
  lastOrderId: r.last_order_id ?? null,
  orderHistory: Array.isArray(r.order_history) ? r.order_history : [],
  createdBy: r.created_by, createdAt: r.created_at, updatedAt: r.updated_at,
  lines: r.subscription_lines?.map(mapSubscriptionLine),
});
const mapOrderActivity = (r: any): SbOrderActivity => ({
  id: r.id, orderId: r.order_id, userId: r.user_id ?? null,
  userName: r.user_name ?? null, action: r.action,
  details: r.details ?? null, timestamp: r.timestamp,
});
const mapQuotationVersion = (r: any): SbQuotationVersion => ({
  id: r.id, quotationId: r.quotation_id, version: r.version,
  data: r.data, changeNotes: r.change_notes ?? null,
  createdBy: r.created_by ?? null, createdAt: r.created_at,
});

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// ---------- Customers ----------
export async function listCustomers(): Promise<SbCustomer[]> {
  const { data, error } = await supabase.from('customers' as any).select('*').order('name');
  if (error) throw error;
  return (data ?? []).map(mapCustomer);
}
export async function getCustomer(id: string): Promise<SbCustomer | null> {
  const { data, error } = await supabase.from('customers' as any).select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapCustomer(data) : null;
}
export async function saveCustomer(input: Partial<SbCustomer> & { name: string }): Promise<SbCustomer> {
  const uid = await currentUserId();
  const payload: any = {
    name: input.name,
    email: input.email ?? null,
    phone: input.phone ?? null,
    address: input.address ?? null,
    gstin: input.gstin ?? null,
    contact_person: input.contactPerson ?? null,
    is_active: input.isActive ?? true,
    type: input.type ?? 'individual',
    company: input.company ?? null,
    default_billing_address: input.defaultBillingAddress ?? null,
    default_delivery_address: input.defaultDeliveryAddress ?? null,
    default_pricelist_id: input.defaultPricelistId ?? null,
    default_payment_terms: input.defaultPaymentTerms ?? null,
    fiscal_position_id: input.fiscalPositionId ?? null,
    salesperson_id: input.salespersonId ?? null,
    credit_limit: input.creditLimit ?? null,
    portal_enabled: input.portalEnabled ?? false,
    portal_token: input.portalToken ?? null,
    tags: input.tags ?? [],
    notes: input.notes ?? null,
  };
  if (input.id) {
    const { data, error } = await supabase.from('customers' as any).update(payload).eq('id', input.id).select('*').single();
    if (error) throw error;
    return mapCustomer(data);
  }
  payload.created_by = uid;
  const { data, error } = await supabase.from('customers' as any).insert(payload).select('*').single();
  if (error) throw error;
  return mapCustomer(data);
}
export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await supabase.from('customers' as any).delete().eq('id', id);
  if (error) throw error;
}

// ---------- Quotations ----------
export async function listQuotations(): Promise<SbQuotation[]> {
  const { data, error } = await supabase
    .from('quotations' as any)
    .select('*, quotation_lines(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapQuotation);
}
export async function getQuotation(id: string): Promise<SbQuotation | null> {
  const { data, error } = await supabase
    .from('quotations' as any)
    .select('*, quotation_lines(*)')
    .eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapQuotation(data) : null;
}
export async function saveQuotation(input: Partial<SbQuotation> & { reference: string }, lines?: Array<Omit<SbQuotationLine, 'id' | 'quotationId'>>): Promise<SbQuotation> {
  const uid = await currentUserId();
  const payload: any = {
    reference: input.reference,
    customer_id: input.customerId ?? null,
    date: input.date ?? new Date().toISOString().slice(0, 10),
    expiry_date: input.expiryDate ?? null,
    status: input.status ?? 'draft',
    notes: input.notes ?? null,
    subtotal: input.subtotal ?? 0,
    tax_amount: input.taxAmount ?? 0,
    total: input.total ?? 0,
    currency: input.currency ?? 'INR',
  };
  let quotationId = input.id;
  if (quotationId) {
    const { error } = await supabase.from('quotations' as any).update(payload).eq('id', quotationId);
    if (error) throw error;
  } else {
    payload.created_by = uid;
    const { data, error } = await supabase.from('quotations' as any).insert(payload).select('id').single();
    if (error) throw error;
    quotationId = (data as any).id;
  }
  if (lines) {
    await supabase.from('quotation_lines' as any).delete().eq('quotation_id', quotationId);
    if (lines.length) {
      const rows = lines.map(l => ({
        quotation_id: quotationId,
        product_id: l.productId,
        description: l.description,
        quantity: l.quantity,
        unit_price: l.unitPrice,
        discount: l.discount,
        tax_rate: l.taxRate,
        subtotal: l.subtotal,
      }));
      const { error } = await supabase.from('quotation_lines' as any).insert(rows);
      if (error) throw error;
    }
  }
  const result = await getQuotation(quotationId!);
  return result!;
}
export async function deleteQuotation(id: string): Promise<void> {
  const { error } = await supabase.from('quotations' as any).delete().eq('id', id);
  if (error) throw error;
}

// ---------- Sales Orders ----------
export async function listSalesOrders(): Promise<SbSalesOrder[]> {
  const { data, error } = await supabase
    .from('sales_orders' as any)
    .select('*, order_lines(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapSalesOrder);
}
export async function getSalesOrder(id: string): Promise<SbSalesOrder | null> {
  const { data, error } = await supabase
    .from('sales_orders' as any)
    .select('*, order_lines(*)')
    .eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapSalesOrder(data) : null;
}
export async function saveSalesOrder(input: Partial<SbSalesOrder> & { reference: string }, lines?: Array<Omit<SbOrderLine, 'id' | 'orderId'>>): Promise<SbSalesOrder> {
  const uid = await currentUserId();
  const payload: any = {
    reference: input.reference,
    quotation_id: input.quotationId ?? null,
    customer_id: input.customerId ?? null,
    order_date: input.orderDate ?? new Date().toISOString().slice(0, 10),
    delivery_date: input.deliveryDate ?? null,
    status: input.status ?? 'draft',
    notes: input.notes ?? null,
    subtotal: input.subtotal ?? 0,
    tax_amount: input.taxAmount ?? 0,
    total: input.total ?? 0,
  };
  let orderId = input.id;
  if (orderId) {
    const { error } = await supabase.from('sales_orders' as any).update(payload).eq('id', orderId);
    if (error) throw error;
  } else {
    payload.created_by = uid;
    const { data, error } = await supabase.from('sales_orders' as any).insert(payload).select('id').single();
    if (error) throw error;
    orderId = (data as any).id;
  }
  if (lines) {
    await supabase.from('order_lines' as any).delete().eq('order_id', orderId);
    if (lines.length) {
      const rows = lines.map(l => ({
        order_id: orderId,
        product_id: l.productId,
        description: l.description,
        quantity: l.quantity,
        unit_price: l.unitPrice,
        discount: l.discount,
        tax_rate: l.taxRate,
        subtotal: l.subtotal,
        delivered_qty: l.deliveredQty ?? 0,
      }));
      const { error } = await supabase.from('order_lines' as any).insert(rows);
      if (error) throw error;
    }
  }
  const result = await getSalesOrder(orderId!);
  return result!;
}
export async function deleteSalesOrder(id: string): Promise<void> {
  const { error } = await supabase.from('sales_orders' as any).delete().eq('id', id);
  if (error) throw error;
}

// ---------- Pricelists ----------
export async function listPricelists(): Promise<SbPricelist[]> {
  const { data, error } = await supabase
    .from('pricelists' as any)
    .select('*, pricelist_items(*)')
    .order('name');
  if (error) throw error;
  return (data ?? []).map(mapPricelist);
}
export async function getPricelist(id: string): Promise<SbPricelist | null> {
  const { data, error } = await supabase
    .from('pricelists' as any)
    .select('*, pricelist_items(*)')
    .eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapPricelist(data) : null;
}
export async function savePricelist(input: Partial<SbPricelist> & { name: string }, items?: Array<Omit<SbPricelistItem, 'id' | 'pricelistId'>>): Promise<SbPricelist> {
  const uid = await currentUserId();
  const payload: any = {
    name: input.name,
    currency: input.currency ?? 'INR',
    start_date: input.startDate ?? null,
    end_date: input.endDate ?? null,
    is_active: input.isActive ?? true,
    code: input.code ?? null,
    is_default: input.isDefault ?? false,
    parent_pricelist_id: input.parentPricelistId ?? null,
  };
  let pricelistId = input.id;
  if (pricelistId) {
    const { error } = await supabase.from('pricelists' as any).update(payload).eq('id', pricelistId);
    if (error) throw error;
  } else {
    payload.created_by = uid;
    const { data, error } = await supabase.from('pricelists' as any).insert(payload).select('id').single();
    if (error) throw error;
    pricelistId = (data as any).id;
  }
  if (items) {
    await supabase.from('pricelist_items' as any).delete().eq('pricelist_id', pricelistId);
    if (items.length) {
      const rows = items.map(i => ({
        pricelist_id: pricelistId,
        product_id: i.productId,
        price: i.price,
        min_qty: i.minQty,
        category_id: i.categoryId ?? null,
        discount_percentage: i.discountPercentage ?? null,
        start_date: i.startDate ?? null,
        end_date: i.endDate ?? null,
      }));
      const { error } = await supabase.from('pricelist_items' as any).insert(rows);
      if (error) throw error;
    }
  }
  const result = await getPricelist(pricelistId!);
  return result!;
}
export async function deletePricelist(id: string): Promise<void> {
  const { error } = await supabase.from('pricelists' as any).delete().eq('id', id);
  if (error) throw error;
}

// ---------- Subscriptions ----------
export async function listSubscriptions(): Promise<SbSubscription[]> {
  const { data, error } = await supabase
    .from('subscriptions' as any)
    .select('*, subscription_lines(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapSubscription);
}
export async function getSubscription(id: string): Promise<SbSubscription | null> {
  const { data, error } = await supabase
    .from('subscriptions' as any)
    .select('*, subscription_lines(*)')
    .eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapSubscription(data) : null;
}
export async function saveSubscription(
  input: Partial<SbSubscription>,
  lines?: Array<Omit<SbSubscriptionLine, 'id' | 'subscriptionId'>>,
): Promise<SbSubscription> {
  const uid = await currentUserId();
  const payload: any = {
    customer_id: input.customerId ?? null,
    product_id: input.productId ?? null,
    start_date: input.startDate ?? new Date().toISOString().slice(0, 10),
    next_billing_date: input.nextBillingDate ?? null,
    status: input.status ?? 'active',
    price: input.price ?? 0,
    billing_period: input.billingPeriod ?? 'monthly',
    reference: input.reference ?? null,
    customer_name: input.customerName ?? null,
    billing_cycle: input.billingCycle ?? 'monthly',
    end_date: input.endDate ?? null,
    subtotal: input.subtotal ?? 0,
    tax_amount: input.taxAmount ?? 0,
    total: input.total ?? 0,
    currency: input.currency ?? 'INR',
    payment_terms: input.paymentTerms ?? null,
    last_order_id: input.lastOrderId ?? null,
    order_history: input.orderHistory ?? [],
  };
  let subscriptionId = input.id;
  if (subscriptionId) {
    const { error } = await supabase.from('subscriptions' as any).update(payload).eq('id', subscriptionId);
    if (error) throw error;
  } else {
    payload.created_by = uid;
    const { data, error } = await supabase.from('subscriptions' as any).insert(payload).select('id').single();
    if (error) throw error;
    subscriptionId = (data as any).id;
  }
  if (lines) {
    await supabase.from('subscription_lines' as any).delete().eq('subscription_id', subscriptionId);
    if (lines.length) {
      const rows = lines.map(l => ({
        subscription_id: subscriptionId,
        product_id: l.productId,
        product_name: l.productName,
        quantity: l.quantity,
        unit_price: l.unitPrice,
        discount: l.discount,
      }));
      const { error } = await supabase.from('subscription_lines' as any).insert(rows);
      if (error) throw error;
    }
  }
  const result = await getSubscription(subscriptionId!);
  return result!;
}
export async function deleteSubscription(id: string): Promise<void> {
  const { error } = await supabase.from('subscriptions' as any).delete().eq('id', id);
  if (error) throw error;
}

// ---------- Order Activities ----------
export async function listOrderActivities(orderId: string): Promise<SbOrderActivity[]> {
  const { data, error } = await supabase
    .from('order_activities' as any)
    .select('*').eq('order_id', orderId)
    .order('timestamp', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapOrderActivity);
}
export async function addOrderActivity(
  input: Omit<SbOrderActivity, 'id' | 'timestamp'> & { timestamp?: string },
): Promise<SbOrderActivity> {
  const payload: any = {
    order_id: input.orderId,
    user_id: input.userId ?? null,
    user_name: input.userName ?? null,
    action: input.action,
    details: input.details ?? null,
  };
  if (input.timestamp) payload.timestamp = input.timestamp;
  const { data, error } = await supabase.from('order_activities' as any).insert(payload).select('*').single();
  if (error) throw error;
  return mapOrderActivity(data);
}

// ---------- Quotation Versions ----------
export async function listQuotationVersions(quotationId: string): Promise<SbQuotationVersion[]> {
  const { data, error } = await supabase
    .from('quotation_versions' as any)
    .select('*').eq('quotation_id', quotationId)
    .order('version', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapQuotationVersion);
}
export async function addQuotationVersion(
  input: Omit<SbQuotationVersion, 'id' | 'createdAt' | 'createdBy'> & { createdBy?: string | null },
): Promise<SbQuotationVersion> {
  const uid = input.createdBy ?? (await currentUserId());
  const { data, error } = await supabase.from('quotation_versions' as any).insert({
    quotation_id: input.quotationId,
    version: input.version,
    data: input.data as any,
    change_notes: input.changeNotes ?? null,
    created_by: uid,
  }).select('*').single();
  if (error) throw error;
  return mapQuotationVersion(data);
}

// ===========================================================================
// RICH legacy-shape adapters
// Round-trip the full Quotation / SalesOrder / Subscription types (B2C
// addresses, GST splits, versions, activities) used by the pages.
// ===========================================================================

const N = (v: any, d = 0): number =>
  v === null || v === undefined || v === '' ? d : Number(v);
const NOrUndef = (v: any): number | undefined =>
  v === null || v === undefined ? undefined : Number(v);
const SOrUndef = (v: any): string | undefined =>
  v === null || v === undefined ? undefined : (v as string);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuidOrNull = (v: unknown): string | null =>
  typeof v === 'string' && UUID_RE.test(v.trim()) ? v.trim() : null;

// ----- Quotation Lines -----
function mapQuotationLineRich(r: any): QuotationLine {
  return {
    id: r.id,
    productId: r.product_id ?? '',
    productName: r.product_name ?? '',
    description: r.description ?? undefined,
    quantity: N(r.quantity),
    unitPrice: N(r.unit_price),
    discount: N(r.discount),
    discountType: (r.discount_type ?? 'percentage') as any,
    taxIds: Array.isArray(r.tax_ids) ? r.tax_ids : [],
    subtotal: N(r.subtotal),
    taxAmount: N(r.tax_amount),
    total: N(r.total),
    stockAvailable: NOrUndef(r.stock_available),
    barcode: r.barcode ?? undefined,
    customization: r.customization ?? undefined,
    units: NOrUndef(r.units),
    netAmount: NOrUndef(r.net_amount),
    gstRate: NOrUndef(r.gst_rate),
    cgstAmount: NOrUndef(r.cgst_amount),
    sgstAmount: NOrUndef(r.sgst_amount),
    igstAmount: NOrUndef(r.igst_amount),
    perLineDiscountType: (r.per_line_discount_type ?? null) as any,
    discountValue: NOrUndef(r.discount_value),
    discountAmount: NOrUndef(r.discount_amount),
    finalAmount: NOrUndef(r.final_amount),
  };
}
function rowFromQuotationLine(l: QuotationLine, quotationId: string): any {
  return {
    quotation_id: quotationId,
    product_id: uuidOrNull(l.productId),
    product_name: l.productName ?? null,
    description: l.description ?? null,
    quantity: l.quantity ?? 0,
    unit_price: l.unitPrice ?? 0,
    discount: l.discount ?? 0,
    discount_type: l.discountType ?? 'percentage',
    tax_ids: l.taxIds ?? [],
    subtotal: l.subtotal ?? 0,
    tax_amount: l.taxAmount ?? 0,
    total: l.total ?? 0,
    tax_rate: 0,
    barcode: l.barcode ?? null,
    customization: l.customization ?? null,
    units: l.units ?? null,
    net_amount: l.netAmount ?? null,
    gst_rate: l.gstRate ?? null,
    cgst_amount: l.cgstAmount ?? null,
    sgst_amount: l.sgstAmount ?? null,
    igst_amount: l.igstAmount ?? null,
    per_line_discount_type: l.perLineDiscountType ?? null,
    discount_value: l.discountValue ?? null,
    discount_amount: l.discountAmount ?? null,
    final_amount: l.finalAmount ?? null,
  };
}

// ----- B2C address mappers -----
function mapB2CAddress(r: any): any {
  return {
    billingCustomerName: r.billing_customer_name ?? undefined,
    billingPhone1: r.billing_phone_1 ?? undefined,
    billingPhone2: r.billing_phone_2 ?? undefined,
    billingName: r.billing_name ?? undefined,
    billingAddressLine1: r.billing_address_line_1 ?? undefined,
    billingAddressLine2: r.billing_address_line_2 ?? undefined,
    billingCity: r.billing_city ?? undefined,
    billingState: r.billing_state ?? undefined,
    billingZip: r.billing_zip ?? undefined,
    billingLocationType: r.billing_location_type ?? undefined,
    billingRoadAvailableForTempo: r.billing_road_available_for_tempo ?? undefined,
    billingFloorNumber: NOrUndef(r.billing_floor_number),
    billingCargoElevator: r.billing_cargo_elevator ?? undefined,
    billingStaircaseWidth: NOrUndef(r.billing_staircase_width),
    billingStaircaseHeight: NOrUndef(r.billing_staircase_height),
    billingGSTIN: r.billing_gstin ?? undefined,
    billingOfficeFloorNumber: NOrUndef(r.billing_office_floor_number),
    billingOfficeCargoElevator: r.billing_office_cargo_elevator ?? undefined,
    billingOfficeStaircaseWidth: NOrUndef(r.billing_office_staircase_width),
    billingOfficeStaircaseHeight: NOrUndef(r.billing_office_staircase_height),
    deliverySameAsBilling: r.delivery_same_as_billing ?? undefined,
    deliveryName: r.delivery_name ?? undefined,
    deliveryAddressLine1: r.delivery_address_line_1 ?? undefined,
    deliveryAddressLine2: r.delivery_address_line_2 ?? undefined,
    deliveryCity: r.delivery_city ?? undefined,
    deliveryState: r.delivery_state ?? undefined,
    deliveryZip: r.delivery_zip ?? undefined,
    deliveryLocationType: r.delivery_location_type ?? undefined,
    deliveryRoadAvailableForTempo: r.delivery_road_available_for_tempo ?? undefined,
    deliveryFloorNumber: NOrUndef(r.delivery_floor_number),
    deliveryCargoElevator: r.delivery_cargo_elevator ?? undefined,
    deliveryStaircaseWidth: NOrUndef(r.delivery_staircase_width),
    deliveryStaircaseHeight: NOrUndef(r.delivery_staircase_height),
    deliveryGSTIN: r.delivery_gstin ?? undefined,
    deliveryOfficeFloorNumber: NOrUndef(r.delivery_office_floor_number),
    deliveryOfficeCargoElevator: r.delivery_office_cargo_elevator ?? undefined,
    deliveryOfficeStaircaseWidth: NOrUndef(r.delivery_office_staircase_width),
    deliveryOfficeStaircaseHeight: NOrUndef(r.delivery_office_staircase_height),
  };
}
function rowFromB2CAddress(d: any): any {
  return {
    billing_customer_name: d.billingCustomerName ?? null,
    billing_phone_1: d.billingPhone1 ?? null,
    billing_phone_2: d.billingPhone2 ?? null,
    billing_name: d.billingName ?? null,
    billing_address_line_1: d.billingAddressLine1 ?? null,
    billing_address_line_2: d.billingAddressLine2 ?? null,
    billing_city: d.billingCity ?? null,
    billing_state: d.billingState ?? null,
    billing_zip: d.billingZip ?? null,
    billing_location_type: d.billingLocationType ?? null,
    billing_road_available_for_tempo: d.billingRoadAvailableForTempo ?? null,
    billing_floor_number: d.billingFloorNumber ?? null,
    billing_cargo_elevator: d.billingCargoElevator ?? null,
    billing_staircase_width: d.billingStaircaseWidth ?? null,
    billing_staircase_height: d.billingStaircaseHeight ?? null,
    billing_gstin: d.billingGSTIN ?? null,
    billing_office_floor_number: d.billingOfficeFloorNumber ?? null,
    billing_office_cargo_elevator: d.billingOfficeCargoElevator ?? null,
    billing_office_staircase_width: d.billingOfficeStaircaseWidth ?? null,
    billing_office_staircase_height: d.billingOfficeStaircaseHeight ?? null,
    delivery_same_as_billing: d.deliverySameAsBilling ?? null,
    delivery_name: d.deliveryName ?? null,
    delivery_address_line_1: d.deliveryAddressLine1 ?? null,
    delivery_address_line_2: d.deliveryAddressLine2 ?? null,
    delivery_city: d.deliveryCity ?? null,
    delivery_state: d.deliveryState ?? null,
    delivery_zip: d.deliveryZip ?? null,
    delivery_location_type: d.deliveryLocationType ?? null,
    delivery_road_available_for_tempo: d.deliveryRoadAvailableForTempo ?? null,
    delivery_floor_number: d.deliveryFloorNumber ?? null,
    delivery_cargo_elevator: d.deliveryCargoElevator ?? null,
    delivery_staircase_width: d.deliveryStaircaseWidth ?? null,
    delivery_staircase_height: d.deliveryStaircaseHeight ?? null,
    delivery_gstin: d.deliveryGSTIN ?? null,
    delivery_office_floor_number: d.deliveryOfficeFloorNumber ?? null,
    delivery_office_cargo_elevator: d.deliveryOfficeCargoElevator ?? null,
    delivery_office_staircase_width: d.deliveryOfficeStaircaseWidth ?? null,
    delivery_office_staircase_height: d.deliveryOfficeStaircaseHeight ?? null,
  };
}

// ----- Quotations rich -----
function mapQuotationRich(r: any): Quotation {
  const versions: QuotationVersion[] = (r.quotation_versions ?? [])
    .map((v: any) => ({
      version: Number(v.version),
      data: v.data,
      createdAt: v.created_at,
      createdBy: v.created_by ?? '',
      changeNotes: v.change_notes ?? undefined,
    }))
    .sort((a: QuotationVersion, b: QuotationVersion) => a.version - b.version);

  return {
    id: r.id,
    reference: r.reference,
    customerId: r.customer_id ?? '',
    customerName: r.customer_name ?? '',
    contactId: r.contact_id ?? undefined,
    contactName: r.contact_name ?? undefined,
    opportunityId: r.opportunity_id ?? undefined,
    quotationDate: r.date,
    validUntil: r.valid_until ?? r.expiry_date ?? r.date,
    salespersonId: r.salesperson_id ?? undefined,
    salespersonName: r.salesperson_name ?? undefined,
    salesTeam: r.sales_team ?? undefined,
    currency: r.currency ?? 'INR',
    pricelistId: r.pricelist_id ?? undefined,
    paymentTerms: r.payment_terms ?? undefined,
    lines: (r.quotation_lines ?? []).map(mapQuotationLineRich),
    globalDiscount: N(r.global_discount),
    globalDiscountType: (r.global_discount_type ?? 'percentage') as any,
    subtotal: N(r.subtotal),
    discountAmount: N(r.discount_amount),
    taxAmount: N(r.tax_amount),
    total: N(r.total),
    notes: r.notes ?? undefined,
    termsAndConditions: r.terms_and_conditions ?? undefined,
    status: (r.status ?? 'draft') as QuotationStatus,
    sentAt: r.sent_at ?? undefined,
    acceptedAt: r.accepted_at ?? undefined,
    convertedToOrderId: r.converted_to_order_id ?? undefined,
    currentVersion: r.current_version ?? 1,
    versions,
    createdBy: r.created_by ?? '',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    // B2C
    ...mapB2CAddress(r),
    totalUntaxed: NOrUndef(r.total_untaxed),
    totalCGST: NOrUndef(r.total_cgst),
    totalSGST: NOrUndef(r.total_sgst),
    totalIGST: NOrUndef(r.total_igst),
    totalGST: NOrUndef(r.total_gst),
    grandTotal: NOrUndef(r.grand_total),
    gstType: r.gst_type ?? undefined,
    orderDiscountType: r.order_discount_type ?? null,
    orderDiscountValue: NOrUndef(r.order_discount_value),
    orderDiscountAmount: NOrUndef(r.order_discount_amount),
    pointsRedeemed: NOrUndef(r.points_redeemed),
    pointsEarned: NOrUndef(r.points_earned),
    redemptionAmount: NOrUndef(r.redemption_amount),
  } as Quotation;
}

function rowFromQuotation(q: Partial<Quotation> & { reference: string }): any {
  return {
    reference: q.reference,
    customer_id: uuidOrNull(q.customerId),
    customer_name: q.customerName ?? null,
    contact_id: uuidOrNull(q.contactId),
    contact_name: q.contactName ?? null,
    opportunity_id: uuidOrNull(q.opportunityId),
    date: q.quotationDate ?? new Date().toISOString().slice(0, 10),
    valid_until: q.validUntil ?? null,
    expiry_date: q.validUntil ?? null,
    salesperson_id: uuidOrNull(q.salespersonId),
    salesperson_name: q.salespersonName ?? null,
    sales_team: q.salesTeam ?? null,
    currency: q.currency ?? 'INR',
    pricelist_id: uuidOrNull(q.pricelistId),
    payment_terms: q.paymentTerms ?? null,
    global_discount: q.globalDiscount ?? 0,
    global_discount_type: q.globalDiscountType ?? 'percentage',
    subtotal: q.subtotal ?? 0,
    discount_amount: q.discountAmount ?? 0,
    tax_amount: q.taxAmount ?? 0,
    total: q.total ?? 0,
    notes: q.notes ?? null,
    terms_and_conditions: q.termsAndConditions ?? null,
    status: q.status ?? 'draft',
    sent_at: q.sentAt ?? null,
    accepted_at: q.acceptedAt ?? null,
    converted_to_order_id: q.convertedToOrderId ?? null,
    current_version: q.currentVersion ?? 1,
    ...rowFromB2CAddress(q),
    total_untaxed: q.totalUntaxed ?? null,
    total_cgst: q.totalCGST ?? null,
    total_sgst: q.totalSGST ?? null,
    total_igst: q.totalIGST ?? null,
    total_gst: q.totalGST ?? null,
    grand_total: q.grandTotal ?? null,
    gst_type: q.gstType ?? null,
    order_discount_type: q.orderDiscountType ?? null,
    order_discount_value: q.orderDiscountValue ?? null,
    order_discount_amount: q.orderDiscountAmount ?? null,
    points_redeemed: q.pointsRedeemed ?? null,
    points_earned: q.pointsEarned ?? null,
    redemption_amount: q.redemptionAmount ?? null,
  };
}

const QUOTATION_SELECT = '*, quotation_lines(*), quotation_versions(*)';

export async function listQuotationsRich(): Promise<Quotation[]> {
  const { data, error } = await supabase
    .from('quotations' as any).select(QUOTATION_SELECT)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapQuotationRich);
}
export async function getQuotationRich(id: string): Promise<Quotation | null> {
  const { data, error } = await supabase
    .from('quotations' as any).select(QUOTATION_SELECT)
    .eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapQuotationRich(data) : null;
}
export async function saveQuotationRich(q: Partial<Quotation> & { reference: string }): Promise<Quotation> {
  const uid = await currentUserId();
  const payload = rowFromQuotation(q);
  let qid = q.id;
  if (qid) {
    // Upsert by id so a client-generated UUID for a brand-new quotation
    // still produces an INSERT instead of a no-op UPDATE (which would leave
    // child line inserts pointing at a non-existent parent → FK 409).
    payload.id = qid;
    payload.created_by = payload.created_by ?? uid;
    const { error } = await supabase
      .from('quotations' as any)
      .upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  } else {
    payload.created_by = uid;
    const { data, error } = await supabase.from('quotations' as any).insert(payload).select('id').single();
    if (error) throw error;
    qid = (data as any).id;
  }
  if (q.lines !== undefined) {
    await supabase.from('quotation_lines' as any).delete().eq('quotation_id', qid);
    if (q.lines.length) {
      const rows = q.lines.map((l) => rowFromQuotationLine(l, qid!));
      const { error } = await supabase.from('quotation_lines' as any).insert(rows);
      if (error) throw error;
    }
  }
  // Persist any new versions (snapshots) that are not yet in DB.
  if (q.versions && q.versions.length) {
    const { data: existing } = await supabase
      .from('quotation_versions' as any).select('version').eq('quotation_id', qid);
    const have = new Set((existing ?? []).map((x: any) => Number(x.version)));
    const newOnes = q.versions.filter((v) => !have.has(v.version));
    if (newOnes.length) {
      const rows = newOnes.map((v) => ({
        quotation_id: qid,
        version: v.version,
        data: v.data as any,
        change_notes: v.changeNotes ?? null,
        created_by: uid,
      }));
      await supabase.from('quotation_versions' as any).insert(rows);
    }
  }
  return (await getQuotationRich(qid!))!;
}

// ----- Sales Orders rich -----
function mapOrderLineRich(r: any): SalesOrderLine {
  return {
    id: r.id,
    productId: r.product_id ?? '',
    productName: r.product_name ?? '',
    description: r.description ?? undefined,
    quantity: N(r.quantity),
    deliveredQuantity: N(r.delivered_qty),
    invoicedQuantity: N(r.invoiced_qty),
    unitPrice: N(r.unit_price),
    discount: N(r.discount),
    discountType: (r.discount_type ?? 'percentage') as any,
    taxIds: Array.isArray(r.tax_ids) ? r.tax_ids : [],
    subtotal: N(r.subtotal),
    taxAmount: N(r.tax_amount),
    total: N(r.total),
    reservedStock: !!r.reserved_stock,
    barcode: r.barcode ?? undefined,
    customization: r.customization ?? undefined,
    units: NOrUndef(r.units),
    netAmount: NOrUndef(r.net_amount),
    gstRate: NOrUndef(r.gst_rate),
    cgstAmount: NOrUndef(r.cgst_amount),
    sgstAmount: NOrUndef(r.sgst_amount),
    igstAmount: NOrUndef(r.igst_amount),
    perLineDiscountType: (r.per_line_discount_type ?? null) as any,
    discountValue: NOrUndef(r.discount_value),
    discountAmount: NOrUndef(r.discount_amount),
    finalAmount: NOrUndef(r.final_amount),
  };
}
function rowFromOrderLine(l: SalesOrderLine, orderId: string): any {
  return {
    order_id: orderId,
    product_id: uuidOrNull(l.productId),
    product_name: l.productName ?? null,
    description: l.description ?? null,
    quantity: l.quantity ?? 0,
    delivered_qty: l.deliveredQuantity ?? 0,
    invoiced_qty: l.invoicedQuantity ?? 0,
    unit_price: l.unitPrice ?? 0,
    discount: l.discount ?? 0,
    discount_type: l.discountType ?? 'percentage',
    tax_ids: l.taxIds ?? [],
    subtotal: l.subtotal ?? 0,
    tax_amount: l.taxAmount ?? 0,
    total: l.total ?? 0,
    tax_rate: 0,
    reserved_stock: !!l.reservedStock,
    barcode: l.barcode ?? null,
    customization: l.customization ?? null,
    units: l.units ?? null,
    net_amount: l.netAmount ?? null,
    gst_rate: l.gstRate ?? null,
    cgst_amount: l.cgstAmount ?? null,
    sgst_amount: l.sgstAmount ?? null,
    igst_amount: l.igstAmount ?? null,
    per_line_discount_type: l.perLineDiscountType ?? null,
    discount_value: l.discountValue ?? null,
    discount_amount: l.discountAmount ?? null,
    final_amount: l.finalAmount ?? null,
  };
}

function mapOrderActivityRich(r: any): OrderActivity {
  return {
    id: r.id,
    userId: r.user_id ?? '',
    userName: r.user_name ?? '',
    action: r.action,
    details: r.details ?? undefined,
    timestamp: r.timestamp,
  };
}

function mapSalesOrderRich(r: any): SalesOrder {
  const activities: OrderActivity[] = (r.order_activities ?? [])
    .map(mapOrderActivityRich)
    .sort((a: OrderActivity, b: OrderActivity) => a.timestamp.localeCompare(b.timestamp));

  return {
    id: r.id,
    reference: r.reference,
    quotationId: r.quotation_id ?? undefined,
    customerId: r.customer_id ?? '',
    customerName: r.customer_name ?? '',
    contactId: r.contact_id ?? undefined,
    contactName: r.contact_name ?? undefined,
    deliveryAddress: r.delivery_address ?? undefined,
    billingAddress: r.billing_address ?? undefined,
    orderDate: r.order_date,
    commitmentDate: r.commitment_date ?? undefined,
    deliveryDate: r.delivery_date ?? undefined,
    salespersonId: r.salesperson_id ?? undefined,
    salespersonName: r.salesperson_name ?? undefined,
    salesTeam: r.sales_team ?? undefined,
    currency: r.currency ?? 'INR',
    pricelistId: r.pricelist_id ?? undefined,
    paymentTerms: r.payment_terms ?? undefined,
    fiscalPositionId: r.fiscal_position_id ?? undefined,
    lines: (r.order_lines ?? []).map(mapOrderLineRich),
    subtotal: N(r.subtotal),
    discountAmount: N(r.discount_amount),
    taxAmount: N(r.tax_amount),
    total: N(r.total),
    notes: r.notes ?? undefined,
    status: (r.status ?? 'estimate') as SalesOrderStatus,
    lockedAt: r.locked_at ?? undefined,
    lockedBy: r.locked_by ?? undefined,
    confirmedAt: r.confirmed_at ?? undefined,
    confirmedBy: r.confirmed_by ?? undefined,
    deliveryStatus: r.delivery_status ?? undefined,
    invoiceStatus: r.invoice_status ?? undefined,
    invoiceIds: Array.isArray(r.invoice_ids) ? r.invoice_ids : undefined,
    activities,
    createdBy: r.created_by ?? '',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    ...mapB2CAddress(r),
    totalUntaxed: NOrUndef(r.total_untaxed),
    totalCGST: NOrUndef(r.total_cgst),
    totalSGST: NOrUndef(r.total_sgst),
    totalIGST: NOrUndef(r.total_igst),
    totalGST: NOrUndef(r.total_gst),
    grandTotal: NOrUndef(r.grand_total),
    gstType: r.gst_type ?? undefined,
    orderDiscountType: r.order_discount_type ?? null,
    orderDiscountValue: NOrUndef(r.order_discount_value),
    orderDiscountAmount: NOrUndef(r.order_discount_amount),
    pointsRedeemed: NOrUndef(r.points_redeemed),
    pointsEarned: NOrUndef(r.points_earned),
    redemptionAmount: NOrUndef(r.redemption_amount),
  } as SalesOrder;
}

function rowFromSalesOrder(o: Partial<SalesOrder> & { reference: string }): any {
  return {
    reference: o.reference,
    quotation_id: uuidOrNull(o.quotationId),
    customer_id: uuidOrNull(o.customerId),
    customer_name: o.customerName ?? null,
    contact_id: uuidOrNull(o.contactId),
    contact_name: o.contactName ?? null,
    delivery_address: o.deliveryAddress ?? null,
    billing_address: o.billingAddress ?? null,
    order_date: o.orderDate ?? new Date().toISOString().slice(0, 10),
    commitment_date: o.commitmentDate ?? null,
    delivery_date: o.deliveryDate ?? null,
    salesperson_id: uuidOrNull(o.salespersonId),
    salesperson_name: o.salespersonName ?? null,
    sales_team: o.salesTeam ?? null,
    currency: o.currency ?? 'INR',
    pricelist_id: uuidOrNull(o.pricelistId),
    payment_terms: o.paymentTerms ?? null,
    fiscal_position_id: uuidOrNull(o.fiscalPositionId),
    subtotal: o.subtotal ?? 0,
    discount_amount: o.discountAmount ?? 0,
    tax_amount: o.taxAmount ?? 0,
    total: o.total ?? 0,
    notes: o.notes ?? null,
    status: o.status ?? 'estimate',
    locked_at: o.lockedAt ?? null,
    locked_by: o.lockedBy ?? null,
    confirmed_at: o.confirmedAt ?? null,
    confirmed_by: o.confirmedBy ?? null,
    delivery_status: o.deliveryStatus ?? null,
    invoice_status: o.invoiceStatus ?? null,
    invoice_ids: o.invoiceIds ?? null,
    ...rowFromB2CAddress(o),
    total_untaxed: o.totalUntaxed ?? null,
    total_cgst: o.totalCGST ?? null,
    total_sgst: o.totalSGST ?? null,
    total_igst: o.totalIGST ?? null,
    total_gst: o.totalGST ?? null,
    grand_total: o.grandTotal ?? null,
    gst_type: o.gstType ?? null,
    order_discount_type: o.orderDiscountType ?? null,
    order_discount_value: o.orderDiscountValue ?? null,
    order_discount_amount: o.orderDiscountAmount ?? null,
    points_redeemed: o.pointsRedeemed ?? null,
    points_earned: o.pointsEarned ?? null,
    redemption_amount: o.redemptionAmount ?? null,
  };
}

const ORDER_SELECT = '*, order_lines(*), order_activities(*)';

export async function listSalesOrdersRich(): Promise<SalesOrder[]> {
  const { data, error } = await supabase
    .from('sales_orders' as any).select(ORDER_SELECT)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapSalesOrderRich);
}
export async function getSalesOrderRich(id: string): Promise<SalesOrder | null> {
  const { data, error } = await supabase
    .from('sales_orders' as any).select(ORDER_SELECT)
    .eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapSalesOrderRich(data) : null;
}
export async function saveSalesOrderRich(o: Partial<SalesOrder> & { reference: string }): Promise<SalesOrder> {
  const uid = await currentUserId();
  const payload = rowFromSalesOrder(o);
  let oid = o.id;
  if (oid) {
    payload.id = oid;
    payload.created_by = payload.created_by ?? uid;
    const { error } = await supabase
      .from('sales_orders' as any)
      .upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  } else {
    payload.created_by = uid;
    const { data, error } = await supabase.from('sales_orders' as any).insert(payload).select('id').single();
    if (error) throw error;
    oid = (data as any).id;
  }
  if (o.lines !== undefined) {
    await supabase.from('order_lines' as any).delete().eq('order_id', oid);
    if (o.lines.length) {
      const rows = o.lines.map((l) => rowFromOrderLine(l, oid!));
      const { error } = await supabase.from('order_lines' as any).insert(rows);
      if (error) throw error;
    }
  }
  // Append any new activities (ones without a server-side row yet).
  if (o.activities && o.activities.length) {
    const { data: existing } = await supabase
      .from('order_activities' as any).select('id').eq('order_id', oid);
    const have = new Set((existing ?? []).map((x: any) => x.id));
    const newOnes = o.activities.filter((a) => !have.has(a.id));
    if (newOnes.length) {
      const rows = newOnes.map((a) => ({
        id: a.id,
        order_id: oid,
        user_id: a.userId || null,
        user_name: a.userName ?? null,
        action: a.action,
        details: a.details ?? null,
        timestamp: a.timestamp,
      }));
      await supabase.from('order_activities' as any).insert(rows);
    }
  }
  return (await getSalesOrderRich(oid!))!;
}

// ----- Subscription rich -----
function mapSubscriptionRich(r: any): Subscription {
  return {
    id: r.id,
    reference: r.reference ?? '',
    customerId: r.customer_id ?? '',
    customerName: r.customer_name ?? '',
    status: r.status ?? 'draft',
    billingCycle: r.billing_cycle ?? 'monthly',
    startDate: r.start_date,
    nextBillingDate: r.next_billing_date ?? r.start_date,
    endDate: r.end_date ?? undefined,
    lines: (r.subscription_lines ?? []).map((l: any) => ({
      id: l.id,
      productId: l.product_id ?? '',
      productName: l.product_name ?? '',
      quantity: N(l.quantity),
      unitPrice: N(l.unit_price),
      discount: N(l.discount),
    })) as SubscriptionLine[],
    subtotal: N(r.subtotal),
    taxAmount: N(r.tax_amount),
    total: N(r.total),
    currency: r.currency ?? 'INR',
    paymentTerms: r.payment_terms ?? undefined,
    lastOrderId: r.last_order_id ?? undefined,
    orderHistory: Array.isArray(r.order_history) ? r.order_history : [],
    createdBy: r.created_by ?? '',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
function rowFromSubscription(s: Partial<Subscription>): any {
  return {
    reference: s.reference ?? null,
    customer_id: s.customerId || null,
    customer_name: s.customerName ?? null,
    status: s.status ?? 'draft',
    billing_cycle: s.billingCycle ?? 'monthly',
    billing_period: s.billingCycle ?? 'monthly',
    start_date: s.startDate ?? new Date().toISOString().slice(0, 10),
    next_billing_date: s.nextBillingDate ?? null,
    end_date: s.endDate ?? null,
    subtotal: s.subtotal ?? 0,
    tax_amount: s.taxAmount ?? 0,
    total: s.total ?? 0,
    price: s.total ?? 0,
    currency: s.currency ?? 'INR',
    payment_terms: s.paymentTerms ?? null,
    last_order_id: s.lastOrderId ?? null,
    order_history: s.orderHistory ?? [],
    product_id: s.lines && s.lines[0] ? (s.lines[0].productId || null) : null,
  };
}

export async function listSubscriptionsRich(): Promise<Subscription[]> {
  const { data, error } = await supabase
    .from('subscriptions' as any).select('*, subscription_lines(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapSubscriptionRich);
}
export async function getSubscriptionRich(id: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions' as any).select('*, subscription_lines(*)')
    .eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapSubscriptionRich(data) : null;
}
export async function saveSubscriptionRich(s: Partial<Subscription>): Promise<Subscription> {
  const uid = await currentUserId();
  const payload = rowFromSubscription(s);
  let sid = s.id;
  if (sid) {
    const { error } = await supabase.from('subscriptions' as any).update(payload).eq('id', sid);
    if (error) throw error;
  } else {
    payload.created_by = uid;
    const { data, error } = await supabase.from('subscriptions' as any).insert(payload).select('id').single();
    if (error) throw error;
    sid = (data as any).id;
  }
  if (s.lines !== undefined) {
    await supabase.from('subscription_lines' as any).delete().eq('subscription_id', sid);
    if (s.lines.length) {
      const rows = s.lines.map((l) => ({
        subscription_id: sid,
        product_id: l.productId || null,
        product_name: l.productName ?? null,
        quantity: l.quantity ?? 0,
        unit_price: l.unitPrice ?? 0,
        discount: l.discount ?? 0,
      }));
      const { error } = await supabase.from('subscription_lines' as any).insert(rows);
      if (error) throw error;
    }
  }
  return (await getSubscriptionRich(sid!))!;
}

export async function deleteSubscriptionRich(id: string): Promise<void> {
  const { error } = await supabase.from('subscriptions' as any).delete().eq('id', id);
  if (error) throw error;
}

// Reference generators (server-side count to avoid collisions).
export async function generateQuotationReferenceRich(): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from('quotations' as any).select('id', { count: 'exact', head: true })
    .ilike('reference', `QT-${year}-%`);
  return `QT-${year}-${String((count ?? 0) + 1).padStart(4, '0')}`;
}
export async function generateOrderReferenceRich(): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from('sales_orders' as any).select('id', { count: 'exact', head: true })
    .ilike('reference', `SO-${year}-%`);
  return `SO-${year}-${String((count ?? 0) + 1).padStart(4, '0')}`;
}
export async function generateSubscriptionReferenceRich(): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from('subscriptions' as any).select('id', { count: 'exact', head: true })
    .ilike('reference', `SUB-${year}-%`);
  return `SUB-${year}-${String((count ?? 0) + 1).padStart(4, '0')}`;
}

// ---------- Fiscal Positions ----------
import type { FiscalPosition } from '@/lib/data/sales/types';

function mapFiscalPosition(r: any): FiscalPosition {
  return {
    id: r.id,
    name: r.name,
    code: r.code,
    countryCode: r.country_code ?? undefined,
    taxMappings: Array.isArray(r.tax_mappings) ? r.tax_mappings : [],
    isActive: !!r.is_active,
  };
}
function rowFromFiscalPosition(fp: Partial<FiscalPosition> & { name: string; code: string }): any {
  return {
    name: fp.name,
    code: fp.code,
    country_code: fp.countryCode ?? null,
    tax_mappings: fp.taxMappings ?? [],
    is_active: fp.isActive ?? true,
  };
}

export async function listFiscalPositions(): Promise<FiscalPosition[]> {
  const { data, error } = await supabase
    .from('sales_fiscal_positions' as any).select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapFiscalPosition);
}

export async function saveFiscalPosition(fp: Partial<FiscalPosition> & { name: string; code: string }): Promise<FiscalPosition> {
  const payload = rowFromFiscalPosition(fp);
  if (fp.id) {
    const { data, error } = await supabase
      .from('sales_fiscal_positions' as any).update(payload).eq('id', fp.id).select('*').single();
    if (error) throw error;
    return mapFiscalPosition(data);
  }
  const { data, error } = await supabase
    .from('sales_fiscal_positions' as any).insert(payload).select('*').single();
  if (error) throw error;
  return mapFiscalPosition(data);
}

export async function deleteFiscalPosition(id: string): Promise<void> {
  const { error } = await supabase.from('sales_fiscal_positions' as any).delete().eq('id', id);
  if (error) throw error;
}

// ---------- Convert Quotation -> Sales Order (server-aware) ----------
export async function convertQuotationToOrderRich(
  quotationId: string,
  userId: string,
  userName: string,
): Promise<SalesOrder | null> {
  const q = await getQuotationRich(quotationId);
  if (!q) return null;
  if (q.status !== 'sent' && q.status !== 'accepted') return null;
  if (q.convertedToOrderId) return null;

  const reference = await generateOrderReferenceRich();
  const now = new Date().toISOString();
  const orderLines: SalesOrderLine[] = (q.lines ?? []).map((l) => ({
    ...l,
    id: crypto.randomUUID(),
    deliveredQuantity: 0,
    invoicedQuantity: 0,
    reservedStock: false,
  }));

  const draft: Partial<SalesOrder> & { reference: string } = {
    reference,
    quotationId: q.id,
    customerId: q.customerId,
    customerName: q.customerName,
    contactId: q.contactId,
    contactName: q.contactName,
    orderDate: now.split('T')[0],
    salespersonId: q.salespersonId,
    salespersonName: q.salespersonName,
    salesTeam: q.salesTeam,
    currency: q.currency,
    pricelistId: q.pricelistId,
    paymentTerms: q.paymentTerms,
    lines: orderLines,
    subtotal: q.subtotal,
    discountAmount: q.discountAmount,
    taxAmount: q.taxAmount,
    total: q.total,
    notes: q.notes,
    status: 'confirmed' as SalesOrderStatus,
    deliveryStatus: 'pending',
    invoiceStatus: 'not_invoiced',
    activities: [{
      id: crypto.randomUUID(),
      userId,
      userName,
      action: 'Order created from quotation',
      details: `Converted from ${q.reference}`,
      timestamp: now,
    }],
    // Carry B2C address & totals if present
    billingCustomerName: q.billingCustomerName,
    totalUntaxed: q.totalUntaxed,
    totalCGST: q.totalCGST,
    totalSGST: q.totalSGST,
    totalIGST: q.totalIGST,
    totalGST: q.totalGST,
    grandTotal: q.grandTotal,
    gstType: q.gstType,
  };

  const saved = await saveSalesOrderRich(draft);
  // Link the order id back onto the quotation and mark it converted
  await saveQuotationRich({ ...q, convertedToOrderId: saved.id, status: 'converted' });
  return saved;
}