import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export type ReportColumn<T = Record<string, unknown>> = {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  format?: (row: T) => string | number;
  sortable?: boolean;
  exportable?: boolean;
  align?: "left" | "right" | "center";
};

function cellValue<T>(row: T, col: ReportColumn<T>): string | number {
  if (col.format) return col.format(row);
  const v = (row as Record<string, unknown>)[col.key];
  if (v === null || v === undefined) return "";
  if (typeof v === "number" || typeof v === "string") return v;
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

function exportableCols<T>(columns: ReportColumn<T>[]) {
  return columns.filter((c) => c.exportable !== false);
}

function csvEscape(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToCSV<T>(rows: T[], columns: ReportColumn<T>[], filename: string) {
  const cols = exportableCols(columns);
  const header = cols.map((c) => csvEscape(c.label)).join(",");
  const lines = rows.map((row) =>
    cols.map((c) => csvEscape(cellValue(row, c))).join(","),
  );
  const csv = [header, ...lines].join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), filename);
}

export function exportToExcel<T>(rows: T[], columns: ReportColumn<T>[], filename: string) {
  const cols = exportableCols(columns);
  const data = rows.map((row) => {
    const obj: Record<string, string | number> = {};
    cols.forEach((c) => {
      obj[c.label] = cellValue(row, c);
    });
    return obj;
  });
  const ws = XLSX.utils.json_to_sheet(data, { header: cols.map((c) => c.label) });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  XLSX.writeFile(wb, filename);
}

export function exportToPDF<T>(
  rows: T[],
  columns: ReportColumn<T>[],
  filename: string,
  title: string,
) {
  const doc = new jsPDF({ orientation: "landscape" });
  // GLF letterhead
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("GLF ERP", 14, 16);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(title, 14, 24);
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 14, 30);
  doc.setTextColor(0);

  const cols = exportableCols(columns);
  autoTable(doc, {
    startY: 36,
    head: [cols.map((c) => c.label)],
    body: rows.map((row) => cols.map((c) => String(cellValue(row, c) ?? ""))),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [40, 40, 40] },
    theme: "grid",
  });

  doc.save(filename);
}