import { supabase } from '@/integrations/supabase/client';
import { logStatusChange } from '@/lib/services/activityLog';

const sb = supabase as any;

export type StockBucket =
  | 'pending' | 'available' | 'under_correction' | 'reserved'
  | 'sold' | 'returned_to_vendor' | 'written_off' | 'rejected';

export const SALEABLE_BUCKETS: StockBucket[] = ['available', 'under_correction'];
export const ON_HAND_BUCKETS: StockBucket[] = ['pending', 'available', 'under_correction', 'reserved'];

export interface StockSummaryRow {
  product_id: string;
  stock_status: StockBucket;
  unit_count: number;
  total_value: number;
}

export async function getStockSummary(productIds?: string[]): Promise<StockSummaryRow[]> {
  let q = sb.from('v_stock_summary').select('*');
  if (productIds && productIds.length > 0) q = q.in('product_id', productIds);
  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as any[]).map(r => ({
    product_id: r.product_id,
    stock_status: r.stock_status as StockBucket,
    unit_count: Number(r.unit_count ?? 0),
    total_value: Number(r.total_value ?? 0),
  }));
}

export async function getProductStockBuckets(productId: string): Promise<Record<StockBucket, number>> {
  const rows = await getStockSummary([productId]);
  const out = {} as Record<StockBucket, number>;
  rows.forEach(r => { out[r.stock_status] = r.unit_count; });
  return out;
}

export async function getSerialsInBucket(productId: string, bucketStatus: StockBucket) {
  const { data, error } = await sb
    .from('goods_receipt_serials')
    .select('id, serial_number, barcode_value, stock_status, qc_status, reserved_for_so_id, updated_at')
    .eq('product_id', productId)
    .eq('stock_status', bucketStatus)
    .order('serial_number', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function reserveSerialToSO(serialId: string, salesOrderId: string) {
  const { data: prev } = await sb.from('goods_receipt_serials').select('stock_status').eq('id', serialId).maybeSingle();
  const { error } = await sb
    .from('goods_receipt_serials')
    .update({ stock_status: 'reserved', reserved_for_so_id: salesOrderId })
    .eq('id', serialId);
  if (error) throw error;
  await logStatusChange('goods_receipt_serial', serialId, prev?.stock_status ?? null, 'reserved');
}

export async function releaseSerialReservation(serialId: string) {
  const { data: prev } = await sb.from('goods_receipt_serials').select('stock_status').eq('id', serialId).maybeSingle();
  const { error } = await sb
    .from('goods_receipt_serials')
    .update({ stock_status: 'available', reserved_for_so_id: null })
    .eq('id', serialId);
  if (error) throw error;
  await logStatusChange('goods_receipt_serial', serialId, prev?.stock_status ?? null, 'available');
}

export const BUCKET_LABELS: Record<StockBucket, string> = {
  pending: 'Pending QC',
  available: 'Available',
  under_correction: 'Under Correction',
  reserved: 'Reserved',
  sold: 'Sold',
  returned_to_vendor: 'Returned to Vendor',
  written_off: 'Written Off',
  rejected: 'Rejected',
};

export const BUCKET_BADGE_CLASS: Record<StockBucket, string> = {
  pending: 'bg-muted text-muted-foreground',
  available: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  under_correction: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  reserved: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  sold: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300',
  returned_to_vendor: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
  written_off: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
};
