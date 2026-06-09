// HR Attendance service layer — Supabase-backed (Batch 2)
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type AttendanceSession = Database['public']['Tables']['attendance_sessions']['Row'];
export type AttendanceSessionInsert = Database['public']['Tables']['attendance_sessions']['Insert'];
export type AttendanceSessionUpdate = Database['public']['Tables']['attendance_sessions']['Update'];
export type AttendanceLocation = Database['public']['Tables']['attendance_locations']['Row'];
export type AttendanceLocationInsert = Database['public']['Tables']['attendance_locations']['Insert'];
export type AttendanceLocationUpdate = Database['public']['Tables']['attendance_locations']['Update'];
export type Holiday = Database['public']['Tables']['holidays']['Row'];
export type HolidayInsert = Database['public']['Tables']['holidays']['Insert'];
export type HolidayUpdate = Database['public']['Tables']['holidays']['Update'];
export type WorkSchedule = Database['public']['Tables']['work_schedules']['Row'];
export type WorkScheduleInsert = Database['public']['Tables']['work_schedules']['Insert'];
export type WorkScheduleUpdate = Database['public']['Tables']['work_schedules']['Update'];

export interface GeoPoint {
  latitude: number;
  longitude: number;
  accuracy_meters?: number | null;
  address?: string | null;
}

// ---------- GPS helpers ----------
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation not supported by this browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  });
}

