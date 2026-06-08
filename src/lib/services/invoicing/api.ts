import { supabase } from '@/integrations/supabase/client';

export type InvoiceType = 'regular' | 'warranty' | 'factory';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'cheque' | 'card' | 'upi';
export type PriceApprovalStatus = 'not_required' | 'pending' | 'approved' | 'rejected';

export interface InvoiceLine {
  id: string;
  invoice_id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax_rate: number;
  subtotal: number;
  approved_price?: number | null;
  approval_notes?: string | null;
}

export interface Invoice {
  id: string;
  reference: string;
  customer_id: string | null;
  sales_order_id: string | null;
  type: InvoiceType;
  issue_date: string;
  due_date: string | null;
  status: InvoiceStatus;
  notes: string | null;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  paid_amount: number;
  currency: string;
  price_approval_status: PriceApprovalStatus;
  invoice_lines?: InvoiceLine[];
}

export interface Payment {
  id: string;
  invoice_id: string | null;
  customer_id: string | null;
  amount: number;
  payment_date: string;
  method: PaymentMethod;
  reference: string | null;
  notes: string | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const asUuid = (v: string | null | undefined) => (v && UUID_RE.test(v) ? v : null);

function makeReference(type: InvoiceType): string {
  const prefix = type === 'factory' ? 'FAC' : type === 'warranty' ? 'WAR' : 'INV';
  const y = new Date().getFullYear();
  return `${prefix}/${y}/${Date.now().toString().slice(-6)}`;
}

// -------- Invoices --------
export async function fetchInvoices(type?: InvoiceType): Promise<Invoice[]> {
  let q = supabase.from('invoices').select('*, invoice_lines(*)').order('created_at', { ascending: false });
  if (type) q = q.eq('type', type);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as Invoice[];
}

export async function fetchInvoiceById(id: string): Promise<Invoice | null> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, invoice_lines(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as Invoice) ?? null;
}

export interface SaveInvoiceInput {
  id?: string;
  reference?: string;
  customer_id: string | null;
  sales_order_id?: string | null;
  type: InvoiceType;
  issue_date: string;
  due_date?: string | null;
  status?: InvoiceStatus;
  notes?: string | null;
  subtotal: number;
  tax_amount: number;
  discount_amount?: number;
  total: number;
  paid_amount?: number;
  currency?: string;
  price_approval_status?: PriceApprovalStatus;
  lines: Array<Omit<InvoiceLine, 'id' | 'invoice_id'> & { id?: string }>;
}

export async function saveInvoice(input: SaveInvoiceInput): Promise<Invoice> {
  const payload = {
    reference: input.reference ?? makeReference(input.type),
    customer_id: asUuid(input.customer_id),
    sales_order_id: asUuid(input.sales_order_id ?? null),
    type: input.type,
    issue_date: input.issue_date,
    due_date: input.due_date ?? null,
    status: input.status ?? 'draft',
    notes: input.notes ?? null,
    subtotal: input.subtotal,
    tax_amount: input.tax_amount,
    discount_amount: input.discount_amount ?? 0,
    total: input.total,
    paid_amount: input.paid_amount ?? 0,
    currency: input.currency ?? 'INR',
    price_approval_status: input.price_approval_status ?? 'not_required',
  };

  let invoiceId = input.id;
  if (invoiceId) {
    const { error } = await supabase.from('invoices').update(payload).eq('id', invoiceId);
    if (error) throw error;
    await supabase.from('invoice_lines').delete().eq('invoice_id', invoiceId);
  } else {
    const { data, error } = await supabase.from('invoices').insert(payload).select('id').single();
    if (error) throw error;
    invoiceId = data.id as string;
  }

  if (input.lines.length > 0) {
    const rows = input.lines.map((l) => ({
      invoice_id: invoiceId!,
      product_id: asUuid(l.product_id),
      description: l.description,
      quantity: l.quantity,
      unit_price: l.unit_price,
      discount: l.discount ?? 0,
      tax_rate: l.tax_rate ?? 0,
      subtotal: l.subtotal,
      approved_price: l.approved_price ?? null,
      approval_notes: l.approval_notes ?? null,
    }));
    const { error: lineErr } = await supabase.from('invoice_lines').insert(rows);
    if (lineErr) throw lineErr;
  }

  const saved = await fetchInvoiceById(invoiceId!);
  if (!saved) throw new Error('Invoice not found after save');
  return saved;
}

