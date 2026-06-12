import {
  logFieldChange, type ActivityRecordType,
} from './activityLog';

function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  if (typeof a === 'object' || typeof b === 'object') {
    try { return JSON.stringify(a) === JSON.stringify(b); } catch { return false; }
  }
  return false;
}

export interface TrackChangesOptions {
  /** Field names to ignore (e.g. updatedAt, createdAt). */
  ignore?: string[];
  /** Whitelist — if provided, only these keys are diffed. */
  only?: string[];
}

const DEFAULT_IGNORE = new Set([
  'id', 'createdAt', 'updatedAt', 'created_at', 'updated_at',
]);

/**
 * Diffs two objects field by field and writes a `field_change`
 * activity_log entry for every changed scalar field.
 */
export async function trackChanges(
  recordType: ActivityRecordType,
  recordId: string,
  oldValues: Record<string, unknown> | null | undefined,
  newValues: Record<string, unknown> | null | undefined,
  options: TrackChangesOptions = {},
): Promise<void> {
  if (!recordId || !newValues) return;
  const ignore = new Set([...DEFAULT_IGNORE, ...(options.ignore ?? [])]);
  const keys = options.only ?? Object.keys(newValues);
  for (const key of keys) {
    if (ignore.has(key)) continue;
    const next = (newValues as any)[key];
    const prev = oldValues ? (oldValues as any)[key] : undefined;
    if (isEqual(prev, next)) continue;
    try {
      await logFieldChange(recordType, recordId, key, prev, next);
    } catch {
      // never let logging break a save
    }
  }
}