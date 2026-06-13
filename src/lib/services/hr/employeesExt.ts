// Employee directory extensions — Phase 7 Batch 3
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type EmployeeRow = Database['public']['Tables']['employees']['Row'];

export interface DirectoryEmployee {
  id: string;
  full_name: string;
  designation: string | null;
  profile_photo_url: string | null;
  date_of_joining: string | null;
  date_of_birth: string | null;
  department_id: string | null;
  employee_code?: string | null;
  status?: string;
}

/** Minimal fields safe for everyone. */
export async function getEmployeeDirectoryRestricted(): Promise<DirectoryEmployee[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('id,full_name,designation,profile_photo_url,date_of_joining,date_of_birth,department_id')
    .eq('status', 'active')
    .order('full_name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as DirectoryEmployee[];
}

/** Full directory — admin/HR. */
export async function getEmployeeDirectoryFull(): Promise<EmployeeRow[]> {
  const { data, error } = await supabase
    .from('employees').select('*').order('full_name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export interface OrgChartNode {
  id: string;
  name: string;
  designation: string | null;
  photo_url: string | null;
  manager_id: string | null;
  children: OrgChartNode[];
}

export async function getOrgChartData(): Promise<OrgChartNode[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('id,full_name,designation,profile_photo_url,manager_id,status')
    .eq('status', 'active');
  if (error) throw error;
  const rows = data ?? [];
  const byId = new Map<string, OrgChartNode>();
  rows.forEach((r: any) => {
    byId.set(r.id, {
      id: r.id, name: r.full_name, designation: r.designation,
      photo_url: r.profile_photo_url, manager_id: r.manager_id, children: [],
    });
  });
  const roots: OrgChartNode[] = [];
  byId.forEach((n) => {
    if (n.manager_id && byId.has(n.manager_id)) byId.get(n.manager_id)!.children.push(n);
    else roots.push(n);
  });
  return roots;
}

export async function setEmployeeManager(employeeId: string, managerId: string | null) {
  const { error } = await supabase
    .from('employees').update({ manager_id: managerId } as any).eq('id', employeeId);
  if (error) throw error;
}

/** Returns 'present' | 'on_leave' | 'off' for today, per employee id. */
export async function getTodayStatusMap(employeeIds: string[]): Promise<Map<string, 'present' | 'on_leave' | 'off'>> {
  const out = new Map<string, 'present' | 'on_leave' | 'off'>();
  if (employeeIds.length === 0) return out;
  const today = new Date().toISOString().slice(0, 10);

  const [att, lv] = await Promise.all([
    supabase.from('attendance_sessions').select('employee_id')
      .in('employee_id', employeeIds).eq('session_date', today),
    supabase.from('leave_requests').select('employee_id')
      .in('employee_id', employeeIds).eq('status', 'approved')
      .lte('start_date', today).gte('end_date', today),
  ]);

  const present = new Set((att.data ?? []).map((r: any) => r.employee_id));
  const onLeave = new Set((lv.data ?? []).map((r: any) => r.employee_id));
  employeeIds.forEach((id) => {
    if (onLeave.has(id)) out.set(id, 'on_leave');
    else if (present.has(id)) out.set(id, 'present');
    else out.set(id, 'off');
  });
  return out;
}