export async function deleteInvoice(id: string): Promise<void> {
  const { error } = await supabase.from('invoices').delete().eq('id', id);
  if (error) throw error;
}

// -------- Invoice lines --------
export async function fetchInvoiceLines(invoice_id: string): Promise<InvoiceLine[]> {
  const { data, error } = await supabase
    .from('invoice_lines')
    .select('*')
    .eq('invoice_id', invoice_id)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as InvoiceLine[];
}

export async function saveInvoiceLine(
  line: Omit<InvoiceLine, 'id'> & { id?: string },
): Promise<InvoiceLine> {
  const payload = {
    invoice_id: line.invoice_id,
    product_id: asUuid(line.product_id),
    description: line.description,
    quantity: line.quantity,
    unit_price: line.unit_price,
    discount: line.discount ?? 0,
    tax_rate: line.tax_rate ?? 0,
    subtotal: line.subtotal,
    approved_price: line.approved_price ?? null,
    approval_notes: line.approval_notes ?? null,
  };
  if (line.id) {
    const { data, error } = await supabase
      .from('invoice_lines').update(payload).eq('id', line.id).select('*').single();
    if (error) throw error;
    return data as unknown as InvoiceLine;
  }
  const { data, error } = await supabase
    .from('invoice_lines').insert(payload).select('*').single();
  if (error) throw error;
  return data as unknown as InvoiceLine;
}

// -------- Payments --------
export async function fetchPayments(): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .order('payment_date', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Payment[];
}

export interface SavePaymentInput {
  id?: string;
  invoice_id?: string | null;
  customer_id: string | null;
  amount: number;
  payment_date: string;
  method: PaymentMethod;
  reference?: string | null;
  notes?: string | null;
}

export async function savePayment(input: SavePaymentInput): Promise<Payment> {
  const payload = {
    invoice_id: asUuid(input.invoice_id ?? null),
    customer_id: asUuid(input.customer_id),
    amount: input.amount,
    payment_date: input.payment_date,
    method: input.method,
    reference: input.reference ?? null,
    notes: input.notes ?? null,
  };
  if (input.id) {
    const { data, error } = await supabase
      .from('payments').update(payload).eq('id', input.id).select('*').single();
    if (error) throw error;
    return data as unknown as Payment;
  }
  const { data, error } = await supabase
    .from('payments').insert(payload).select('*').single();
  if (error) throw error;
  return data as unknown as Payment;
}

export async function deletePayment(id: string): Promise<void> {
  const { error } = await supabase.from('payments').delete().eq('id', id);
  if (error) throw error;
}

// -------- Price approvals --------
export async function fetchPendingPriceApprovals(): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, invoice_lines(*)')
    .eq('price_approval_status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Invoice[];
}

export async function fetchPendingPriceApprovalsCount(): Promise<number> {
  const { count, error } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('price_approval_status', 'pending');
  if (error) return 0;
  return count ?? 0;
}

export async function setInvoicePriceApproval(
  invoiceId: string,
  status: PriceApprovalStatus,
): Promise<void> {
  const { error } = await supabase
    .from('invoices')
    .update({ price_approval_status: status })
    .eq('id', invoiceId);
  if (error) throw error;
}

export async function updateInvoiceLineApproval(
  lineId: string,
  approved_price: number | null,
  approval_notes: string | null,
): Promise<void> {
  const { error } = await supabase
    .from('invoice_lines')
    .update({ approved_price, approval_notes })
    .eq('id', lineId);
  if (error) throw error;
}