import { supabase } from '@/integrations/supabase/client';
import { logFieldChange, addManualNote } from '@/lib/services/activityLog';

const sb = supabase as any;

export type CreditNoteStatus = 'active' | 'partially_used' | 'fully_used' | 'expired' | 'voided';

export interface CreditNote {
  id: string;
  cn_number: string;
  customer_id: string | null;
  customer_name_snapshot: string | null;
  source_return_request_id: string;
  source_invoice_id: string;
  amount: number;
  issue_date: string;
  expiry_date: string;
  status: CreditNoteStatus;
  amount_used: number;
  amount_remaining: number;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  voided_by: string | null;
  voided_at: string | null;
  void_reason: string | null;
  customer?: { id: string; name: string } | null;
  source_return?: { id: string; rt_number: string } | null;
  source_invoice?: { id: string; reference: string } | null;
}

export interface CreditNoteRedemption {
  id: string;
  credit_note_id: string;
  applied_to_invoice_id: string | null;
  applied_to_sales_order_id: string | null;
  amount_applied: number;
  applied_at: string;
  applied_by: string;
  invoice?: { id: string; reference: string } | null;
  sales_order?: { id: string; reference: string | null } | null;
}

export interface CreditNoteFilters {
  status?: CreditNoteStatus | 'all';
  customer_id?: string;
  date_from?: string;
  date_to?: string;
  expiring_within_days?: number;
}

export const CN_STATUS_LABEL: Record<CreditNoteStatus, string> = {
  active: 'Active',
  partially_used: 'Partially Used',
  fully_used: 'Fully Used',
  expired: 'Expired',
  voided: 'Voided',
};

export async function expireOldCreditNotes(): Promise<number> {
  const { data, error } = await sb.rpc('expire_credit_notes');
  if (error) return 0;
  return Number(data ?? 0);
}

export async function getCreditNotes(filters: CreditNoteFilters = {}): Promise<CreditNote[]> {
  // Expire any that have passed expiry first
  await expireOldCreditNotes();

  let q = sb
    .from('credit_notes')
    .select('*, customer:customers(id,name), source_return:return_requests(id,rt_number), source_invoice:invoices(id,reference)')
    .order('issue_date', { ascending: false });
  if (filters.status && filters.status !== 'all') q = q.eq('status', filters.status);
  if (filters.customer_id) q = q.eq('customer_id', filters.customer_id);
  if (filters.date_from) q = q.gte('issue_date', filters.date_from);
  if (filters.date_to) q = q.lte('issue_date', filters.date_to);
  if (filters.expiring_within_days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + filters.expiring_within_days);
    q = q
      .lte('expiry_date', cutoff.toISOString().split('T')[0])
      .in('status', ['active', 'partially_used']);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as CreditNote[];
}

export async function getCreditNoteById(id: string): Promise<{ cn: CreditNote | null; redemptions: CreditNoteRedemption[] }> {
  await expireOldCreditNotes();
  const { data: cn, error } = await sb
    .from('credit_notes')
    .select('*, customer:customers(id,name), source_return:return_requests(id,rt_number), source_invoice:invoices(id,reference)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  const { data: red, error: rErr } = await sb
    .from('credit_note_redemptions')
    .select('*, invoice:invoices(id,reference), sales_order:sales_orders(id,reference)')
    .eq('credit_note_id', id)
    .order('applied_at', { ascending: false });
  if (rErr) throw rErr;
  return { cn: (cn ?? null) as CreditNote | null, redemptions: (red ?? []) as CreditNoteRedemption[] };
}

export async function getCustomerActiveCreditNotes(customerId: string): Promise<CreditNote[]> {
  await expireOldCreditNotes();
  const { data, error } = await sb
    .from('credit_notes')
    .select('*')
    .eq('customer_id', customerId)
    .in('status', ['active', 'partially_used'])
    .order('expiry_date', { ascending: true });
  if (error) throw error;
  return (data ?? []) as CreditNote[];
}

export async function redeemCreditNote(args: {
  cnId: string;
  invoiceId?: string | null;
  salesOrderId?: string | null;
  amount: number;
}): Promise<string> {
  const { data, error } = await sb.rpc('redeem_credit_note', {
    p_cn_id: args.cnId,
    p_invoice_id: args.invoiceId ?? null,
    p_sales_order_id: args.salesOrderId ?? null,
    p_amount_to_apply: args.amount,
  });
  if (error) throw error;
  if (args.salesOrderId) {
    await logFieldChange('sales_order', args.salesOrderId, 'credit_note_applied', null, `₹${args.amount}`);
  }
  return data as string;
}

export async function voidCreditNote(cnId: string, reason: string): Promise<void> {
  const { error } = await sb.rpc('void_credit_note', { p_cn_id: cnId, p_reason: reason });
  if (error) throw error;
  await addManualNote('credit_note', cnId, `Credit note voided: ${reason}`);
}

export async function getExpiringCreditNotes(daysAhead = 30): Promise<CreditNote[]> {
  return getCreditNotes({ expiring_within_days: daysAhead });
}
