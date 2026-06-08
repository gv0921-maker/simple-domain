import { supabase } from '@/integrations/supabase/client';

export type DeliveryQCStatus = 'pending' | 'passed' | 'failed';

export interface DeliveryQC {
  id: string;
  salesOrderId: string;
  status: DeliveryQCStatus;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  qcImages: string[];
  scannedSerials: string[];
  qcNotes?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeliveryQCInput {
  salesOrderId: string;
  status: DeliveryQCStatus;
  qcImages: string[];
  scannedSerials: string[];
  qcNotes?: string;
}

function mapRow(r: any): DeliveryQC {
  return {
    id: r.id,
    salesOrderId: r.sales_order_id,
    status: r.status,
    verifiedBy: r.verified_by,
    verifiedAt: r.verified_at,
    qcImages: r.qc_images ?? [],
    scannedSerials: r.scanned_serials ?? [],
    qcNotes: r.qc_notes,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

const sb = supabase as any;

export async function uploadDeliveryQCImageAsync(salesOrderId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const filename = `${crypto.randomUUID()}.${ext}`;
  const path = `delivery-qc/${salesOrderId}/${filename}`;
  const { error } = await supabase.storage
    .from('delivery-qc-images')
    .upload(path, file, { upsert: false, contentType: file.type || undefined });
  if (error) throw error;
  const { data } = supabase.storage.from('delivery-qc-images').getPublicUrl(path);
  return data.publicUrl;
}

export async function getLatestDeliveryQCAsync(salesOrderId: string): Promise<DeliveryQC | null> {
  const { data, error } = await sb
    .from('delivery_qc')
    .select('*')
    .eq('sales_order_id', salesOrderId)
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) throw error;
  const row = (data ?? [])[0];
  return row ? mapRow(row) : null;
}

export async function createDeliveryQCAsync(input: CreateDeliveryQCInput): Promise<DeliveryQC> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData?.user?.id ?? null;
  const row = {
    sales_order_id: input.salesOrderId,
    status: input.status,
    qc_images: input.qcImages,
    scanned_serials: input.scannedSerials,
    qc_notes: input.qcNotes ?? null,
    verified_by: uid,
    verified_at: new Date().toISOString(),
    created_by: uid,
  };
  const { data, error } = await sb.from('delivery_qc').insert(row).select('*').single();
  if (error) throw error;
  return mapRow(data);
}