export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=18`,
      { headers: { Accept: 'application/json' } }
    );
    if (!r.ok) return null;
    const j = await r.json();
    return (j?.display_name as string) ?? null;
  } catch {
    return null;
  }
}

// Haversine distance in meters
export function distanceMeters(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export async function validateGeofence(point: { latitude: number; longitude: number }) {
  const locs = await listLocations();
  const active = locs.filter((l) => l.is_active);
  if (active.length === 0) return { inside: true, location: null as AttendanceLocation | null };
  let best: { loc: AttendanceLocation; dist: number } | null = null;
  for (const l of active) {
    const d = distanceMeters(
      { lat: point.latitude, lon: point.longitude },
      { lat: Number(l.latitude), lon: Number(l.longitude) }
    );
    if (d <= l.radius_meters) return { inside: true, location: l };
    if (!best || d < best.dist) best = { loc: l, dist: d };
  }
  return { inside: false, location: best?.loc ?? null, distance: best?.dist };
}

// ---------- Sessions ----------
export async function getActiveSession(employeeId: string): Promise<AttendanceSession | null> {
  const { data, error } = await supabase
    .from('attendance_sessions')
    .select('*')
    .eq('employee_id', employeeId)
    .is('check_out_time', null)
    .order('check_in_time', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getDailyAttendance(employeeId: string, date: string) {
  const { data, error } = await supabase
    .from('attendance_sessions')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('session_date', date)
    .order('check_in_time', { ascending: true });
  if (error) throw error;
  const sessions = data ?? [];
  const work = sessions.filter((s) => s.session_type === 'work').reduce((a, s) => a + (s.duration_minutes ?? 0), 0);
  const brk = sessions.filter((s) => s.session_type === 'break').reduce((a, s) => a + (s.duration_minutes ?? 0), 0);
  return { sessions, totalWorkMinutes: work, totalBreakMinutes: brk };
}

export async function getMonthlyAttendance(employeeId: string, month: string /* YYYY-MM */) {
  const start = `${month}-01`;
  const end = new Date(new Date(start).getFullYear(), new Date(start).getMonth() + 1, 1)
    .toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('attendance_sessions')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('session_date', start)
    .lt('session_date', end)
    .order('session_date', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getRangeAttendance(employeeIds: string[], startDate: string, endDate: string) {
  if (employeeIds.length === 0) return [];
  const { data, error } = await supabase
    .from('attendance_sessions')
    .select('*')
    .in('employee_id', employeeIds)
    .gte('session_date', startDate)
    .lte('session_date', endDate);
  if (error) throw error;
  return data ?? [];
}

export async function punchIn(args: {
  employee_id: string;
  session_type: 'work' | 'break';
  point: GeoPoint;
  notes?: string | null;
  created_by?: string | null;
}): Promise<AttendanceSession> {
  // Close any currently-open session for the employee first
  const open = await getActiveSession(args.employee_id);
  if (open) {
    await punchOut({
      session_id: open.id,
      point: args.point,
      notes: args.notes ?? null,
    });
  }
  const today = new Date().toISOString().slice(0, 10);
  const payload: AttendanceSessionInsert = {
    employee_id: args.employee_id,
    session_date: today,
    session_type: args.session_type,
    check_in_time: new Date().toISOString(),
    check_in_latitude: args.point.latitude,
    check_in_longitude: args.point.longitude,
    check_in_address: args.point.address ?? null,
    check_in_accuracy_meters: args.point.accuracy_meters ?? null,
    source: 'mobile_gps',
    notes: args.notes ?? null,
    created_by: args.created_by ?? null,
  };
  const { data, error } = await supabase.from('attendance_sessions').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function punchOut(args: {
  session_id: string;
  point: GeoPoint;
  notes?: string | null;
}): Promise<AttendanceSession> {
  const patch: AttendanceSessionUpdate = {
    check_out_time: new Date().toISOString(),
    check_out_latitude: args.point.latitude,
    check_out_longitude: args.point.longitude,
    check_out_address: args.point.address ?? null,
    check_out_accuracy_meters: args.point.accuracy_meters ?? null,
  };
  if (args.notes) patch.notes = args.notes;
  const { data, error } = await supabase
    .from('attendance_sessions').update(patch).eq('id', args.session_id).select().single();
  if (error) throw error;
  return data;
}

export async function updateSession(id: string, patch: AttendanceSessionUpdate) {
  const { data, error } = await supabase
    .from('attendance_sessions').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteSession(id: string) {
  const { error } = await supabase.from('attendance_sessions').delete().eq('id', id);
  if (error) throw error;
}

export async function bulkInsertFromCSV(rows: AttendanceSessionInsert[]) {
  if (rows.length === 0) return [];
  const { data, error } = await supabase
    .from('attendance_sessions').insert(rows.map((r) => ({ ...r, source: 'csv_import' as const }))).select();
  if (error) throw error;
  return data ?? [];
}

// ---------- Locations ----------
export async function listLocations(): Promise<AttendanceLocation[]> {
  const { data, error } = await supabase
    .from('attendance_locations').select('*').order('name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}
export async function createLocation(p: AttendanceLocationInsert) {
  const { data, error } = await supabase.from('attendance_locations').insert(p).select().single();
  if (error) throw error;
  return data;
}
export async function updateLocation(id: string, patch: AttendanceLocationUpdate) {
  const { data, error } = await supabase.from('attendance_locations').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data;
}
export async function deleteLocation(id: string) {
  const { error } = await supabase.from('attendance_locations').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Holidays ----------
export async function listHolidays(): Promise<Holiday[]> {
  const { data, error } = await supabase
    .from('holidays').select('*').order('holiday_date', { ascending: true });
  if (error) throw error;
  return data ?? [];
}
export async function createHoliday(p: HolidayInsert) {
  const { data, error } = await supabase.from('holidays').insert(p).select().single();
  if (error) throw error;
  return data;
}
export async function updateHoliday(id: string, patch: HolidayUpdate) {
  const { data, error } = await supabase.from('holidays').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data;
}
export async function deleteHoliday(id: string) {
  const { error } = await supabase.from('holidays').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Work Schedules ----------
export async function listSchedules(employeeId?: string): Promise<WorkSchedule[]> {
  let q = supabase.from('work_schedules').select('*').order('day_of_week', { ascending: true });
  if (employeeId) q = q.eq('employee_id', employeeId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}
export async function upsertSchedule(p: WorkScheduleInsert) {
  const { data, error } = await supabase
    .from('work_schedules')
    .upsert(p, { onConflict: 'employee_id,day_of_week' })
    .select().single();
  if (error) throw error;
  return data;
}
export async function updateSchedule(id: string, patch: WorkScheduleUpdate) {
  const { data, error } = await supabase.from('work_schedules').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

// ---------- Realtime ----------
export function subscribeToActiveSession(employeeId: string, cb: () => void) {
  const ch = supabase
    .channel(`att_session_${employeeId}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'attendance_sessions', filter: `employee_id=eq.${employeeId}` },
      () => cb())
    .subscribe();
  return () => { supabase.removeChannel(ch); };
}