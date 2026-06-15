import * as XLSX from 'xlsx';
import type { ImportExportSchema } from './registry';

/** Generates and triggers download of an Excel template for the given schema. */
export function downloadTemplate(schema: ImportExportSchema): void {
  const headers = schema.columns.map((c) => c.label);
  const exampleRow = schema.columns.map((c) => c.exampleValue ?? '');

  const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);

  // Instructions sheet
  const instructions = [
    ['Field', 'Required', 'Type', 'Allowed Values', 'Example'],
    ...schema.columns.map((c) => [
      c.label,
      c.required ? 'Yes' : 'No',
      c.type,
      c.enumOptions?.join(' | ') ?? '',
      c.exampleValue == null ? '' : String(c.exampleValue),
    ]),
  ];
  const wsi = XLSX.utils.aoa_to_sheet(instructions);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, schema.displayName.slice(0, 30));
  XLSX.utils.book_append_sheet(wb, wsi, 'Instructions');

  XLSX.writeFile(wb, `${schema.moduleKey}_template.xlsx`);
}

/** Exports an array of records (already filtered) as .xlsx or .csv. */
export function exportRecords(
  schema: ImportExportSchema,
  records: Record<string, unknown>[],
  options: { format: 'xlsx' | 'csv'; fileName?: string } = { format: 'xlsx' },
): void {
  const headers = schema.columns.map((c) => c.label);
  const aoa: unknown[][] = [headers];
  for (const r of records) {
    aoa.push(schema.columns.map((c) => {
      const v = r[c.key] ?? r[camel(c.key)];
      return v == null ? '' : v;
    }));
  }
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, schema.displayName.slice(0, 30));
  const name = options.fileName ?? `${schema.moduleKey}_export`;
  if (options.format === 'csv') {
    XLSX.writeFile(wb, `${name}.csv`, { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, `${name}.xlsx`);
  }
}

function camel(snake: string): string {
  return snake.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

/** Downloads an error CSV with row + message columns. */
export function downloadErrorCsv(
  errors: { row: number; message: string }[],
  baseName = 'import_errors',
): void {
  const aoa: unknown[][] = [['Row', 'Error']];
  for (const e of errors) aoa.push([e.row, e.message]);
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Errors');
  XLSX.writeFile(wb, `${baseName}.csv`, { bookType: 'csv' });
}