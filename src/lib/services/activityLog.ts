import { supabase } from '@/integrations/supabase/client';

export type ActivityRecordType =
  | 'sales_order' | 'quotation' | 'invoice' | 'delivery_note'
  | 'work_order' | 'vendor_order' | 'return_request'
  | 'employee' | 'product' | string;

export type ActivityActionType =
  | 'field_change' | 'status_change' | 'manual_note' | 'created' | 'deleted';

export interface ActivityLogEntry {
  id: string;
  record_type: string;
  record_id: string;
  action_type: ActivityActionType;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  note_text: string | null;
  changed_by: string;
  changed_at: string;
  is_deleted: boolean;
  deleted_by: string | null;
  deleted_at: string | null;
  // joined
  changed_by_name?: string | null;
  changed_by_avatar?: string | null;
}

async function currentUid(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function fetchActivityLog(
  recordType: ActivityRecordType,
  recordId: string,
  limit = 20,
  offset = 0,
): Promise<{ entries: ActivityLogEntry[]; total: number }> {
  const { data, error } = await supabase.rpc('get_activity_log_with_users' as any, {
    p_record_type: recordType,
    p_record_id: recordId,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) throw error;
  const rows = (data ?? []) as any[];
  const total = rows[0]?.total_count ? Number(rows[0].total_count) : rows.length;
  const entries: ActivityLogEntry[] = rows.map((r) => ({
    id: r.id,
    record_type: r.record_type,
    record_id: r.record_id,
    action_type: r.action_type,
    field_name: r.field_name,
    old_value: r.old_value,
    new_value: r.new_value,
    note_text: r.note_text,
    changed_by: r.changed_by,
    changed_at: r.changed_at,
    is_deleted: r.is_deleted,
    deleted_by: r.deleted_by,
    deleted_at: r.deleted_at,
    changed_by_name: r.changed_by_name,
  }));
  return { entries, total };
}

function stringify(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try { return JSON.stringify(v); } catch { return String(v); }
}

async function insertEntry(row: Record<string, unknown>) {
  const uid = await currentUid();
  if (!uid) return; // not signed in — silently skip
  const { error } = await supabase
    .from('activity_log' as any)
    .insert({ ...row, changed_by: uid });
  if (error) throw error;
}

export async function addManualNote(
  recordType: ActivityRecordType, recordId: string, noteText: string,
) {
  const t = noteText.trim();
  if (!t) return;
  await insertEntry({
    record_type: recordType, record_id: recordId,
    action_type: 'manual_note', note_text: t,
  });
}

export async function logFieldChange(
  recordType: ActivityRecordType, recordId: string,
  fieldName: string, oldValue: unknown, newValue: unknown,
) {
  await insertEntry({
    record_type: recordType, record_id: recordId,
    action_type: 'field_change',
    field_name: fieldName,
    old_value: stringify(oldValue),
    new_value: stringify(newValue),
  });
}

export async function logStatusChange(
  recordType: ActivityRecordType, recordId: string,
  oldStatus: unknown, newStatus: unknown,
) {
  await insertEntry({
    record_type: recordType, record_id: recordId,
    action_type: 'status_change',
    field_name: 'status',
    old_value: stringify(oldStatus),
    new_value: stringify(newStatus),
  });
}

export async function logRecordCreated(
  recordType: ActivityRecordType, recordId: string,
) {
  await insertEntry({
    record_type: recordType, record_id: recordId,
    action_type: 'created',
  });
}

export async function softDeleteLogEntry(logId: string) {
  const uid = await currentUid();
  const { error } = await supabase
    .from('activity_log' as any)
    .update({ is_deleted: true, deleted_by: uid, deleted_at: new Date().toISOString() })
    .eq('id', logId);
  if (error) throw error;
}