// Holidays service — Supabase-backed (Phase 7 Batch 3)
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type Holiday = Database['public']['Tables']['holidays']['Row'];
export type HolidayInsert = Database['public']['Tables']['holidays']['Insert'];
export type HolidayUpdate = Database['public']['Tables']['holidays']['Update'];

export async function listHolidays(year?: number): Promise<Holiday[]> {
  let q = supabase.from('holidays').select('*').order('holiday_date', { ascending: true });
  if (year) {
    q = q.gte('holiday_date', `${year}-01-01`).lte('holiday_date', `${year}-12-31`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getUpcomingHolidays(daysAhead = 30): Promise<Holiday[]> {
  const today = new Date();
  const end = new Date();
  end.setDate(end.getDate() + daysAhead);
  const { data, error } = await supabase
    .from('holidays')
    .select('*')
    .eq('is_active', true)
    .gte('holiday_date', today.toISOString().slice(0, 10))
    .lte('holiday_date', end.toISOString().slice(0, 10))
    .order('holiday_date', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createHoliday(p: HolidayInsert): Promise<Holiday> {
  const { data, error } = await supabase.from('holidays').insert(p).select().single();
  if (error) throw error;
  return data;
}

export async function updateHoliday(id: string, patch: HolidayUpdate): Promise<Holiday> {
  const { data, error } = await supabase.from('holidays').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deactivateHoliday(id: string): Promise<void> {
  const { error } = await supabase.from('holidays').update({ is_active: false } as any).eq('id', id);
  if (error) throw error;
}

export async function deleteHoliday(id: string): Promise<void> {
  const { error } = await supabase.from('holidays').delete().eq('id', id);
  if (error) throw error;
}