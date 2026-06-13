// Phase 7 Batch 2 — Sunday-duty roster helpers
import { supabase } from '@/integrations/supabase/client';

export interface SundayRosterRow {
  id: string;
  employee_id: string;
  roster_date: string;
  roster_type: string;
  is_working_day: boolean;
  is_sunday_duty: boolean;
  compensatory_off_for_date: string | null;
  notes: string | null;
}

export async function assignSundayDuty(
  employeeId: string, sundayDate: string, compOffDate: string,
) {
  const { data, error } = await supabase.rpc('assign_sunday_duty' as any, {
    p_employee_id: employeeId,
    p_sunday_date: sundayDate,
    p_comp_off_date: compOffDate,
  });
  if (error) throw error;
  return data;
}

export async function bulkAssignSundayDuty(
  assignments: Array<{ employee_id: string; sunday_date: string; comp_off_date: string }>,
) {
  const results = [];
  for (const a of assignments) {
    results.push(await assignSundayDuty(a.employee_id, a.sunday_date, a.comp_off_date));
  }
  return results;
}

export async function getRosters(
  from: string, to: string, employeeIds?: string[],
): Promise<SundayRosterRow[]> {
  let q = supabase.from('employee_rosters' as any)
    .select('*').gte('roster_date', from).lte('roster_date', to);
  if (employeeIds && employeeIds.length > 0) q = q.in('employee_id', employeeIds);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as SundayRosterRow[];
}

export async function getMyRoster(from: string, to: string): Promise<SundayRosterRow[]> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user?.id) return [];
  const { data: emp } = await supabase
    .from('employees').select('id').eq('user_id', u.user.id).maybeSingle();
  if (!emp?.id) return [];
  return getRosters(from, to, [emp.id]);
}

export async function clearRosterAssignment(rosterId: string) {
  const { error } = await supabase.from('employee_rosters' as any).delete().eq('id', rosterId);
  if (error) throw error;
}