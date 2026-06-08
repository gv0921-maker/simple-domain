import { supabase } from '@/integrations/supabase/client';

export type QCReferenceType = 'purchase_order' | 'work_order';
export type QCStatus = 'pending' | 'passed' | 'failed';

export interface GoodsReceiptQC {
  id: string;
  referenceType: QCReferenceType;
  referenceId: string;
  productId: string;
  expectedQuantity: number;
  receivedQuantity: number;
  serialNumbersScanned: string[];
  lotNumbersScanned: string[];
  qcStatus: QCStatus;
  qcImages: string[];
  qcNotes?: string | null;
  qcBy?: string | null;
  qcAt?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoodsReceiptQCInput {
  referenceType: QCReferenceType;
  referenceId: string;
  productId: string;
  expectedQuantity: number;
  receivedQuantity: number;
  serialNumbersScanned: string[];
  lotNumbersScanned: string[];
  qcStatus: QCStatus;
  qcImages: string[];
  qcNotes?: string;
}

function mapRow(r: any): GoodsReceiptQC {
  return {
    id: r.id,
    referenceType: r.reference_type,
    referenceId: r.reference_id,
    productId: r.product_id,
    expectedQuantity: Number(r.expected_quantity ?? 0),
    receivedQuantity: Number(r.received_quantity ?? 0),
    serialNumbersScanned: r.serial_numbers_scanned ?? [],
    lotNumbersScanned: r.lot_numbers_scanned ?? [],
    qcStatus: r.qc_status,
    qcImages: r.qc_images ?? [],
    qcNotes: r.qc_notes,
    qcBy: r.qc_by,
    qcAt: r.qc_at,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

const sb = supabase as any;

export async function uploadQCImageAsync(
  referenceType: QCReferenceType,
  referenceId: string,
  file: File,
): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const filename = `${crypto.randomUUID()}.${ext}`;
  const path = `qc/${referenceType}/${referenceId}/${filename}`;
  const { error } = await supabase.storage
    .from('qc-images')
    .upload(path, file, { upsert: false, contentType: file.type || undefined });
  if (error) throw error;
  const { data } = supabase.storage.from('qc-images').getPublicUrl(path);
  return data.publicUrl;
}

export async function createGoodsReceiptQCAsync(
  inputs: CreateGoodsReceiptQCInput[],
): Promise<GoodsReceiptQC[]> {
  if (inputs.length === 0) return [];
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData?.user?.id ?? null;
  const nowIso = new Date().toISOString();
  const rows = inputs.map(i => ({
    reference_type: i.referenceType,
    reference_id: i.referenceId,
    product_id: i.productId,
    expected_quantity: i.expectedQuantity,
    received_quantity: i.receivedQuantity,
    serial_numbers_scanned: i.serialNumbersScanned,
    lot_numbers_scanned: i.lotNumbersScanned,
    qc_status: i.qcStatus,
    qc_images: i.qcImages,
    qc_notes: i.qcNotes ?? null,
    qc_by: uid,
    qc_at: nowIso,
    created_by: uid,
  }));
  const { data, error } = await sb.from('goods_receipt_qc').insert(rows).select('*');
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function getQCByReferenceAsync(
  referenceType: QCReferenceType,
  referenceId: string,
): Promise<GoodsReceiptQC[]> {
  const { data, error } = await sb
    .from('goods_receipt_qc')
    .select('*')
    .eq('reference_type', referenceType)
    .eq('reference_id', referenceId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function getQCByProductAsync(productId: string): Promise<GoodsReceiptQC[]> {
  const { data, error } = await sb
    .from('goods_receipt_qc')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}