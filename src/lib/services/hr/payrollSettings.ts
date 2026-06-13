// Phase 7 Batch 4 — Payroll Settings service (super_admin only).
import { supabase } from '@/integrations/supabase/client';

async function requireSuperAdmin() {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) throw new Error('Not authenticated');
  const { data } = await supabase.from('user_roles' as any).select('role').eq('user_id', uid);
  const roles = ((data ?? []) as any[]).map((r) => r.role);
  if (!roles.includes('super_admin')) {
    throw new Error('Access denied — Super Admin only.');
  }
  return uid;
}

export async function getPayrollSettings(): Promise<any> {
  await requireSuperAdmin();
  const { data, error } = await (supabase as any)
    .from('payroll_settings')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export interface PayrollSettingsInput {
  pf_rate?: number;
  esi_rate_employee?: number;
  esi_gross_threshold?: number;
  pt_amount?: number;
  pt_salary_threshold?: number;
  payslip_self_view_enabled?: boolean;
  notes?: string | null;
}

export async function updatePayrollSettingsX(id: string, patch: PayrollSettingsInput) {
  const uid = await requireSuperAdmin();
  const { data, error } = await (supabase as any)
    .from('payroll_settings')
    .update({ ...patch, updated_by: uid, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function togglePayslipSelfView(id: string, enabled: boolean) {
  return updatePayrollSettingsX(id, { payslip_self_view_enabled: enabled });
}