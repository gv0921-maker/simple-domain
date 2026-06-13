import { supabase } from '@/integrations/supabase/client';
import { logRecordCreated, logStatusChange, logFieldChange } from '@/lib/services/activityLog';
import { createGoodsReceipt } from '@/lib/services/inventory/goodsReceipt';

const sb = supabase as any;

export type VOStatus = 'draft' | 'pending_approval' | 'approved' | 'placed' | 'partial' | 'received' | 'cancelled';
export type VOMode = 'individual' | 'bulk';

export interface VendorOrder {
  id: string;
  vo_number: string;
  vendor_id: string;
  order_mode: VOMode;
  linked_sales_order_id: string | null;
  linked_sales_order_line_id: string | null;
  eta_date: string;
  status: VOStatus;
  notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  placed_at: string | null;
  received_at: string | null;
  cancelled_by: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  vendor?: { id: string; name: string; contact_person: string | null; phone: string | null; email: string | null; address: string | null; gstin: string | null } | null;
  linked_sales_order?: { id: string; reference: string | null } | null;
}

export interface VendorOrderLine {
  id: string;
  vendor_order_id: string;
  product_id: string;
  quantity_ordered: number;
  quantity_received: number;
  size_spec: string | null;
  colour_polish_spec: string | null;
  fabric_spec: string | null;
  customization_notes: string | null;
  reference_images: string[];
  product?: { id: string; name: string; sku: string | null } | null;
}

export interface VOFilters {
  status?: VOStatus | 'all';
  vendor_id?: string;
  mode?: VOMode | 'all';
  eta_from?: string;
  eta_to?: string;
  linked_sales_order_id?: string;
}

export interface CreateVOLineInput {
  product_id: string;
  quantity_ordered: number;
  size_spec?: string | null;
  colour_polish_spec?: string | null;
  fabric_spec?: string | null;
  customization_notes?: string | null;
  reference_images?: string[];
}

export async function getVendorOrders(filters: VOFilters = {}): Promise<VendorOrder[]> {
  let q = sb
    .from('vendor_orders')
    .select('*, vendor:vendors(id,name,contact_person,phone,email,address,gstin), linked_sales_order:sales_orders!vendor_orders_linked_sales_order_id_fkey(id,reference)')
    .order('created_at', { ascending: false });
  if (filters.status && filters.status !== 'all') q = q.eq('status', filters.status);
  if (filters.vendor_id) q = q.eq('vendor_id', filters.vendor_id);
  if (filters.mode && filters.mode !== 'all') q = q.eq('order_mode', filters.mode);
  if (filters.eta_from) q = q.gte('eta_date', filters.eta_from);
  if (filters.eta_to) q = q.lte('eta_date', filters.eta_to);
  if (filters.linked_sales_order_id) q = q.eq('linked_sales_order_id', filters.linked_sales_order_id);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as VendorOrder[];
}

