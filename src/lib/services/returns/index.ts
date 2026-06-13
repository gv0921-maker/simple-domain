import { supabase } from '@/integrations/supabase/client';
import { logRecordCreated, logStatusChange, logFieldChange, addManualNote } from '@/lib/services/activityLog';

const sb = supabase as any;

export type ReturnStatus =
  | 'draft' | 'pending_approval' | 'approved' | 'rejected'
  | 'awaiting_receipt' | 'received' | 'resolved' | 'closed' | 'cancelled';

export type ConditionGrade = 'like_new' | 'minor_damage' | 'unsalvageable';
export type ResolutionType = 'exchange' | 'credit_note' | 'refund' | 'pending';
export type ResolutionStatus = 'pending' | 'in_progress' | 'completed';

export interface ReturnRequest {
  id: string;
  rt_number: string;
  source_invoice_id: string;
  source_sales_order_id: string;
  customer_id: string | null;
  customer_name_snapshot: string | null;
  request_status: ReturnStatus;
  customer_reported_reason: string;
  customer_reported_issue_description: string | null;
  customer_photos: string[];
  requested_by: string;
  requested_at: string;
  approved_by: string | null;
  approved_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  received_by: string | null;
  received_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  source_invoice?: { id: string; reference: string } | null;
  source_sales_order?: { id: string; reference: string | null } | null;
  items?: ReturnRequestItem[];
}

export interface ReturnRequestItem {
  id: string;
  return_request_id: string;
  goods_receipt_serial_id: string;
  delivery_note_id: string | null;
  delivery_note_line_id: string | null;
  invoice_line_id: string;
  product_id: string;
  serial_number: string;
  quantity: number;
  original_unit_price: number;
  is_customized: boolean;
  customization_details: Record<string, unknown> | null;
  condition_grade: ConditionGrade | null;
  qc_status: 'pending' | 'completed';
  qc_notes: string | null;
  qc_images: string[];
  qc_checked_by: string | null;
  qc_checked_at: string | null;
  resolution_type: ResolutionType | null;
  resolution_status: ResolutionStatus;
  product?: { id: string; name: string; sku: string | null } | null;
}

export interface ReturnEligibility {
  eligible: boolean;
  reason: string | null;
  has_customization: boolean;
  original_invoice_id: string | null;
  delivered_at: string | null;
  days_since_delivery: number | null;
}

export interface ReturnFilters {
  status?: ReturnStatus | 'all';
  customer_id?: string;
  source_invoice_id?: string;
  date_from?: string;
  date_to?: string;
  requested_by?: string;
}

export const RT_STATUS_LABEL: Record<ReturnStatus, string> = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  awaiting_receipt: 'Awaiting Receipt',
  received: 'Received (In QC)',
  resolved: 'Resolved',
  closed: 'Closed',
  cancelled: 'Cancelled',
};

export async function validateReturnEligibility(serialId: string): Promise<ReturnEligibility> {
  const { data, error } = await sb.rpc('validate_return_eligibility', { p_serial_id: serialId });
  if (error) throw error;
  return data as ReturnEligibility;
}

export async function createReturnRequest(
  invoiceId: string,
  items: { serial_id: string; qty?: number }[],
  reason: string,
  issueDescription: string | null,
): Promise<string> {
  const { data, error } = await sb.rpc('create_return_request', {
    p_invoice_id: invoiceId,
    p_items: items,
    p_reason: reason,
    p_issue_description: issueDescription,
  });
  if (error) throw error;
  const rtId = data as string;
  await logRecordCreated('return_request', rtId);
  return rtId;
}

export async function getReturnRequests(filters: ReturnFilters = {}): Promise<ReturnRequest[]> {
  let q = sb
    .from('return_requests')
    .select('*, source_invoice:invoices(id,reference), source_sales_order:sales_orders(id,reference)')
    .order('requested_at', { ascending: false });
  if (filters.status && filters.status !== 'all') q = q.eq('request_status', filters.status);
  if (filters.customer_id) q = q.eq('customer_id', filters.customer_id);
  if (filters.source_invoice_id) q = q.eq('source_invoice_id', filters.source_invoice_id);
  if (filters.requested_by) q = q.eq('requested_by', filters.requested_by);
  if (filters.date_from) q = q.gte('requested_at', filters.date_from);
  if (filters.date_to) q = q.lte('requested_at', filters.date_to);
  const { data, error } = await q;
  if (error) throw error;
  // Fetch item count per row via aggregate
  const ids = (data ?? []).map((r: any) => r.id);
  let counts: Record<string, number> = {};
  if (ids.length) {
    const { data: items } = await sb
      .from('return_request_items')
      .select('return_request_id')
      .in('return_request_id', ids);
    (items ?? []).forEach((i: any) => {
      counts[i.return_request_id] = (counts[i.return_request_id] ?? 0) + 1;
    });
  }
  return (data ?? []).map((r: any) => ({ ...r, items: Array(counts[r.id] ?? 0).fill(null) })) as ReturnRequest[];
}

