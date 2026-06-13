import { supabase } from '@/integrations/supabase/client';
import { addToScanQueue } from '@/lib/services/barcode/api';

export type ITOStatus = 'draft' | 'confirmed' | 'partial' | 'completed' | 'cancelled';
export type ITOLineStatus = 'pending' | 'scanning' | 'completed' | 'blocked';
export type ProductSource = 'display' | 'warehouse' | 'vendor' | 'factory';

export interface InternalTransferOrder {
  id: string;
  ito_number: string;
  sales_order_id: string;
  status: ITOStatus;
  confirmed_by: string | null;
  confirmed_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface InternalTransferOrderLine {
  id: string;
  internal_transfer_order_id: string;
  sales_order_line_id: string;
  product_id: string;
  product_source: ProductSource;
  quantity_expected: number;
  quantity_scanned: number;
  line_status: ITOLineStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ITOSuggestionLine {
  sales_order_line_id: string;
  product_id: string;
  product_name: string | null;
  product_source: ProductSource;
  quantity: number;
  blocked: boolean;
}

export async function suggestITO(salesOrderId: string): Promise<ITOSuggestionLine[]> {
  const { data, error } = await supabase.rpc('suggest_ito_for_so' as any, { p_so_id: salesOrderId });
  if (error) throw error;
  return (data ?? []) as ITOSuggestionLine[];
}

export async function createITO(salesOrderId: string): Promise<string> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) throw new Error('Not signed in');
  const { data, error } = await supabase.rpc('create_ito_from_so' as any, {
    p_so_id: salesOrderId, p_confirmed_by: uid,
  });
  if (error) throw error;
  const itoId = data as string;

  // Add to barcode scan queue
  const { data: ito } = await supabase
    .from('internal_transfer_orders' as any)
    .select('ito_number').eq('id', itoId).maybeSingle();
  const { data: lines } = await supabase
    .from('internal_transfer_order_lines' as any)
    .select('quantity_expected').eq('internal_transfer_order_id', itoId);
  const expected = ((lines ?? []) as unknown as Array<{ quantity_expected: number }>)
    .reduce((s, l) => s + (l.quantity_expected || 0), 0);
  try {
    await addToScanQueue(
      'internal_transfer',
      itoId,
      ((ito as any)?.ito_number as string) ?? itoId,
      expected,
      'normal',
    );
  } catch {
    // queue add is best-effort
  }
  return itoId;
}

export async function getITOById(id: string): Promise<{
  ito: InternalTransferOrder;
  lines: InternalTransferOrderLine[];
} | null> {
  const { data: ito, error } = await supabase
    .from('internal_transfer_orders' as any).select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!ito) return null;
  const { data: lines, error: le } = await supabase
    .from('internal_transfer_order_lines' as any).select('*')
    .eq('internal_transfer_order_id', id).order('created_at', { ascending: true });
  if (le) throw le;
  return {
    ito: ito as unknown as InternalTransferOrder,
    lines: ((lines ?? []) as unknown) as InternalTransferOrderLine[],
  };
}

export async function getITOsForSO(salesOrderId: string): Promise<InternalTransferOrder[]> {
  const { data, error } = await supabase
    .from('internal_transfer_orders' as any).select('*')
    .eq('sales_order_id', salesOrderId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown) as InternalTransferOrder[];
}

export async function cancelITO(itoId: string, reason: string): Promise<void> {
  const { error } = await supabase
    .from('internal_transfer_orders' as any)
    .update({ status: 'cancelled', notes: reason })
    .eq('id', itoId);
  if (error) throw error;
}

export async function checkSOReadyToInvoice(salesOrderId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_so_ready_to_invoice' as any, { p_so_id: salesOrderId });
  if (error) throw error;
  return Boolean(data);
}

export async function getITOQueueId(itoId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('scan_queue' as any).select('id')
    .eq('document_type', 'internal_transfer')
    .eq('document_id', itoId)
    .order('created_at', { ascending: false })
    .limit(1).maybeSingle();
  if (error) throw error;
  return (data as any)?.id ?? null;
}