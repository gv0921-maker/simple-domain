// Unified calendar service — Phase 7 Batch 3
import { supabase } from '@/integrations/supabase/client';

export type CalendarEntryType =
  | 'working' | 'sunday_duty' | 'comp_off'
  | 'leave_paid' | 'leave_unpaid' | 'holiday' | 'off_day';

export interface CalendarEntry {
  employee_id: string;
  employee_name: string;
  photo_url: string | null;
  type: CalendarEntryType;
  label: string;
  color: string;
}

export interface CalendarDay {
  date: string;
  entries: CalendarEntry[] | null;
}

export async function getCalendarData(
  startDate: string, endDate: string, employeeId?: string,
): Promise<CalendarDay[]> {
  const { data, error } = await supabase.rpc('get_unified_calendar' as any, {
    p_start_date: startDate,
    p_end_date: endDate,
    p_employee_id: employeeId ?? null,
  });
  if (error) throw error;
  return (data as CalendarDay[] | null) ?? [];
}

export interface EmployeeCalendarSummary {
  working: number;
  sunday_duty: number;
  comp_off: number;
  leave_paid: number;
  leave_unpaid: number;
  holiday: number;
  off_day: number;
}

export async function getEmployeeCalendarSummary(
  employeeId: string, month: number, year: number,
): Promise<EmployeeCalendarSummary> {
  const start = new Date(year, month - 1, 1).toISOString().slice(0, 10);
  const end = new Date(year, month, 0).toISOString().slice(0, 10);
  const data = await getCalendarData(start, end, employeeId);
  const summary: EmployeeCalendarSummary = {
    working: 0, sunday_duty: 0, comp_off: 0,
    leave_paid: 0, leave_unpaid: 0, holiday: 0, off_day: 0,
  };
  for (const day of data) {
    for (const e of day.entries ?? []) {
      if (e.employee_id === employeeId) summary[e.type] = (summary[e.type] ?? 0) + 1;
    }
  }
  return summary;
}