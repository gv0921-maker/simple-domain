import { supabase } from '@/integrations/supabase/client';
import { logRecordCreated, logStatusChange, logFieldChange } from '@/lib/services/activityLog';

const sb = supabase as any;

export type WriteOffStatus = 'draft' | 'approved' | 'cancelled';
export type WriteOffType =
  | 'damage' | 'loss' | 'theft' | 'obsolete' | 'scrap'
  | 'count_missing' | 'qc_unsalvageable' | 'other';
export type WriteOffSourceType =
  | 'stock_count' | 'correction_order' | 'return' | 'damage_report' | 'manual';

export interface WriteOffRecord {
  id: string;
  wf_number: string;
  write_off_type: WriteOffType;
  source_type: WriteOffSourceType | null;
  source_document_id: string | null;
  source_document_reference: string | null;
  status: WriteOffStatus;
  reason: string;
  evidence_photos: string[];
  total_value: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  approved_by: string | null;
  approved_at: string | null;
  cancelled_by: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
}

export interface WriteOffItem {
  id: string;
  write_off_record_id: string;
  goods_receipt_serial_id: string;
  product_id: string;
  serial_number: string;
  unit_cost_value: number;
  item_specific_notes: string | null;
  created_at: string;
  product?: { name: string | null; sku: string | null } | null;
}

export interface WriteOffFilters {
  status?: WriteOffStatus | 'all';
  writeOffType?: WriteOffType;
  dateFrom?: string;
  dateTo?: string;
  createdBy?: string;
}

