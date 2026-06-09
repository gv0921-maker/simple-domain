// HR Leaves & Roster service layer — Supabase-backed (Batch 3)
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type LeaveType = Database['public']['Tables']['leave_types']['Row'];
export type LeaveTypeInsert = Database['public']['Tables']['leave_types']['Insert'];
export type LeaveTypeUpdate = Database['public']['Tables']['leave_types']['Update'];

export type LeaveEntitlement = Database['public']['Tables']['employee_leave_entitlements']['Row'];
export type LeaveEntitlementInsert = Database['public']['Tables']['employee_leave_entitlements']['Insert'];
export type LeaveEntitlementUpdate = Database['public']['Tables']['employee_leave_entitlements']['Update'];

export type LeaveBalance = Database['public']['Tables']['leave_balances']['Row'];
export type LeaveBalanceInsert = Database['public']['Tables']['leave_balances']['Insert'];
export type LeaveBalanceUpdate = Database['public']['Tables']['leave_balances']['Update'];

export type LeaveRequest = Database['public']['Tables']['leave_requests']['Row'];
export type LeaveRequestInsert = Database['public']['Tables']['leave_requests']['Insert'];
export type LeaveRequestUpdate = Database['public']['Tables']['leave_requests']['Update'];

export type LeaveApprovalLog = Database['public']['Tables']['leave_approval_log']['Row'];

export type EmployeeRoster = Database['public']['Tables']['employee_rosters']['Row'];
export type EmployeeRosterInsert = Database['public']['Tables']['employee_rosters']['Insert'];
export type EmployeeRosterUpdate = Database['public']['Tables']['employee_rosters']['Update'];

export type CompOffCredit = Database['public']['Tables']['comp_off_credits']['Row'];
export type CompOffCreditInsert = Database['public']['Tables']['comp_off_credits']['Insert'];

