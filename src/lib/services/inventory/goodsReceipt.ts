import { supabase } from '@/integrations/supabase/client';
import { logStatusChange, logRecordCreated, logFieldChange } from '@/lib/services/activityLog';

const sb = supabase as any;

export type GRSourceType = 'vendor_order' | 'work_order' | 'manual' | 'return';
export type GRStatus = 'draft' | 'quantity_pending' | 'labels_pending' | 'qc_pending' | 'completed' | 'cancelled';
export type GRDiscrepancyStatus = 'matched' | 'quantity_mismatch' | 'product_mismatch' | 'both_mismatch';
export type GRSerialStockStatus = 'pending' | 'available' | 'under_correction' | 'rejected' | 'reserved' | 'sold';
export type GRSerialQCStatus = 'pending' | 'passed' | 'failed';

export interface GoodsReceipt {
  id: string;
  gr_number: string;
  source_type: GRSourceType;
  source_document_id: string | null;
  source_document_reference: string | null;
  status: GRStatus;
  discrepancy_status: GRDiscrepancyStatus;
  discrepancy_approved_by: string | null;
  discrepancy_approved_at: string | null;
  discrepancy_reason: string | null;
  labels_generated: boolean;
  labels_generated_at: string | null;
  warehouse_id: string | null;
  received_by: string | null;
  received_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoodsReceiptLine {
  id: string;
  goods_receipt_id: string;
  product_id: string;
  product_name_cached: string | null;
  product_sku_cached: string | null;
  expected_quantity: number;
  received_quantity: number;
  accepted_quantity: number;
  under_correction_quantity: number;
  rejected_quantity: number;
  source_line_id: string | null;
  notes: string | null;
}

export interface GoodsReceiptSerial {
  id: string;
  goods_receipt_id: string;
  goods_receipt_line_id: string;
  product_id: string;
  serial_number: string;
  barcode_value: string;
  qc_status: GRSerialQCStatus;
  qc_notes: string | null;
  qc_images: string[];
  qc_checked_by: string | null;
  qc_checked_at: string | null;
  stock_status: GRSerialStockStatus;
  current_warehouse_id: string | null;
  current_location: string | null;
}

export interface CreateGRLineInput {
  product_id: string;
  product_name?: string;
  product_sku?: string;
  expected_quantity: number;
  received_quantity?: number;
  source_line_id?: string | null;
  notes?: string | null;
}

async function uid(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function listGoodsReceipts(): Promise<GoodsReceipt[]> {
  const { data, error } = await sb.from('goods_receipts').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as GoodsReceipt[];
}

export async function getGoodsReceipt(id: string): Promise<GoodsReceipt | null> {
  const { data, error } = await sb.from('goods_receipts').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data ?? null) as GoodsReceipt | null;
}

export async function getGoodsReceiptLines(grId: string): Promise<GoodsReceiptLine[]> {
  const { data, error } = await sb.from('goods_receipt_lines').select('*').eq('goods_receipt_id', grId).order('created_at');
  if (error) throw error;
  return (data ?? []) as GoodsReceiptLine[];
}

export async function getGoodsReceiptSerials(grId: string): Promise<GoodsReceiptSerial[]> {
  const { data, error } = await sb.from('goods_receipt_serials').select('*').eq('goods_receipt_id', grId).order('serial_number');
  if (error) throw error;
  return (data ?? []) as GoodsReceiptSerial[];
}

export async function getGoodsReceiptWithSerials(grId: string) {
  const [gr, lines, serials] = await Promise.all([
    getGoodsReceipt(grId),
    getGoodsReceiptLines(grId),
    getGoodsReceiptSerials(grId),
  ]);
  return { gr, lines, serials };
}

export interface CreateGoodsReceiptInput {
  source_type: GRSourceType;
  source_document_id?: string | null;
  source_document_reference?: string | null;
  warehouse_id?: string | null;
  notes?: string | null;
  lines: CreateGRLineInput[];
}

export async function createGoodsReceipt(input: CreateGoodsReceiptInput): Promise<GoodsReceipt> {
  const me = await uid();
  const { data: gr, error } = await sb.from('goods_receipts').insert({
    source_type: input.source_type,
    source_document_id: input.source_document_id ?? null,
    source_document_reference: input.source_document_reference ?? null,
    warehouse_id: input.warehouse_id ?? null,
    notes: input.notes ?? null,
    status: 'quantity_pending',
    created_by: me,
  }).select('*').single();
  if (error) throw error;

  if (input.lines.length) {
    const rows = input.lines.map(l => ({
      goods_receipt_id: gr.id,
      product_id: l.product_id,
      product_name_cached: l.product_name ?? null,
      product_sku_cached: l.product_sku ?? null,
      expected_quantity: Math.max(0, Math.floor(l.expected_quantity)),
      received_quantity: Math.max(0, Math.floor(l.received_quantity ?? l.expected_quantity)),
      source_line_id: l.source_line_id ?? null,
      notes: l.notes ?? null,
    }));
    const { error: lerr } = await sb.from('goods_receipt_lines').insert(rows);
    if (lerr) throw lerr;
  }

  try {
    await logRecordCreated('goods_receipt' as any, gr.id, `Goods Receipt ${gr.gr_number} created (source: ${input.source_type})`);
  } catch { /* noop */ }
  return gr as GoodsReceipt;
}

export async function updateReceivedQuantities(
  grId: string,
  lineUpdates: Array<{ id: string; received_quantity: number }>,
): Promise<{ discrepancy: GRDiscrepancyStatus }> {
  for (const u of lineUpdates) {
    const { error } = await sb.from('goods_receipt_lines')
      .update({ received_quantity: Math.max(0, Math.floor(u.received_quantity)) })
      .eq('id', u.id);
    if (error) throw error;
  }
  const lines = await getGoodsReceiptLines(grId);
  let qtyMismatch = false;
  for (const l of lines) {
    if (l.received_quantity !== l.expected_quantity) qtyMismatch = true;
  }
  const discrepancy: GRDiscrepancyStatus = qtyMismatch ? 'quantity_mismatch' : 'matched';
  await sb.from('goods_receipts').update({ discrepancy_status: discrepancy }).eq('id', grId);
  return { discrepancy };
}

export async function approveDiscrepancy(grId: string, reason: string): Promise<void> {
  const me = await uid();
  const { error } = await sb.from('goods_receipts').update({
    discrepancy_approved_by: me,
    discrepancy_approved_at: new Date().toISOString(),
    discrepancy_reason: reason,
    status: 'labels_pending',
  }).eq('id', grId);
  if (error) throw error;
  try { await logFieldChange('goods_receipt' as any, grId, 'discrepancy_approved', null, reason); } catch { /* noop */ }
}

export async function advanceToLabelsStep(grId: string): Promise<void> {
  const { error } = await sb.from('goods_receipts').update({ status: 'labels_pending' }).eq('id', grId);
  if (error) throw error;
  try { await logStatusChange('goods_receipt' as any, grId, 'quantity_pending', 'labels_pending'); } catch { /* noop */ }
}

export async function generateSerialsForLine(grLineId: string): Promise<string[]> {
  const { data, error } = await sb.rpc('generate_serials_for_gr_line', { p_gr_line_id: grLineId });
  if (error) throw error;
  return (data ?? []) as string[];
}

export async function markLabelsGenerated(grId: string): Promise<void> {
  const { error } = await sb.from('goods_receipts').update({
    labels_generated: true,
    labels_generated_at: new Date().toISOString(),
    status: 'qc_pending',
  }).eq('id', grId);
  if (error) throw error;
  try { await logStatusChange('goods_receipt' as any, grId, 'labels_pending', 'qc_pending'); } catch { /* noop */ }
}

export async function recordItemQC(
  serialId: string,
  passed: boolean,
  notes?: string,
  images?: string[],
): Promise<void> {
  const me = await uid();
  const { error } = await sb.from('goods_receipt_serials').update({
    qc_status: passed ? 'passed' : 'failed',
    qc_notes: notes ?? null,
    qc_images: images ?? [],
    qc_checked_by: me,
    qc_checked_at: new Date().toISOString(),
    stock_status: passed ? 'available' : 'under_correction',
  }).eq('id', serialId);
  if (error) throw error;
}

export async function completeGRLineQC(
  grLineId: string,
  passedSerialIds: string[],
  failedSerialIds: string[],
  failedNotes?: string,
): Promise<void> {
  const { error } = await sb.rpc('complete_gr_line_qc', {
    p_gr_line_id: grLineId,
    p_passed_serial_ids: passedSerialIds,
    p_failed_serial_ids: failedSerialIds,
    p_failed_notes: failedNotes ?? null,
  });
  if (error) throw error;
}

export async function uploadQCImage(grId: string, serialId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `qc/${grId}/${serialId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('qc-images').upload(path, file, { upsert: false, contentType: file.type || undefined });
  if (error) throw error;
  const { data } = supabase.storage.from('qc-images').getPublicUrl(path);
  return data.publicUrl;
}