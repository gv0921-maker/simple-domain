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
}

export interface SbPricelist {
  id: string;
  name: string;
  currency: string;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
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
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------- Mappers ----------
const mapCustomer = (r: any): SbCustomer => ({
  id: r.id, name: r.name, email: r.email, phone: r.phone, address: r.address,
  gstin: r.gstin, contactPerson: r.contact_person, isActive: r.is_active,
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
});
const mapPricelist = (r: any): SbPricelist => ({
  id: r.id, name: r.name, currency: r.currency, startDate: r.start_date,
  endDate: r.end_date, isActive: r.is_active, createdBy: r.created_by,
  createdAt: r.created_at, updatedAt: r.updated_at,
  items: r.pricelist_items?.map(mapPricelistItem),
});
const mapSubscription = (r: any): SbSubscription => ({
  id: r.id, customerId: r.customer_id, productId: r.product_id,
  startDate: r.start_date, nextBillingDate: r.next_billing_date,
  status: r.status, price: Number(r.price), billingPeriod: r.billing_period,
  createdBy: r.created_by, createdAt: r.created_at, updatedAt: r.updated_at,
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
  const { data, error } = await supabase.from('subscriptions' as any).select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapSubscription);
}
export async function getSubscription(id: string): Promise<SbSubscription | null> {
  const { data, error } = await supabase.from('subscriptions' as any).select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapSubscription(data) : null;
}
export async function saveSubscription(input: Partial<SbSubscription>): Promise<SbSubscription> {
  const uid = await currentUserId();
  const payload: any = {
    customer_id: input.customerId ?? null,
    product_id: input.productId ?? null,
    start_date: input.startDate ?? new Date().toISOString().slice(0, 10),
    next_billing_date: input.nextBillingDate ?? null,
    status: input.status ?? 'active',
    price: input.price ?? 0,
    billing_period: input.billingPeriod ?? 'monthly',
  };
  if (input.id) {
    const { data, error } = await supabase.from('subscriptions' as any).update(payload).eq('id', input.id).select('*').single();
    if (error) throw error;
    return mapSubscription(data);
  }
  payload.created_by = uid;
  const { data, error } = await supabase.from('subscriptions' as any).insert(payload).select('*').single();
  if (error) throw error;
  return mapSubscription(data);
}
export async function deleteSubscription(id: string): Promise<void> {
  const { error } = await supabase.from('subscriptions' as any).delete().eq('id', id);
  if (error) throw error;
}