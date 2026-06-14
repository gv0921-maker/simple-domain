// Apply a FilterState to an in-memory array of records.
// Used by CRM pipeline (already fetches all opportunities client-side).

import type { FilterState, FilterGroup, SortSpec } from './types';

function getField(rec: Record<string, unknown>, key: string): unknown {
  // Support a small set of virtual computed fields.
  if (key === 'expected_closing_month') {
    const v = rec['expectedCloseDate'] as string | undefined;
    if (!v) return null;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  // Map snake_case keys to camelCase if present.
  const camel = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
  if (camel in rec) return rec[camel];
  return rec[key];
}

function startOfWeek(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); x.setDate(x.getDate() - x.getDay()); return x; }
function startOfMonth(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); x.setDate(1); return x; }
function startOfToday() { const x = new Date(); x.setHours(0,0,0,0); return x; }

function matchOne(rec: Record<string, unknown>, g: FilterGroup): boolean {
  const v = getField(rec, g.field);
  const target = g.value;
  switch (g.operator) {
    case 'is': return String(v ?? '').toLowerCase() === String(target ?? '').toLowerCase();
    case 'is_not': return String(v ?? '').toLowerCase() !== String(target ?? '').toLowerCase();
    case 'contains': return String(v ?? '').toLowerCase().includes(String(target ?? '').toLowerCase());
    case 'starts_with': return String(v ?? '').toLowerCase().startsWith(String(target ?? '').toLowerCase());
    case 'in': {
      const arr = Array.isArray(target) ? target : [target];
      const recArr = Array.isArray(v) ? v : [v];
      return recArr.some(x => arr.map(String).includes(String(x)));
    }
    case 'not_in': {
      const arr = Array.isArray(target) ? target : [target];
      const recArr = Array.isArray(v) ? v : [v];
      return !recArr.some(x => arr.map(String).includes(String(x)));
    }
    case 'gt': return Number(v ?? 0) > Number(target ?? 0);
    case 'lt': return Number(v ?? 0) < Number(target ?? 0);
    case 'gte': return Number(v ?? 0) >= Number(target ?? 0);
    case 'lte': return Number(v ?? 0) <= Number(target ?? 0);
    case 'between': {
      const t = target as { from: unknown; to: unknown } | undefined;
      if (!t) return true;
      const n = Number(v);
      return n >= Number(t.from) && n <= Number(t.to);
    }
    case 'is_empty': return v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
    case 'is_not_empty': return !(v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0));
    case 'today': {
      if (!v) return false;
      const d = new Date(String(v));
      return d >= startOfToday();
    }
    case 'this_week': {
      if (!v) return false; const d = new Date(String(v)); return d >= startOfWeek(new Date());
    }
    case 'this_month': {
      if (!v) return false; const d = new Date(String(v)); return d >= startOfMonth(new Date());
    }
    case 'last_n_days': {
      if (!v) return false;
      const n = Number(target ?? 7);
      const cutoff = Date.now() - n * 86400000;
      return new Date(String(v)).getTime() >= cutoff;
    }
    case 'before': return v ? new Date(String(v)).getTime() < new Date(String(target)).getTime() : false;
    case 'after': return v ? new Date(String(v)).getTime() > new Date(String(target)).getTime() : false;
    default: return true;
  }
}

export function applyFilterState<T extends Record<string, unknown>>(
  records: T[],
  state: FilterState,
  textSearchFields: string[] = [],
): T[] {
  let out = records;

  if (state.search && state.search.trim() && textSearchFields.length) {
    const q = state.search.toLowerCase();
    out = out.filter(r => textSearchFields.some(f => {
      const v = getField(r, f);
      return v != null && String(v).toLowerCase().includes(q);
    }));
  }

  if (state.groups?.length) {
    out = out.filter(r => state.groups.every(g => matchOne(r, g)));
  }

  if (state.sort_by) {
    const { field, direction } = state.sort_by as SortSpec;
    const dir = direction === 'desc' ? -1 : 1;
    out = [...out].sort((a, b) => {
      const av = getField(a, field); const bv = getField(b, field);
      if (av == null && bv == null) return 0;
      if (av == null) return 1; if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }

  return out;
}

export function groupByField<T extends Record<string, unknown>>(
  records: T[], field: string,
  labelFor?: (key: string) => string,
): { label: string; key: string; records: T[] }[] {
  const map = new Map<string, T[]>();
  for (const r of records) {
    const v = getField(r, field);
    const k = v == null || v === '' ? '__none__' : String(v);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(r);
  }
  return Array.from(map.entries())
    .sort(([a],[b]) => a.localeCompare(b))
    .map(([key, recs]) => ({
      key,
      label: key === '__none__' ? 'Undefined' : (labelFor ? labelFor(key) : key),
      records: recs,
    }));
}
