// Sales module — Supabase-backed async API.
//
// This sits alongside the legacy localStorage exports in
// `@/lib/services/sales` and is consumed via TanStack Query hooks in
// `@/hooks/sales`. Pages are migrated incrementally; do NOT remove the
// legacy exports until every consumer is moved over.

import { supabase } from '@/integrations/supabase/client';

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