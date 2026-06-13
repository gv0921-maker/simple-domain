import { supabase } from '@/integrations/supabase/client';

const sb = supabase as any;

export interface DeliveryLineSummary {
  line_id: string;
  product_id: string | null;
  product: string;
  qty_invoiced: number;
  qty_delivered: number;
  qty_remaining: number;
  fully_delivered: boolean;
  serial_numbers_delivered: string[];
}

export interface InvoiceDeliverySummary {
  total_invoiced_qty: number;
  total_delivered_qty: number;
  balance_to_deliver: number;
  dn_count: number;
  line_summary: DeliveryLineSummary[];
}

export interface DeliveryLineInput {
  invoice_line_id: string;
  quantity_to_deliver: number;
  serial_numbers: string[];
}

export async function getInvoiceDeliverySummary(invoiceId: string): Promise<InvoiceDeliverySummary> {
  const { data, error } = await sb.rpc('get_invoice_delivery_summary', { p_invoice_id: invoiceId });
  if (error) throw error;
  return data as InvoiceDeliverySummary;
}

export async function createPartialDeliveryNote(
  invoiceId: string,
  lineItems: DeliveryLineInput[],
): Promise<string> {
  const { data, error } = await sb.rpc('create_partial_delivery_note', {
    p_invoice_id: invoiceId,
    p_line_items: lineItems,
  });
  if (error) throw error;
  return data as string;
}

export async function confirmDelivery(dnId: string, signatureReceived: boolean): Promise<{ dn_id: string; so_closed: boolean }> {
  const { data, error } = await sb.rpc('confirm_delivery', {
    p_dn_id: dnId,
    p_signature_received: signatureReceived,
  });
  if (error) throw error;
  return data;
}

export async function getDeliveryNotesForInvoice(invoiceId: string) {
  const { data, error } = await sb
    .from('delivery_notes')
    .select('id, reference, status, delivery_date, delivered_at, customer_signature_received, is_partial, dn_sequence_in_invoice, products_json')
    .eq('invoice_id', invoiceId)
    .order('dn_sequence_in_invoice', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getDeliveryNoteWithLines(dnId: string) {
  const { data, error } = await sb
    .from('delivery_notes')
    .select('*, delivery_note_lines(*)')
    .eq('id', dnId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getAvailableSerialsForSO(salesOrderId: string, productId: string): Promise<string[]> {
  const { data, error } = await sb
    .from('goods_receipt_serials')
    .select('serial_number')
    .eq('reserved_for_so_id', salesOrderId)
    .eq('product_id', productId)
    .eq('stock_status', 'reserved');
  if (error) throw error;
  const all = (data ?? []).map((r: any) => r.serial_number as string);
  // Filter out those already placed on a DN line
  const { data: used } = await sb
    .from('delivery_note_lines')
    .select('serial_numbers');
  const usedSet = new Set<string>();
  (used ?? []).forEach((r: any) => (r.serial_numbers ?? []).forEach((s: string) => usedSet.add(s)));
  return all.filter((s) => !usedSet.has(s));
}