async function uid(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function getWriteOffs(filters: WriteOffFilters = {}): Promise<WriteOffRecord[]> {
  let q = sb.from('write_off_records').select('*').order('created_at', { ascending: false });
  if (filters.status && filters.status !== 'all') q = q.eq('status', filters.status);
  if (filters.writeOffType) q = q.eq('write_off_type', filters.writeOffType);
  if (filters.dateFrom) q = q.gte('created_at', filters.dateFrom);
  if (filters.dateTo) q = q.lte('created_at', filters.dateTo);
  if (filters.createdBy) q = q.eq('created_by', filters.createdBy);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as WriteOffRecord[];
}

export async function getWriteOffById(id: string): Promise<{ record: WriteOffRecord; items: WriteOffItem[] } | null> {
  const { data, error } = await sb.from('write_off_records').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { data: items, error: ie } = await sb
    .from('write_off_items')
    .select('*, product:products(name, sku)')
    .eq('write_off_record_id', id)
    .order('created_at', { ascending: true });
  if (ie) throw ie;
  return { record: data as WriteOffRecord, items: (items ?? []) as WriteOffItem[] };
}

export async function createWriteOffDraft(input: {
  writeOffType: WriteOffType;
  sourceType?: WriteOffSourceType;
  sourceDocumentId?: string;
  sourceDocumentReference?: string;
  reason?: string;
  serialIds?: string[];
  notes?: string;
}): Promise<string> {
  const userId = await uid();
  if (!userId) throw new Error('Not authenticated');
  const { data, error } = await sb
    .from('write_off_records')
    .insert({
      write_off_type: input.writeOffType,
      source_type: input.sourceType ?? 'manual',
      source_document_id: input.sourceDocumentId ?? null,
      source_document_reference: input.sourceDocumentReference ?? null,
      reason: input.reason ?? '',
      created_by: userId,
    })
    .select('id')
    .single();
  if (error) throw error;
  const id = (data as any).id as string;
  await logRecordCreated('write_off', id);
  if (input.serialIds && input.serialIds.length > 0) {
    await addItemsToWriteOff(id, input.serialIds, input.notes);
  }
  return id;
}

export async function updateWriteOffDraft(id: string, patch: { reason?: string; write_off_type?: WriteOffType }) {
  const { data: prev } = await sb.from('write_off_records').select('reason, write_off_type').eq('id', id).maybeSingle();
  const { error } = await sb.from('write_off_records').update(patch).eq('id', id);
  if (error) throw error;
  if (prev) {
    if (patch.reason !== undefined && patch.reason !== prev.reason)
      await logFieldChange('write_off', id, 'reason', prev.reason, patch.reason);
    if (patch.write_off_type !== undefined && patch.write_off_type !== prev.write_off_type)
      await logFieldChange('write_off', id, 'write_off_type', prev.write_off_type, patch.write_off_type);
  }
}

export async function addItemsToWriteOff(wfId: string, serialIds: string[], notes?: string): Promise<number> {
  if (serialIds.length === 0) return 0;
  const { data: serials, error: se } = await sb
    .from('goods_receipt_serials')
    .select('id, product_id, serial_number')
    .in('id', serialIds);
  if (se) throw se;
  const rows = ((serials ?? []) as any[]).map(s => ({
    write_off_record_id: wfId,
    goods_receipt_serial_id: s.id,
    product_id: s.product_id,
    serial_number: s.serial_number,
    item_specific_notes: notes ?? null,
  }));
  // Try to attach product cost
  const productIds = Array.from(new Set(rows.map(r => r.product_id)));
  if (productIds.length > 0) {
    const { data: prods } = await sb.from('products').select('id, cost_price').in('id', productIds);
    const costMap = new Map<string, number>();
    ((prods ?? []) as any[]).forEach(p => costMap.set(p.id, Number(p.cost_price ?? 0)));
    rows.forEach((r: any) => { r.unit_cost_value = costMap.get(r.product_id) ?? 0; });
  }
  const { error } = await sb.from('write_off_items').insert(rows);
  if (error) throw error;
  await logFieldChange('write_off', wfId, 'items_added', null, String(rows.length));
  return rows.length;
}

export async function removeItemFromWriteOff(wfId: string, itemId: string) {
  const { error } = await sb.from('write_off_items').delete().eq('id', itemId);
  if (error) throw error;
  await logFieldChange('write_off', wfId, 'item_removed', itemId, null);
}

export async function uploadEvidencePhoto(wfId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${wfId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const up = await supabase.storage.from('write-off-evidence').upload(path, file, { upsert: false });
  if (up.error) throw up.error;
  const { data: pub } = supabase.storage.from('write-off-evidence').getPublicUrl(path);
  const url = pub.publicUrl;
  const { data: rec } = await sb.from('write_off_records').select('evidence_photos').eq('id', wfId).maybeSingle();
  const existing: string[] = (rec?.evidence_photos as string[]) ?? [];
  const next = [...existing, url];
  const { error } = await sb.from('write_off_records').update({ evidence_photos: next }).eq('id', wfId);
  if (error) throw error;
  await logFieldChange('write_off', wfId, 'photo_added', null, url);
  return url;
}

export async function removeEvidencePhoto(wfId: string, url: string) {
  const { data: rec } = await sb.from('write_off_records').select('evidence_photos').eq('id', wfId).maybeSingle();
  const existing: string[] = (rec?.evidence_photos as string[]) ?? [];
  const next = existing.filter(u => u !== url);
  const { error } = await sb.from('write_off_records').update({ evidence_photos: next }).eq('id', wfId);
  if (error) throw error;
  await logFieldChange('write_off', wfId, 'photo_removed', url, null);
}

export async function submitForApproval(wfId: string) {
  // No separate "pending" status — we treat draft+submission as a state hint via activity log + notification stub.
  await logFieldChange('write_off', wfId, 'submitted_for_approval', null, new Date().toISOString());
}

export async function approveWriteOff(wfId: string): Promise<{ total_value: number; item_count: number }> {
  const { data, error } = await sb.rpc('approve_write_off', { p_wf_id: wfId });
  if (error) throw error;
  await logStatusChange('write_off', wfId, 'draft', 'approved');
  return data as { total_value: number; item_count: number };
}

export async function cancelWriteOff(wfId: string, reason: string) {
  const { error } = await sb.rpc('cancel_write_off', { p_wf_id: wfId, p_reason: reason });
  if (error) throw error;
  await logStatusChange('write_off', wfId, 'draft', 'cancelled');
}

export async function getProductStockBreakdown(productId: string): Promise<Record<string, number>> {
  const { data, error } = await sb.rpc('get_product_stock_breakdown', { p_product_id: productId });
  if (error) throw error;
  return (data ?? {}) as Record<string, number>;
}

export async function findEligibleSerialsForWriteOff(params: { search?: string; productId?: string }): Promise<Array<{
  id: string; serial_number: string; product_id: string; product_name: string | null; stock_status: string;
}>> {
  let q = sb
    .from('goods_receipt_serials')
    .select('id, serial_number, product_id, stock_status, product:products(name)')
    .in('stock_status', ['available', 'under_correction', 'reserved'])
    .order('serial_number', { ascending: true })
    .limit(200);
  if (params.productId) q = q.eq('product_id', params.productId);
  if (params.search) q = q.ilike('serial_number', `%${params.search}%`);
  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as any[]).map(r => ({
    id: r.id,
    serial_number: r.serial_number,
    product_id: r.product_id,
    product_name: r.product?.name ?? null,
    stock_status: r.stock_status,
  }));
}
