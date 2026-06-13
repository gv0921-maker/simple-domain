import { supabase } from '@/integrations/supabase/client';
import { logFieldChange } from '@/lib/services/activityLog';

const sb = supabase as any;

export type PaymentMode = 'cash' | 'bank_transfer' | 'cheque' | 'card' | 'upi';

export interface PaymentAccount {
  id: string;
  account_name: string;
  account_type: 'cash' | 'bank';
  bank_name: string | null;
  account_number_last4: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface SalesOrderPayment {
  id: string;
  sales_order_id: string;
  payment_number: string;
  amount: number;
  payment_mode: PaymentMode;
  payment_account_id: string;
  payment_date: string;
  reference_number: string | null;
  notes: string | null;
  received_by: string;
  is_voided: boolean;
  voided_by: string | null;
  voided_at: string | null;
  void_reason: string | null;
  created_at: string;
  // joined
  payment_account?: PaymentAccount | null;
}

export interface PaymentSummary {
  total_amount: number;
  total_paid: number;
  total_voided: number;
  balance_remaining: number;
  advance_percent: number;
  advance_percent_required: number;
  payment_count: number;
  is_advance_met: boolean;
  is_fully_paid: boolean;
  last_payment_date: string | null;
}

// ---------- Payment accounts ----------

export async function getPaymentAccounts(activeOnly = true): Promise<PaymentAccount[]> {
  let q = sb.from('payment_accounts').select('*').order('display_order', { ascending: true }).order('account_name');
  if (activeOnly) q = q.eq('is_active', true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as PaymentAccount[];
}

export async function savePaymentAccount(
  patch: Partial<PaymentAccount> & { account_name: string; account_type: 'cash' | 'bank' },
): Promise<PaymentAccount> {
  if (patch.id) {
    const { id, created_at, updated_at, ...rest } = patch as any;
    const { data, error } = await sb.from('payment_accounts').update(rest).eq('id', id).select('*').single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await sb.from('payment_accounts').insert(patch).select('*').single();
  if (error) throw error;
  return data;
}

export async function deletePaymentAccount(id: string): Promise<void> {
  const { error } = await sb.from('payment_accounts').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Sales order payments ----------

export async function getSalesOrderPayments(salesOrderId: string): Promise<SalesOrderPayment[]> {
  const { data, error } = await sb
    .from('sales_order_payments')
    .select('*, payment_account:payment_accounts(*)')
    .eq('sales_order_id', salesOrderId)
    .order('payment_date', { ascending: false });
  if (error) throw error;
  return (data ?? []) as SalesOrderPayment[];
}

export async function getPaymentSummary(salesOrderId: string): Promise<PaymentSummary> {
  const { data, error } = await supabase.rpc('get_sales_order_payment_summary' as any, { p_so_id: salesOrderId });
  if (error) throw error;
  return (data as unknown) as PaymentSummary;
}

export interface RecordPaymentInput {
  salesOrderId: string;
  amount: number;
  paymentMode: PaymentMode;
  paymentAccountId: string;
  referenceNumber?: string | null;
  notes?: string | null;
}

export async function recordPayment(input: RecordPaymentInput): Promise<SalesOrderPayment> {
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (!uid) throw new Error('Not authenticated');
  if (!input.amount || input.amount <= 0) throw new Error('Amount must be greater than zero');

  const { data, error } = await sb
    .from('sales_order_payments')
    .insert({
      sales_order_id: input.salesOrderId,
      amount: input.amount,
      payment_mode: input.paymentMode,
      payment_account_id: input.paymentAccountId,
      reference_number: input.referenceNumber || null,
      notes: input.notes || null,
      received_by: uid,
      payment_number: '', // trigger will fill via generate_document_number
    })
    .select('*, payment_account:payment_accounts(*)')
    .single();
  if (error) throw error;
  const payment = data as SalesOrderPayment;

  // Recompute SO advance percent and auto-advance status
  try {
    await supabase.rpc('calculate_so_advance_percent' as any, { p_so_id: input.salesOrderId });
  } catch { /* ignore */ }

  try {
    const summary = await getPaymentSummary(input.salesOrderId);
    const { data: soRow } = await sb
      .from('sales_orders')
      .select('status')
      .eq('id', input.salesOrderId)
      .maybeSingle();
    const status = soRow?.status as string | undefined;

    // Persist advance_percent_received for visibility
    await sb.from('sales_orders').update({
      advance_percent_received: summary.advance_percent,
    }).eq('id', input.salesOrderId);

    if (status === 'awaiting_advance' && summary.is_advance_met) {
      await sb.from('sales_orders').update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      }).eq('id', input.salesOrderId);
    }
    if (summary.is_fully_paid && (status === 'confirmed' || status === 'fulfilling')) {
      // Don't auto-advance to ready_to_invoice here — only when fully scanned.
    }

    // Activity log: payment recorded
    await logFieldChange(
      'sales_order',
      input.salesOrderId,
      'payment',
      null,
      `${payment.payment_number} — ₹${input.amount} via ${input.paymentMode}`,
    );
  } catch { /* non-fatal */ }

  return payment;
}

export async function voidPayment(paymentId: string, reason: string): Promise<SalesOrderPayment> {
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (!uid) throw new Error('Not authenticated');
  if (!reason || reason.trim().length < 3) throw new Error('A reason is required to void a payment.');
  const { data, error } = await sb
    .from('sales_order_payments')
    .update({
      is_voided: true,
      voided_by: uid,
      voided_at: new Date().toISOString(),
      void_reason: reason.trim(),
    })
    .eq('id', paymentId)
    .select('*, payment_account:payment_accounts(*)')
    .single();
  if (error) throw error;
  const p = data as SalesOrderPayment;

  try {
    await supabase.rpc('calculate_so_advance_percent' as any, { p_so_id: p.sales_order_id });
    const summary = await getPaymentSummary(p.sales_order_id);
    await sb.from('sales_orders').update({ advance_percent_received: summary.advance_percent }).eq('id', p.sales_order_id);
    await logFieldChange(
      'sales_order',
      p.sales_order_id,
      'payment_voided',
      p.payment_number,
      reason,
    );
  } catch { /* non-fatal */ }

  return p;
}