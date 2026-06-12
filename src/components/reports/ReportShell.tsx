import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileSpreadsheet, FileText, Save, SlidersHorizontal, CalendarClock } from "lucide-react";
import type { ReportColumn } from "@/lib/reports/exporters";
import { exportToCSV, exportToExcel, exportToPDF } from "@/lib/reports/exporters";
import type { ReportFilterDef } from "@/lib/reports/registry";
import { toast } from "@/hooks/use-toast";

export type ReportShellProps<T extends Record<string, unknown>> = {
  reportKey: string;
  title: string;
  description?: string;
  filtersConfig: ReportFilterDef[];
  columnsConfig: ReportColumn<T>[];
  data: T[];
  loading?: boolean;
  filters: Record<string, unknown>;
  onFilterChange: (next: Record<string, unknown>) => void;
  onRowClick?: (row: T) => void;
  onSaveFilter?: (name: string) => Promise<void> | void;
  onSchedule?: (cfg: { schedule: "daily" | "weekly" | "monthly"; email: string }) => Promise<void> | void;
};

function FilterControl({ def, value, onChange }: { def: ReportFilterDef; value: unknown; onChange: (v: unknown) => void }) {
  if (def.type === "dateRange") {
    const v = (value as { from?: string; to?: string }) || {};
    return (
      <div className="flex gap-2 items-center">
        <Input type="date" value={v.from || ""} onChange={(e) => onChange({ ...v, from: e.target.value })} className="w-[140px]" />
        <span className="text-muted-foreground text-xs">to</span>
        <Input type="date" value={v.to || ""} onChange={(e) => onChange({ ...v, to: e.target.value })} className="w-[140px]" />
      </div>
    );
  }
  if (def.type === "select") {
    const display = value === "" || value == null ? "_all" : String(value);
    return (
      <Select value={display} onValueChange={(v) => onChange(v === "_all" ? "" : v)}>
        <SelectTrigger className="w-[180px]"><SelectValue placeholder={def.label} /></SelectTrigger>
        <SelectContent>
          {def.options?.map((o) => <SelectItem key={o.value || "_"} value={o.value || "_all"}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    );
  }
  if (def.type === "number") {
    return <Input type="number" value={value as number ?? ""} onChange={(e) => onChange(Number(e.target.value))} className="w-[120px]" />;
  }
  return <Input type="text" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} className="w-[200px]" />;
}

export function ReportShell<T extends Record<string, unknown>>(props: ReportShellProps<T>) {
  const { reportKey, title, description, filtersConfig, columnsConfig, data, loading, filters, onFilterChange, onRowClick, onSaveFilter, onSchedule } = props;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [saveName, setSaveName] = useState("");
  const [saveOpen, setSaveOpen] = useState(false);
  const [schedOpen, setSchedOpen] = useState(false);
  const [schedule, setSchedule] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [email, setEmail] = useState("");

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    const copy = [...data];
    copy.sort((a, b) => {
      const av = a[sortKey] as any; const bv = b[sortKey] as any;
      if (av == null) return 1; if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
      return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return copy;
  }, [data, sortKey, sortDir]);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const filename = `${reportKey}-${new Date().toISOString().slice(0, 10)}`;
  const activeChips = Object.entries(filters).filter(([, v]) => v != null && v !== "" && !(typeof v === "object" && Object.values(v as object).every((x) => !x)));

  return (
    <div className="space-y-4 pb-24 md:pb-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>

      {/* Filter chips bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2"><SlidersHorizontal className="h-4 w-4" />Filters</Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader><SheetTitle>Report Filters</SheetTitle></SheetHeader>
            <div className="space-y-4 mt-4">
              {filtersConfig.length === 0 && <p className="text-sm text-muted-foreground">No filters available for this report.</p>}
              {filtersConfig.map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <Label>{f.label}</Label>
                  <FilterControl def={f} value={filters[f.key]} onChange={(v) => onFilterChange({ ...filters, [f.key]: v })} />
                </div>
              ))}
            </div>
            <SheetFooter className="mt-6">
              <Button variant="outline" onClick={() => onFilterChange({})}>Clear all</Button>
              <Button onClick={() => setFiltersOpen(false)}>Apply</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        {activeChips.map(([k, v]) => (
          <Badge key={k} variant="secondary" className="gap-1">{k}: {typeof v === "object" ? JSON.stringify(v) : String(v)}</Badge>
        ))}
        <div className="ml-auto text-xs text-muted-foreground">{loading ? "Loading…" : `${sorted.length} row${sorted.length === 1 ? "" : "s"}`}</div>
      </div>

      {/* Desktop table */}
      <Card className="hidden md:block">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columnsConfig.map((c) => (
                  <TableHead key={c.key} className={c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : ""}
                    onClick={() => c.sortable !== false && toggleSort(c.key)}
                    style={{ cursor: c.sortable !== false ? "pointer" : "default" }}>
                    {c.label}{sortKey === c.key ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && sorted.length === 0 && (
                <TableRow><TableCell colSpan={columnsConfig.length} className="text-center text-muted-foreground py-12">No data available for the current filters.</TableCell></TableRow>
              )}
              {sorted.map((row, i) => (
                <TableRow key={i} onClick={() => onRowClick?.(row)} className={onRowClick ? "cursor-pointer" : ""}>
                  {columnsConfig.map((c) => (
                    <TableCell key={c.key} className={c.align === "right" ? "text-right tabular-nums" : c.align === "center" ? "text-center" : ""}>
                      {c.render ? c.render(row) : c.format ? c.format(row) : String(row[c.key] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {!loading && sorted.length === 0 && (
          <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No data available.</CardContent></Card>
        )}
        {sorted.map((row, i) => (
          <Card key={i} onClick={() => onRowClick?.(row)} className={onRowClick ? "cursor-pointer" : ""}>
            <CardContent className="p-3 space-y-1">
              {columnsConfig.map((c) => (
                <div key={c.key} className="flex justify-between gap-3 text-sm">
                  <span className="text-muted-foreground shrink-0">{c.label}</span>
                  <span className="text-right truncate">{c.render ? c.render(row) : c.format ? c.format(row) : String(row[c.key] ?? "")}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action toolbar — sticky on mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-30 md:static md:z-auto bg-card border-t md:border-0 p-2 md:p-0">
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => exportToCSV(sorted, columnsConfig, `${filename}.csv`)} className="gap-1.5">
            <Download className="h-4 w-4" />CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportToExcel(sorted, columnsConfig, `${filename}.xlsx`)} className="gap-1.5">
            <FileSpreadsheet className="h-4 w-4" />Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportToPDF(sorted, columnsConfig, `${filename}.pdf`, title)} className="gap-1.5">
            <FileText className="h-4 w-4" />PDF
          </Button>
          {onSaveFilter && (
            <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
              <DialogTrigger asChild><Button variant="outline" size="sm" className="gap-1.5"><Save className="h-4 w-4" />Save</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Save report configuration</DialogTitle></DialogHeader>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="" />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSaveOpen(false)}>Cancel</Button>
                  <Button onClick={async () => {
                    if (!saveName.trim()) return;
                    await onSaveFilter(saveName.trim());
                    setSaveOpen(false); setSaveName("");
                    toast({ title: "Saved", description: "Report configuration saved." });
                  }}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {onSchedule && (
            <Dialog open={schedOpen} onOpenChange={setSchedOpen}>
              <DialogTrigger asChild><Button variant="outline" size="sm" className="gap-1.5"><CalendarClock className="h-4 w-4" />Schedule</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Schedule report</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Frequency</Label>
                    <Select value={schedule} onValueChange={(v) => setSchedule(v as any)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Delivery email</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="" />
                  </div>
                  <p className="text-xs text-muted-foreground">Email delivery is not yet wired up — schedule will be stored only.</p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSchedOpen(false)}>Cancel</Button>
                  <Button onClick={async () => {
                    if (!email.trim()) return;
                    await onSchedule({ schedule, email: email.trim() });
                    setSchedOpen(false);
                    toast({ title: "Scheduled", description: `Report will run ${schedule}.` });
                  }}>Schedule</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
}