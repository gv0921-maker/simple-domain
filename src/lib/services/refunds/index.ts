import { supabase } from '@/integrations/supabase/client';

const sb = supabase as any;

export type RefundMode = 'cash' | 'bank_transfer' | 'cheque' | 'upi';

export interface Refund {
  id: string;
  refund_number: string;
  source_return_request_id: string;
  source_invoice_id: string;
  customer_id: string | null;
  customer_name_snapshot: string | null;
  amount: number;
  refund_mode: RefundMode;
  payment_account_id: string;
  reference_number: string | null;
  refund_date: string;
  notes: string | null;
  processed_by: string;
  created_at: string;
  customer?: { id: string; name: string } | null;
  payment_account?: { id: string; account_name: string; account_type: string } | null;
  source_return?: { id: string; rt_number: string } | null;
  source_invoice?: { id: string; reference: string } | null;
}

export interface RefundFilters {
  customer_id?: string;
  mode?: RefundMode | 'all';
  date_from?: string;
  date_to?: string;
}

export const REFUND_MODE_LABEL: Record<RefundMode, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
  upi: 'UPI',
};

export async function getRefunds(filters: RefundFilters = {}): Promise<Refund[]> {
  let q = sb
    .from('refunds')
    .select('*, customer:customers(id,name), payment_account:payment_accounts(id,account_name,account_type), source_return:return_requests(id,rt_number), source_invoice:invoices(id,reference)')
    .order('refund_date', { ascending: false });
  if (filters.customer_id) q = q.eq('customer_id', filters.customer_id);
  if (filters.mode && filters.mode !== 'all') q = q.eq('refund_mode', filters.mode);
  if (filters.date_from) q = q.gte('refund_date', filters.date_from);
  if (filters.date_to) q = q.lte('refund_date', filters.date_to);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Refund[];
}

export async function getRefundById(id: string): Promise<Refund | null> {
  const { data, error } = await sb
    .from('refunds')
    .select('*, customer:customers(id,name), payment_account:payment_accounts(id,account_name,account_type), source_return:return_requests(id,rt_number), source_invoice:invoices(id,reference)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as Refund | null;
}
