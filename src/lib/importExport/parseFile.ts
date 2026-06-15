import * as XLSX from 'xlsx';
import type { ImportExportSchema } from './registry';

export interface ParsedFile {
  headers: string[];
  rows: Record<string, unknown>[];
}

/** Parses .xlsx or .csv file → headers + raw row objects. */
export async function parseFile(file: File): Promise<ParsedFile> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '', raw: false });
  const headers = json.length ? Object.keys(json[0]) : [];
  return { headers, rows: json };
}

/**
 * Auto-maps file headers → schema column keys.
 * Matches by exact label match (case-insensitive) or exact key match.
 */
export function autoMapHeaders(
  headers: string[],
  schema: ImportExportSchema,
): Record<string, string> {
  const map: Record<string, string> = {};
  const byLabel = new Map(schema.columns.map((c) => [c.label.toLowerCase(), c.key]));
  const byKey = new Map(schema.columns.map((c) => [c.key.toLowerCase(), c.key]));
  for (const h of headers) {
    const lc = String(h).trim().toLowerCase();
    const k = byLabel.get(lc) ?? byKey.get(lc);
    if (k) map[h] = k;
  }
  return map;
}

/** Coerces a raw cell value into the column's target type. Returns null for blanks. */
export function coerceValue(raw: unknown, type: string): unknown {
  if (raw === null || raw === undefined || raw === '') return null;
  const s = String(raw).trim();
  switch (type) {
    case 'number': {
      const n = Number(s.replace(/,/g, ''));
      return Number.isFinite(n) ? n : null;
    }
    case 'boolean':
      return ['true', '1', 'yes', 'y'].includes(s.toLowerCase());
    case 'date': {
      if (raw instanceof Date) return raw.toISOString().slice(0, 10);
      const d = new Date(s);
      return Number.isNaN(d.getTime()) ? s : d.toISOString().slice(0, 10);
    }
    default:
      return s;
  }
}

/** Maps parsed file rows → records keyed by schema columns, coerced. */
export function mapRowsToSchema(
  rows: Record<string, unknown>[],
  headerMap: Record<string, string>,
  schema: ImportExportSchema,
): Record<string, unknown>[] {
  const colByKey = new Map(schema.columns.map((c) => [c.key, c]));
  return rows.map((r) => {
    const out: Record<string, unknown> = {};
    for (const [header, key] of Object.entries(headerMap)) {
      const col = colByKey.get(key);
      if (!col) continue;
      out[key] = coerceValue(r[header], col.type);
    }
    return out;
  });
}

/** Validates rows client-side. Returns per-row errors. */
export function validateRows(
  records: Record<string, unknown>[],
  schema: ImportExportSchema,
): { row: number; message: string }[] {
  const errors: { row: number; message: string }[] = [];
  records.forEach((rec, i) => {
    const rowNum = i + 2; // header = row 1
    for (const col of schema.columns) {
      const v = rec[col.key];
      if (col.required && (v === null || v === undefined || v === '')) {
        errors.push({ row: rowNum, message: `Missing required field "${col.label}"` });
      }
      if (col.type === 'enum' && v != null && col.enumOptions && !col.enumOptions.includes(String(v))) {
        errors.push({
          row: rowNum,
          message: `Invalid "${col.label}": "${v}". Expected one of: ${col.enumOptions.join(', ')}`,
        });
      }
    }
  });
  return errors;
}