export async function getVendorOrderById(id: string): Promise<{ vo: VendorOrder; lines: VendorOrderLine[] } | null> {
  const { data: vo, error } = await sb
    .from('vendor_orders')
    .select('*, vendor:vendors(id,name,contact_person,phone,email,address,gstin), linked_sales_order:sales_orders!vendor_orders_linked_sales_order_id_fkey(id,reference)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!vo) return null;
  const { data: lines, error: le } = await sb
    .from('vendor_order_lines')
    .select('*, product:products(id,name,sku)')
    .eq('vendor_order_id', id)
    .order('created_at');
  if (le) throw le;
  return { vo: vo as VendorOrder, lines: (lines ?? []) as VendorOrderLine[] };
}

export async function getVendorOrdersForSO(salesOrderId: string): Promise<VendorOrder[]> {
  return getVendorOrders({ linked_sales_order_id: salesOrderId });
}

export async function createVendorOrderDraft(args: {
  vendor_id: string;
  order_mode: VOMode;
  eta_date: string;
  lines: CreateVOLineInput[];
  linked_sales_order_id?: string | null;
  linked_sales_order_line_id?: string | null;
  notes?: string | null;
}): Promise<string> {
  const { data: u } = await supabase.auth.getUser();
  const { data: vo, error } = await sb
    .from('vendor_orders')
    .insert({
      vendor_id: args.vendor_id,
      order_mode: args.order_mode,
      eta_date: args.eta_date,
      linked_sales_order_id: args.linked_sales_order_id ?? null,
      linked_sales_order_line_id: args.linked_sales_order_line_id ?? null,
      notes: args.notes ?? null,
      status: 'draft',
      created_by: u.user?.id ?? null,
    })
    .select('id')
    .single();
  if (error) throw error;
  const voId = (vo as any).id as string;

  if (args.lines.length) {
    const rows = args.lines.map((l) => ({
      vendor_order_id: voId,
      product_id: l.product_id,
      quantity_ordered: Math.max(1, Math.floor(l.quantity_ordered)),
      size_spec: l.size_spec ?? null,
      colour_polish_spec: l.colour_polish_spec ?? null,
      fabric_spec: l.fabric_spec ?? null,
      customization_notes: l.customization_notes ?? null,
      reference_images: l.reference_images ?? [],
    }));
    const { error: le } = await sb.from('vendor_order_lines').insert(rows);
    if (le) throw le;
  }

  try { await logRecordCreated('vendor_order', voId); } catch { /* noop */ }
  return voId;
}

export async function updateDraft(voId: string, input: Partial<{
  vendor_id: string; eta_date: string; notes: string | null;
}>): Promise<void> {
  const { error } = await sb.from('vendor_orders').update(input).eq('id', voId).eq('status', 'draft');
  if (error) throw error;
}

export async function replaceDraftLines(voId: string, lines: CreateVOLineInput[]): Promise<void> {
  const { error: de } = await sb.from('vendor_order_lines').delete().eq('vendor_order_id', voId);
  if (de) throw de;
  if (lines.length) {
    const rows = lines.map((l) => ({
      vendor_order_id: voId,
      product_id: l.product_id,
      quantity_ordered: Math.max(1, Math.floor(l.quantity_ordered)),
      size_spec: l.size_spec ?? null,
      colour_polish_spec: l.colour_polish_spec ?? null,
      fabric_spec: l.fabric_spec ?? null,
      customization_notes: l.customization_notes ?? null,
      reference_images: l.reference_images ?? [],
    }));
    const { error: ie } = await sb.from('vendor_order_lines').insert(rows);
    if (ie) throw ie;
  }
}

async function transition(voId: string, from: VOStatus, to: VOStatus) {
  try { await logStatusChange('vendor_order', voId, from, to); } catch { /* noop */ }
}

export async function submitForApproval(voId: string): Promise<void> {
  const { error } = await sb.from('vendor_orders').update({ status: 'pending_approval' }).eq('id', voId).eq('status', 'draft');
  if (error) throw error;
  await transition(voId, 'draft', 'pending_approval');
}

export async function approveVendorOrder(voId: string): Promise<void> {
  const { error } = await sb.rpc('approve_vendor_order', { p_vo_id: voId });
  if (error) throw error;
  await transition(voId, 'pending_approval', 'approved');
}

export async function placeVendorOrder(voId: string): Promise<void> {
  const { error } = await sb.rpc('place_vendor_order', { p_vo_id: voId });
  if (error) throw error;
  await transition(voId, 'approved', 'placed');
}

export async function cancelVendorOrder(voId: string, reason: string): Promise<void> {
  const { error } = await sb.rpc('cancel_vendor_order', { p_vo_id: voId, p_reason: reason });
  if (error) throw error;
  try { await logFieldChange('vendor_order', voId, 'cancellation_reason', null, reason); } catch { /* noop */ }
  await transition(voId, 'placed' as VOStatus, 'cancelled');
}

export interface LineReceipt { line_id: string; quantity_received: number; }

export async function recordReceipt(voId: string, lineReceipts: LineReceipt[]): Promise<string> {
  const detail = await getVendorOrderById(voId);
  if (!detail) throw new Error('Vendor order not found');
  const { vo, lines } = detail;

  // Update qty_received on each line
  for (const r of lineReceipts) {
    if (r.quantity_received <= 0) continue;
    const ln = lines.find((l) => l.id === r.line_id);
    if (!ln) continue;
    const newQty = Math.min(ln.quantity_ordered, ln.quantity_received + Math.floor(r.quantity_received));
    const { error } = await sb.from('vendor_order_lines').update({ quantity_received: newQty }).eq('id', r.line_id);
    if (error) throw error;
  }

  // Create GR
  const grLines = lineReceipts
    .filter((r) => r.quantity_received > 0)
    .map((r) => {
      const ln = lines.find((l) => l.id === r.line_id)!;
      return {
        product_id: ln.product_id,
        product_name: ln.product?.name ?? undefined,
        product_sku: ln.product?.sku ?? undefined,
        expected_quantity: r.quantity_received,
        received_quantity: r.quantity_received,
        source_line_id: ln.id,
      };
    });

  const gr = await createGoodsReceipt({
    source_type: 'vendor_order',
    source_document_id: voId,
    source_document_reference: vo.vo_number,
    lines: grLines,
  });

  // Re-check all lines
  const refreshed = await getVendorOrderById(voId);
  if (refreshed) {
    const allDone = refreshed.lines.every((l) => l.quantity_received >= l.quantity_ordered);
    const anyReceived = refreshed.lines.some((l) => l.quantity_received > 0);
    const newStatus: VOStatus | null = allDone ? 'received' : (anyReceived ? 'partial' : null);
    if (newStatus) {
      const patch: Record<string, unknown> = { status: newStatus };
      if (newStatus === 'received') patch.received_at = new Date().toISOString();
      const { error } = await sb.from('vendor_orders').update(patch).eq('id', voId);
      if (error) throw error;
      await transition(voId, vo.status, newStatus);
    }
  }

  return gr.id;
}

export async function validateSOLinkedEta(salesOrderId: string, proposedEta: string): Promise<{ ok: boolean; so_eta: string | null; recommended_eta: string | null; }> {
  const { data, error } = await sb.rpc('validate_so_linked_eta', { p_so_id: salesOrderId, p_proposed_eta: proposedEta });
  if (error) throw error;
  return data as { ok: boolean; so_eta: string | null; recommended_eta: string | null };
}

export async function getGRsForVO(voId: string) {
  const { data, error } = await sb
    .from('goods_receipts')
    .select('id, gr_number, status, created_at, received_at')
    .eq('source_type', 'vendor_order')
    .eq('source_document_id', voId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; gr_number: string; status: string; created_at: string; received_at: string | null }>;
}

export const VO_STATUS_LABEL: Record<VOStatus, string> = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  placed: 'Placed',
  partial: 'Partial Receipt',
  received: 'Received',
  cancelled: 'Cancelled',
};