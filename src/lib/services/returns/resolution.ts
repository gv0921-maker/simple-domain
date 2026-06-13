import { supabase } from '@/integrations/supabase/client';
import { logFieldChange, addManualNote } from '@/lib/services/activityLog';
import type { ConditionGrade, ResolutionType } from './index';

const sb = supabase as any;

export type AllowedResolution = Extract<ResolutionType, 'exchange' | 'credit_note' | 'refund'>;

export function getAllowedResolutionsForGrade(grade: ConditionGrade | null): AllowedResolution[] {
  if (!grade) return [];
  if (grade === 'unsalvageable') return ['credit_note', 'refund'];
  return ['exchange', 'credit_note', 'refund'];
}

export async function processExchange(itemId: string, replacementProductId: string): Promise<string> {
  const { data, error } = await sb.rpc('process_exchange_resolution', {
    p_item_id: itemId,
    p_replacement_product_id: replacementProductId,
  });
  if (error) throw error;
  return data as string;
}

export async function selectExchangeReplacementSerial(exchangeId: string, serialId: string): Promise<void> {
  // Reserve serial + assign to exchange
  const { data: serial, error: sErr } = await sb
    .from('goods_receipt_serials')
    .select('id, stock_status')
    .eq('id', serialId)
    .maybeSingle();
  if (sErr) throw sErr;
  if (!serial) throw new Error('Serial not found');
  if (serial.stock_status !== 'available') throw new Error(`Serial is not available (${serial.stock_status})`);

  const { error: rErr } = await sb
    .from('goods_receipt_serials')
    .update({ stock_status: 'reserved', updated_at: new Date().toISOString() })
    .eq('id', serialId);
  if (rErr) throw rErr;

  const { error } = await sb
    .from('exchanges')
    .update({ replacement_serial_id: serialId, status: 'item_selected' })
    .eq('id', exchangeId);
  if (error) throw error;
}

export async function settleExchangePriceDifference(
  exchangeId: string,
  paymentMode: 'cash' | 'bank_transfer' | 'cheque' | 'card' | 'upi',
  paymentAccountId: string,
  referenceNumber?: string | null,
): Promise<void> {
  const { data: exch, error: eErr } = await sb
    .from('exchanges')
    .select('*, source_return_request_id, source_invoice_id, price_difference')
    .eq('id', exchangeId)
    .maybeSingle();
  if (eErr) throw eErr;
  if (!exch) throw new Error('Exchange not found');
  if (Number(exch.price_difference) <= 0) {
    await sb.from('exchanges').update({ price_difference_settled: true, status: 'price_settled' }).eq('id', exchangeId);
    return;
  }

  // Resolve SO from source invoice
  const { data: inv } = await sb.from('invoices').select('sales_order_id').eq('id', exch.source_invoice_id).maybeSingle();
  const soId = inv?.sales_order_id;
  if (!soId) throw new Error('Cannot settle: invoice not linked to a sales order');

  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (!uid) throw new Error('Not authenticated');

  const { data: pay, error: pErr } = await sb
    .from('sales_order_payments')
    .insert({
      sales_order_id: soId,
      payment_number: '',
      amount: Number(exch.price_difference),
      payment_mode: paymentMode,
      payment_account_id: paymentAccountId,
      reference_number: referenceNumber || null,
      notes: `Exchange price difference (${exch.exchange_number ?? exchangeId})`,
      received_by: uid,
    })
    .select('id')
    .single();
  if (pErr) throw pErr;

  const { error: uErr } = await sb
    .from('exchanges')
    .update({
      payment_received_id: pay.id,
      price_difference_settled: true,
      status: 'price_settled',
    })
    .eq('id', exchangeId);
  if (uErr) throw uErr;
}

