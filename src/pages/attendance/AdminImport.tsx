import { useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ATTENDANCE_NAV } from '@/lib/navigation/attendance';
import { useEmployees, useBulkInsertSessions } from '@/hooks/hr';
import { toast } from '@/hooks/use-toast';
import type { AttendanceSessionInsert } from '@/lib/services/hr/api';

function parseCSV(text: string): string[][] {
  return text.split(/\r?\n/).filter(Boolean).map((line) => {
    // Simple split — assumes no embedded commas/quotes
    return line.split(',').map((c) => c.trim());
  });
}

export default function AdminImport() {
  const { data: employees = [] } = useEmployees();
  const bulk = useBulkInsertSessions();
  const [rows, setRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({
    employee_code: '', session_date: '', session_type: '',
    check_in_time: '', check_out_time: '',
  });

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const parsed = parseCSV(String(r.result));
      if (parsed.length < 2) { toast({ title: 'Empty CSV', variant: 'destructive' }); return; }
      setHeaders(parsed[0]); setRows(parsed.slice(1));
    };
    r.readAsText(f);
  }

  const empByCode = useMemo(() => {
    const m: Record<string, string> = {};
    for (const e of employees) m[e.employee_code] = e.id;
    return m;
  }, [employees]);

  function colIdx(field: string) { return headers.indexOf(mapping[field]); }

  async function handleImport() {
    const payload: AttendanceSessionInsert[] = [];
    let skipped = 0;
    for (const row of rows) {
      const code = row[colIdx('employee_code')];
      const empId = empByCode[code];
      const date = row[colIdx('session_date')];
      const type = (row[colIdx('session_type')] || 'work').toLowerCase();
      const checkIn = row[colIdx('check_in_time')];
      const checkOut = colIdx('check_out_time') >= 0 ? row[colIdx('check_out_time')] : null;
      if (!empId || !date || !checkIn || !['work','break'].includes(type)) { skipped++; continue; }
      payload.push({
        employee_id: empId,
        session_date: date,
        session_type: type as 'work' | 'break',
        check_in_time: new Date(checkIn).toISOString(),
        check_out_time: checkOut ? new Date(checkOut).toISOString() : null,
        source: 'csv_import',
      });
    }
    if (payload.length === 0) { toast({ title: 'Nothing to import', variant: 'destructive' }); return; }
    try {
      await bulk.mutateAsync(payload);
      toast({ title: `Imported ${payload.length} sessions`, description: skipped ? `${skipped} skipped` : undefined });
      setRows([]); setHeaders([]);
    } catch (e: any) {
      toast({ title: 'Import failed', description: e?.message, variant: 'destructive' });
    }
  }

  const fields = ['employee_code','session_date','session_type','check_in_time','check_out_time'];

  return (
    <AppLayout title="Attendance" subtitle="Import CSV" moduleNav={ATTENDANCE_NAV}>
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
        <Card className="p-4 space-y-3">
          <div>
            <Label>CSV File</Label>
            <Input type="file" accept=".csv,text/csv" onChange={onFile} />
            <p className="text-xs text-muted-foreground mt-1">
              First row must be column headers. Required: employee_code, session_date, session_type, check_in_time. Optional: check_out_time.
            </p>
          </div>
        </Card>

        {headers.length > 0 && (
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold">Map Columns ({rows.length} rows)</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f}>
                  <Label className="text-xs">{f}</Label>
                  <Select value={mapping[f]} onValueChange={(v) => setMapping((m) => ({ ...m, [f]: v }))}>
                    <SelectTrigger><SelectValue placeholder="" /></SelectTrigger>
                    <SelectContent>
                      {headers.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <Button onClick={handleImport} disabled={bulk.isPending}>Import {rows.length} rows</Button>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}