// ---------- Leave Types ----------
export async function listLeaveTypes(): Promise<LeaveType[]> {
  const { data, error } = await supabase.from('leave_types').select('*').order('name');
  if (error) throw error;
  return data ?? [];
}
export async function createLeaveType(p: LeaveTypeInsert) {
  const { data, error } = await supabase.from('leave_types').insert(p).select().single();
  if (error) throw error; return data;
}
export async function updateLeaveType(id: string, patch: LeaveTypeUpdate) {
  const { data, error } = await supabase.from('leave_types').update(patch).eq('id', id).select().single();
  if (error) throw error; return data;
}
export async function deleteLeaveType(id: string) {
  const { error } = await supabase.from('leave_types').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Entitlements ----------
export async function listEntitlements(year?: number): Promise<LeaveEntitlement[]> {
  let q = supabase.from('employee_leave_entitlements').select('*');
  if (year) q = q.eq('year', year);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}
export async function upsertEntitlement(p: LeaveEntitlementInsert): Promise<LeaveEntitlement> {
  const { data, error } = await supabase
    .from('employee_leave_entitlements')
    .upsert(p, { onConflict: 'employee_id,leave_type_id,year' })
    .select().single();
  if (error) throw error; return data;
}
export async function deleteEntitlement(id: string) {
  const { error } = await supabase.from('employee_leave_entitlements').delete().eq('id', id);
  if (error) throw error;
}

/** Resolve an employee's effective allocation: entitlement override OR leave_types default. */
export async function getEmployeeLeaveBalance(employeeId: string, year: number) {
  const [types, ents, bals] = await Promise.all([
    listLeaveTypes(),
    supabase.from('employee_leave_entitlements').select('*').eq('employee_id', employeeId).eq('year', year),
    supabase.from('leave_balances').select('*').eq('employee_id', employeeId).eq('year', year),
  ]);
  if (ents.error) throw ents.error;
  if (bals.error) throw bals.error;
  return types.map((t) => {
    const ent = ents.data?.find((e) => e.leave_type_id === t.id) ?? null;
    const bal = bals.data?.find((b) => b.leave_type_id === t.id) ?? null;
    const allocated = ent?.allocated_days ?? t.default_days_per_year;
    const min_notice = ent?.min_notice_days ?? t.default_min_notice_days;
    const max_consecutive = ent?.max_consecutive_days ?? t.default_max_consecutive_days;
    const carry_max = ent?.carry_forward_max_days ?? t.default_carry_forward_max_days;
    const used = Number(bal?.used ?? 0);
    const pending = Number(bal?.pending_approval ?? 0);
    const carried = Number(bal?.carried_forward ?? 0);
    const available = Number(allocated) + carried - used - pending;
    return {
      leave_type: t,
      entitlement: ent,
      balance: bal,
      allocated: Number(allocated),
      used, pending, carried, available,
      min_notice_days: min_notice,
      max_consecutive_days: max_consecutive,
      carry_forward_max_days: Number(carry_max),
    };
  });
}

// ---------- Balances ----------
export async function listBalances(year: number): Promise<LeaveBalance[]> {
  const { data, error } = await supabase.from('leave_balances').select('*').eq('year', year);
  if (error) throw error;
  return data ?? [];
}
export async function upsertBalance(p: LeaveBalanceInsert) {
  const { data, error } = await supabase
    .from('leave_balances')
    .upsert(p, { onConflict: 'employee_id,leave_type_id,year' })
    .select().single();
  if (error) throw error; return data;
}

/** Year-end carry forward: moves remaining (capped) balance to next year. */
export async function carryForwardLeaves(fromYear: number) {
  const toYear = fromYear + 1;
  const [types, bals] = await Promise.all([listLeaveTypes(), listBalances(fromYear)]);
  for (const b of bals) {
    const t = types.find((x) => x.id === b.leave_type_id);
    if (!t) continue;
    const remaining = Number(b.opening_balance) + Number(b.accrued) + Number(b.carried_forward) - Number(b.used);
    const cap = Number(t.default_carry_forward_max_days);
    const cf = Math.max(0, Math.min(remaining, cap));
    await upsertBalance({
      employee_id: b.employee_id,
      leave_type_id: b.leave_type_id,
      year: toYear,
      opening_balance: 0,
      accrued: 0,
      used: 0,
      pending_approval: 0,
      carried_forward: cf,
    });
  }
}

// ---------- Date helpers ----------
function eachDate(start: string, end: string): string[] {
  const out: string[] = [];
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

/** Working days = total days minus holidays AND rostered weekly_off entries for the employee. */
export async function calculateLeaveDays(
  employeeId: string,
  startDate: string,
  endDate: string,
  isHalfDay = false,
): Promise<{ totalDays: number; excludedDates: string[]; allDates: string[] }> {
  if (!startDate || !endDate || endDate < startDate) {
    return { totalDays: 0, excludedDates: [], allDates: [] };
  }
  const allDates = eachDate(startDate, endDate);
  const [hol, rost] = await Promise.all([
    supabase.from('holidays').select('holiday_date').gte('holiday_date', startDate).lte('holiday_date', endDate),
    supabase.from('employee_rosters').select('roster_date,roster_type')
      .eq('employee_id', employeeId).gte('roster_date', startDate).lte('roster_date', endDate),
  ]);
  const holDates = new Set((hol.data ?? []).map((r: any) => r.holiday_date as string));
  const offDates = new Set(
    (rost.data ?? []).filter((r: any) => r.roster_type === 'weekly_off' || r.roster_type === 'holiday')
      .map((r: any) => r.roster_date as string),
  );
  const excluded = allDates.filter((d) => holDates.has(d) || offDates.has(d));
  let working = allDates.length - excluded.length;
  if (isHalfDay && working > 0) working = 0.5;
  return { totalDays: working, excludedDates: excluded, allDates };
}

// ---------- Leave Requests ----------
export async function listLeaveRequests(filters?: {
  employeeId?: string; status?: string; from?: string; to?: string;
}): Promise<LeaveRequest[]> {
  let q = supabase.from('leave_requests').select('*').order('created_at', { ascending: false });
  if (filters?.employeeId) q = q.eq('employee_id', filters.employeeId);
  if (filters?.status) q = q.eq('status', filters.status);
  if (filters?.from) q = q.gte('start_date', filters.from);
  if (filters?.to) q = q.lte('end_date', filters.to);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}
export async function getLeaveRequest(id: string) {
  const { data, error } = await supabase.from('leave_requests').select('*').eq('id', id).maybeSingle();
  if (error) throw error; return data;
}
export async function listApprovalLog(leaveRequestId: string) {
  const { data, error } = await supabase
    .from('leave_approval_log').select('*').eq('leave_request_id', leaveRequestId).order('action_date');
  if (error) throw error; return data ?? [];
}

async function logAction(leaveRequestId: string, action: LeaveApprovalLog['action'],
  previous_status: string | null, new_status: string | null, comments?: string) {
  const { data: u } = await supabase.auth.getUser();
  await supabase.from('leave_approval_log').insert({
    leave_request_id: leaveRequestId,
    action,
    actor_id: u.user?.id ?? null,
    previous_status, new_status, comments: comments ?? null,
  });
}

export async function submitLeaveRequest(args: {
  employee_id: string; leave_type_id: string; start_date: string; end_date: string;
  is_half_day?: boolean; half_day_session?: 'first_half' | 'second_half' | null;
  reason?: string; attachment_url?: string; contact_during_leave?: string;
}): Promise<LeaveRequest> {
  // Block overlap with approved/pending
  const { data: overlap } = await supabase.from('leave_requests')
    .select('id,start_date,end_date,status')
    .eq('employee_id', args.employee_id)
    .in('status', ['pending', 'approved'])
    .lte('start_date', args.end_date)
    .gte('end_date', args.start_date);
  if (overlap && overlap.length > 0) {
    throw new Error('Dates overlap with an existing pending/approved leave request.');
  }

  const { totalDays, allDates } = await calculateLeaveDays(
    args.employee_id, args.start_date, args.end_date, !!args.is_half_day,
  );

  // Block if every date is a weekly_off
  if (allDates.length > 0 && totalDays === 0 && !args.is_half_day) {
    throw new Error('Selected dates are entirely non-working (weekly off / holidays). No leave needed.');
  }

  const { data, error } = await supabase.from('leave_requests').insert({
    employee_id: args.employee_id,
    leave_type_id: args.leave_type_id,
    start_date: args.start_date,
    end_date: args.end_date,
    total_days: totalDays,
    is_half_day: !!args.is_half_day,
    half_day_session: args.half_day_session ?? null,
    reason: args.reason ?? null,
    attachment_url: args.attachment_url ?? null,
    contact_during_leave: args.contact_during_leave ?? null,
    status: 'pending',
    applied_date: new Date().toISOString(),
  }).select().single();
  if (error) throw error;
  await logAction(data.id, 'submitted', 'draft', 'pending');
  return data;
}

export async function approveLeaveRequest(id: string, approver_id?: string | null, comments?: string) {
  const cur = await getLeaveRequest(id);
  if (!cur) throw new Error('Leave request not found');
  const { data, error } = await supabase.from('leave_requests').update({
    status: 'approved',
    approver_id: approver_id ?? null,
    approved_date: new Date().toISOString(),
  }).eq('id', id).select().single();
  if (error) throw error;
  await logAction(id, 'approved', cur.status, 'approved', comments);

  // Note: attendance_sessions has no status column in this schema. Leave dates
  // surface as "on leave" via leave_requests joins in attendance views rather
  // than synthetic session rows.
  return data;
}

export async function rejectLeaveRequest(id: string, rejection_reason: string) {
  const cur = await getLeaveRequest(id);
  if (!cur) throw new Error('Leave request not found');
  const { data, error } = await supabase.from('leave_requests')
    .update({ status: 'rejected', rejection_reason })
    .eq('id', id).select().single();
  if (error) throw error;
  await logAction(id, 'rejected', cur.status, 'rejected', rejection_reason);
  return data;
}

export async function cancelLeaveRequest(id: string, comments?: string) {
  const cur = await getLeaveRequest(id);
  if (!cur) throw new Error('Leave request not found');
  const { data, error } = await supabase.from('leave_requests')
    .update({ status: 'cancelled' }).eq('id', id).select().single();
  if (error) throw error;
  await logAction(id, 'cancelled', cur.status, 'cancelled', comments);
  return data;
}

// ---------- Rosters ----------
export async function listRosters(args: { from: string; to: string; employeeIds?: string[] }) {
  let q = supabase.from('employee_rosters').select('*')
    .gte('roster_date', args.from).lte('roster_date', args.to);
  if (args.employeeIds && args.employeeIds.length > 0) q = q.in('employee_id', args.employeeIds);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}
export async function upsertRoster(p: EmployeeRosterInsert) {
  const { data, error } = await supabase.from('employee_rosters')
    .upsert(p, { onConflict: 'employee_id,roster_date' })
    .select().single();
  if (error) throw error; return data;
}
export async function deleteRoster(employeeId: string, date: string) {
  const { error } = await supabase.from('employee_rosters')
    .delete().eq('employee_id', employeeId).eq('roster_date', date);
  if (error) throw error;
}

export async function scheduleWeeklyOff(employeeId: string, dates: string[], notes?: string) {
  if (dates.length === 0) return;
  const { data: u } = await supabase.auth.getUser();
  const rows = dates.map((d) => ({
    employee_id: employeeId,
    roster_date: d,
    roster_type: 'weekly_off' as const,
    planned_by: u.user?.id ?? null,
    notes: notes ?? null,
  }));
  const { error } = await supabase.from('employee_rosters')
    .upsert(rows, { onConflict: 'employee_id,roster_date' });
  if (error) throw error;
}

export async function rescheduleWeeklyOff(
  employeeId: string, originalDate: string, newDate: string,
) {
  const { data: u } = await supabase.auth.getUser();
  // Convert original to working
  await supabase.from('employee_rosters').upsert(
    { employee_id: employeeId, roster_date: originalDate, roster_type: 'working', planned_by: u.user?.id ?? null },
    { onConflict: 'employee_id,roster_date' },
  );
  // Place new weekly_off
  const { error } = await supabase.from('employee_rosters').upsert(
    { employee_id: employeeId, roster_date: newDate, roster_type: 'weekly_off',
      original_off_date: originalDate, planned_by: u.user?.id ?? null },
    { onConflict: 'employee_id,roster_date' },
  );
  if (error) throw error;
}

/** Find employees who worked on a planned weekly_off date — join sessions + rosters. */
export async function listWorkedOnWeeklyOff(from: string, to: string) {
  const { data: offs, error: e1 } = await supabase.from('employee_rosters')
    .select('employee_id,roster_date')
    .eq('roster_type', 'weekly_off')
    .gte('roster_date', from).lte('roster_date', to);
  if (e1) throw e1;
  if (!offs || offs.length === 0) return [];
  const empIds = Array.from(new Set(offs.map((o) => o.employee_id)));
  const { data: sessions, error: e2 } = await supabase.from('attendance_sessions')
    .select('employee_id,session_date,session_type,duration_minutes')
    .in('employee_id', empIds)
    .gte('session_date', from).lte('session_date', to);
  if (e2) throw e2;
  const key = (e: string, d: string) => `${e}__${d}`;
  const workedSet = new Set(
    (sessions ?? []).filter((s) => s.session_type === 'work').map((s) => key(s.employee_id, s.session_date)),
  );
  return offs.filter((o) => workedSet.has(key(o.employee_id, o.roster_date)));
}

// ---------- Comp-Off Credits ----------
export async function listCompOffCredits(employeeId?: string): Promise<CompOffCredit[]> {
  let q = supabase.from('comp_off_credits').select('*').order('work_date', { ascending: false });
  if (employeeId) q = q.eq('employee_id', employeeId);
  const { data, error } = await q;
  if (error) throw error; return data ?? [];
}
export async function grantCompOff(args: {
  employee_id: string; work_date: string; comp_off_days?: number; notes?: string;
}) {
  const { data: u } = await supabase.auth.getUser();
  const { data, error } = await supabase.from('comp_off_credits').insert({
    employee_id: args.employee_id,
    work_date: args.work_date,
    comp_off_days: args.comp_off_days ?? 1,
    granted_by: u.user?.id ?? null,
    notes: args.notes ?? null,
  }).select().single();
  if (error) throw error; return data;
}