export async function getReturnRequestById(id: string): Promise<ReturnRequest | null> {
  const { data, error } = await sb
    .from('return_requests')
    .select(`*,
      source_invoice:invoices(id,reference),
      source_sales_order:sales_orders(id,reference),
      items:return_request_items(*, product:products(id,name,sku))`)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as ReturnRequest | null;
}

export async function submitForApproval(rtId: string): Promise<void> {
  const { error } = await sb
    .from('return_requests')
    .update({ request_status: 'pending_approval' })
    .eq('id', rtId)
    .eq('request_status', 'draft');
  if (error) throw error;
  await logStatusChange('return_request', rtId, 'draft', 'pending_approval');
}

export async function approveReturnRequest(rtId: string): Promise<void> {
  const { error } = await sb.rpc('approve_return_request', { p_rt_id: rtId });
  if (error) throw error;
  await logStatusChange('return_request', rtId, 'pending_approval', 'awaiting_receipt');
}

export async function rejectReturnRequest(rtId: string, reason: string): Promise<void> {
  const { error } = await sb.rpc('reject_return_request', { p_rt_id: rtId, p_reason: reason });
  if (error) throw error;
  await logStatusChange('return_request', rtId, 'pending_approval', 'rejected');
  await addManualNote('return_request', rtId, `Rejection reason: ${reason}`);
}

export async function cancelReturnRequest(rtId: string, reason: string): Promise<void> {
  const { data: current } = await sb
    .from('return_requests').select('request_status').eq('id', rtId).maybeSingle();
  const prev = (current as any)?.request_status ?? null;
  const { error } = await sb
    .from('return_requests')
    .update({ request_status: 'cancelled' })
    .eq('id', rtId);
  if (error) throw error;
  await logStatusChange('return_request', rtId, prev, 'cancelled');
  if (reason) await addManualNote('return_request', rtId, `Cancellation reason: ${reason}`);
}

export async function recordReturnQC(
  itemId: string,
  conditionGrade: ConditionGrade,
  notes: string | null,
  images: string[],
): Promise<void> {
  const { error } = await sb.rpc('record_return_qc', {
    p_item_id: itemId,
    p_condition_grade: conditionGrade,
    p_notes: notes,
    p_images: images,
  });
  if (error) throw error;
  const { data: item } = await sb
    .from('return_request_items').select('return_request_id, serial_number').eq('id', itemId).maybeSingle();
  if (item) {
    await logFieldChange(
      'return_request', (item as any).return_request_id,
      `qc:${(item as any).serial_number}`, null, conditionGrade,
    );
  }
}

export async function uploadReturnPhoto(
  rtId: string, file: File, type: 'customer' | 'qc',
): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${rtId}/${type}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await sb.storage.from('return-photos').upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = sb.storage.from('return-photos').getPublicUrl(path);
  const url = (data as any).publicUrl as string;

  if (type === 'customer') {
    const { data: row } = await sb.from('return_requests').select('customer_photos').eq('id', rtId).maybeSingle();
    const photos = ((row as any)?.customer_photos ?? []) as string[];
    photos.push(url);
    await sb.from('return_requests').update({ customer_photos: photos }).eq('id', rtId);
  }
  return url;
}

export async function getReturnsForInvoice(invoiceId: string): Promise<ReturnRequest[]> {
  return getReturnRequests({ source_invoice_id: invoiceId });
}