export async function completeExchange(exchangeId: string): Promise<void> {
  const { data: exch, error } = await sb.from('exchanges').select('*').eq('id', exchangeId).maybeSingle();
  if (error) throw error;
  if (!exch) throw new Error('Exchange not found');
  if (Number(exch.price_difference) > 0 && !exch.price_difference_settled) {
    throw new Error('Price difference must be settled first');
  }
  // Mark replacement serial as sold (delivered as part of exchange)
  if (exch.replacement_serial_id) {
    await sb
      .from('goods_receipt_serials')
      .update({ stock_status: 'sold', updated_at: new Date().toISOString() })
      .eq('id', exch.replacement_serial_id);
  }
  await sb.from('exchanges').update({ status: 'completed' }).eq('id', exchangeId);
  await sb
    .from('return_request_items')
    .update({ resolution_status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', exch.return_request_item_id);
  await logFieldChange('return_request', exch.source_return_request_id, 'exchange', null, `${exch.exchange_number ?? exchangeId} completed`);
}

export async function processCreditNote(itemId: string, notes: string | null): Promise<string> {
  const { data, error } = await sb.rpc('process_credit_note_resolution', {
    p_item_id: itemId,
    p_notes: notes,
  });
  if (error) throw error;
  return data as string;
}

export async function processRefund(
  itemId: string,
  amount: number,
  mode: 'cash' | 'bank_transfer' | 'cheque' | 'upi',
  paymentAccountId: string,
  referenceNumber?: string | null,
): Promise<string> {
  const { data, error } = await sb.rpc('process_refund_resolution', {
    p_item_id: itemId,
    p_amount: amount,
    p_mode: mode,
    p_payment_account_id: paymentAccountId,
    p_reference: referenceNumber || null,
  });
  if (error) throw error;
  return data as string;
}

export interface StockActionResult { action: string; item_id: string }

export async function applyStockAction(itemId: string): Promise<StockActionResult> {
  const { data, error } = await sb.rpc('apply_stock_action', { p_item_id: itemId });
  if (error) throw error;
  return data as StockActionResult;
}

export async function completeReturnRequest(rtId: string): Promise<void> {
  const { error } = await sb.rpc('complete_return_request', { p_rt_id: rtId });
  if (error) throw error;
  await addManualNote('return_request', rtId, 'Return marked as resolved');
}

export interface ExchangeRow {
  id: string;
  exchange_number: string;
  source_return_request_id: string;
  source_invoice_id: string;
  return_request_item_id: string;
  customer_id: string | null;
  original_serial_id: string;
  replacement_serial_id: string | null;
  replacement_product_id: string;
  original_unit_price: number;
  replacement_unit_price: number;
  price_difference: number;
  price_difference_settled: boolean;
  payment_received_id: string | null;
  status: 'pending' | 'item_selected' | 'price_settled' | 'delivered' | 'completed' | 'cancelled';
  notes: string | null;
  processed_by: string;
  created_at: string;
  updated_at: string;
  replacement_product?: { id: string; name: string; sku: string | null } | null;
}

export async function getExchangesForReturn(rtId: string): Promise<ExchangeRow[]> {
  const { data, error } = await sb
    .from('exchanges')
    .select('*, replacement_product:products!exchanges_replacement_product_id_fkey(id,name,sku)')
    .eq('source_return_request_id', rtId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ExchangeRow[];
}

export async function getAvailableSerialsForProduct(productId: string): Promise<Array<{ id: string; serial_number: string }>> {
  const { data, error } = await sb
    .from('goods_receipt_serials')
    .select('id, serial_number')
    .eq('product_id', productId)
    .eq('stock_status', 'available')
    .order('serial_number');
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; serial_number: string }>;
}

export async function searchEligibleReplacementProducts(minPrice: number, query: string): Promise<Array<{ id: string; name: string; sku: string | null; sale_price: number }>> {
  let q = sb
    .from('products')
    .select('id, name, sku, sale_price')
    .gte('sale_price', minPrice)
    .order('name')
    .limit(50);
  if (query && query.trim()) q = q.ilike('name', `%${query.trim()}%`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; name: string; sku: string | null; sale_price: number }>;
}
