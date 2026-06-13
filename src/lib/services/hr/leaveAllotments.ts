// Phase 7 Batch 2 — Monthly leave allotments service layer
import { supabase } from '@/integrations/supabase/client';

export interface MonthlyLeaveBalance {
  paid_allotted: number;
  paid_used: number;
  paid_remaining: number;
  unpaid_used: number;
}

export interface MonthlyAllotmentRow {
  id: string;
  employee_id: string;
  year: number;
  month: number;
  paid_leaves_allotted: number;
  paid_leaves_used: number;
  unpaid_leaves_used: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export async function getEmployeeMonthlyBalance(
  employeeId: string, year: number, month: number,
): Promise<MonthlyLeaveBalance> {
  const { data, error } = await supabase.rpc('get_employee_leave_balance' as any, {
    p_employee_id: employeeId, p_year: year, p_month: month,
  });
  if (error) throw error;
  return (data ?? { paid_allotted: 0, paid_used: 0, paid_remaining: 0, unpaid_used: 0 }) as MonthlyLeaveBalance;
}

export async function getMyCurrentMonthBalance(): Promise<MonthlyLeaveBalance | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user?.id) return null;
  const { data: emp } = await supabase
    .from('employees').select('id').eq('user_id', u.user.id).maybeSingle();
  if (!emp?.id) return null;
  const now = new Date();
  return getEmployeeMonthlyBalance(emp.id, now.getFullYear(), now.getMonth() + 1);
}

export async function getAllEmployeesAllotments(
  year: number, month: number,
): Promise<MonthlyAllotmentRow[]> {
  const { data, error } = await supabase
    .from('employee_monthly_leave_allotments' as any)
    .select('*').eq('year', year).eq('month', month);
  if (error) throw error;
  return (data ?? []) as unknown as MonthlyAllotmentRow[];
}

export async function setMonthlyAllotment(
  employeeId: string, year: number, month: number, paidLeavesAllotted: number,
) {
  const { data: u } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('employee_monthly_leave_allotments' as any)
    .upsert(
      {
        employee_id: employeeId, year, month,
        paid_leaves_allotted: paidLeavesAllotted,
        created_by: u.user?.id ?? null,
      },
      { onConflict: 'employee_id,year,month' },
    )
    .select().single();
  if (error) throw error;
  return data;
}

export async function bulkSetAllotments(
  year: number, month: number,
  employeeAllotments: Array<{ employee_id: string; paid_leaves_allotted: number }>,
): Promise<number> {
  const { data, error } = await supabase.rpc('bulk_set_monthly_allotments' as any, {
    p_year: year, p_month: month,
    p_employee_allotments: employeeAllotments as any,
  });
  if (error) throw error;
  return (data as number) ?? 0;
}

export async function copyAllotmentsFromPreviousMonth(year: number, month: number) {
  const prevDate = new Date(year, month - 2, 1);
  const prevYear = prevDate.getFullYear();
  const prevMonth = prevDate.getMonth() + 1;
  const prev = await getAllEmployeesAllotments(prevYear, prevMonth);
  if (prev.length === 0) return 0;
  return bulkSetAllotments(year, month,
    prev.map((r) => ({ employee_id: r.employee_id, paid_leaves_allotted: r.paid_leaves_allotted })),
  );
}