export async function getReturnsForSO(soId: string): Promise<ReturnRequest[]> {
  const { data, error } = await sb
    .from('return_requests')
    .select('*, source_invoice:invoices(id,reference)')
    .eq('source_sales_order_id', soId)
    .order('requested_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ReturnRequest[];
}

// Helpers used by /new wizard
export interface InvoiceReturnableItem {
  invoice_line_id: string;
  product_id: string;
  product_name: string;
  serial_id: string;
  serial_number: string;
  unit_price: number;
  delivery_note_id: string | null;
  is_customized: boolean;
  customization_details: Record<string, string | null> | null;
  already_returned: boolean;
}

export async function getReturnableItemsForInvoice(invoiceId: string): Promise<InvoiceReturnableItem[]> {
  // Invoice → SO line → delivery_note_lines for that SO → serials sold
  const { data: invoice, error: invErr } = await sb
    .from('invoices')
    .select('id, sales_order_id, invoice_lines(id, product_id, unit_price, sales_order_line_id, description)')
    .eq('id', invoiceId)
    .maybeSingle();
  if (invErr) throw invErr;
  if (!invoice) return [];
  const lines = ((invoice as any).invoice_lines ?? []) as Array<any>;
  if (lines.length === 0) return [];

  const soLineIds = lines.map((l) => l.sales_order_line_id).filter(Boolean);
  let customizationBySoLine: Record<string, Record<string, string | null>> = {};
  if (soLineIds.length) {
    const { data: soLines } = await sb
      .from('order_lines')
      .select('id, customization_size, customization_colour, customization_fabric, customization_polish, customization_notes')
      .in('id', soLineIds);
    (soLines ?? []).forEach((s: any) => {
      customizationBySoLine[s.id] = {
        size: s.customization_size, colour: s.customization_colour,
        fabric: s.customization_fabric, polish: s.customization_polish,
        notes: s.customization_notes,
      };
    });
  }

  // DN lines tied to this invoice
  const invoiceLineIds = lines.map((l) => l.id);
  const { data: dnLines } = await sb
    .from('delivery_note_lines')
    .select('id, delivery_note_id, invoice_line_id, serial_numbers')
    .in('invoice_line_id', invoiceLineIds);

  // Already-returned serials for this invoice
  const { data: existingReturns } = await sb
    .from('return_request_items')
    .select('serial_number, return_request:return_requests(source_invoice_id, request_status)')
    .eq('return_request.source_invoice_id', invoiceId);
  const returnedSerials = new Set<string>(
    (existingReturns ?? [])
      .filter((r: any) => r.return_request && r.return_request.request_status !== 'cancelled' && r.return_request.request_status !== 'rejected')
      .map((r: any) => r.serial_number)
  );

  // Lookup serial IDs
  const allSerialNums = (dnLines ?? []).flatMap((d: any) => (d.serial_numbers as string[]) ?? []);
  let serialIdMap: Record<string, string> = {};
  let serialStatus: Record<string, string> = {};
  if (allSerialNums.length) {
    const { data: serialRows } = await sb
      .from('goods_receipt_serials')
      .select('id, serial_number, stock_status')
      .in('serial_number', allSerialNums);
    (serialRows ?? []).forEach((s: any) => {
      serialIdMap[s.serial_number] = s.id;
      serialStatus[s.serial_number] = s.stock_status;
    });
  }

  // Product names
  const productIds = Array.from(new Set(lines.map((l) => l.product_id).filter(Boolean)));
  let productNames: Record<string, string> = {};
  if (productIds.length) {
    const { data: prods } = await sb.from('products').select('id, name').in('id', productIds);
    (prods ?? []).forEach((p: any) => { productNames[p.id] = p.name; });
  }

  const out: InvoiceReturnableItem[] = [];
  (dnLines ?? []).forEach((dnl: any) => {
    const invLine = lines.find((l) => l.id === dnl.invoice_line_id);
    if (!invLine) return;
    const custom = invLine.sales_order_line_id ? customizationBySoLine[invLine.sales_order_line_id] ?? null : null;
    const hasCustom = !!custom && Object.values(custom).some((v) => v && String(v).trim() !== '');
    const serials = (dnl.serial_numbers as string[]) ?? [];
    serials.forEach((sn) => {
      const sid = serialIdMap[sn];
      if (!sid) return;
      out.push({
        invoice_line_id: invLine.id,
        product_id: invLine.product_id,
        product_name: productNames[invLine.product_id] ?? invLine.description ?? 'Product',
        serial_id: sid,
        serial_number: sn,
        unit_price: Number(invLine.unit_price ?? 0),
        delivery_note_id: dnl.delivery_note_id,
        is_customized: hasCustom,
        customization_details: hasCustom ? custom : null,
        already_returned: returnedSerials.has(sn) || serialStatus[sn] !== 'sold',
      });
    });
  });
  return out;
}
