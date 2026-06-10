import { useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ATTENDANCE_NAV } from '@/lib/navigation/attendance';
import { MobileScrollHint } from '@/components/layout/MobileScrollHint';
import { useEmployees, useRangeAttendance, useDeleteSession } from '@/hooks/hr';
import { ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

const isoDate = (d: Date) => d.toISOString().slice(0, 10);
function fmtDur(min: number) {
  if (!min) return '—';
  const h = Math.floor(min / 60), m = min % 60;
  return h ? `${h}h${m ? ` ${m}m` : ''}` : `${m}m`;
}
function fmtTime(iso: string | null) {
  return iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
}

export default function AdminAttendance() {
  const navigate = useNavigate();
  const { data: employees = [] } = useEmployees();
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d;
  });
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart); d.setDate(d.getDate() + i); return d;
    }),
    [weekStart]
  );
  const start = isoDate(days[0]);
  const end = isoDate(days[6]);
  const ids = employees.map((e) => e.id);
  const { data: sessions = [] } = useRangeAttendance(ids, start, end);
  const del = useDeleteSession();

  const grid = useMemo(() => {
    const m: Record<string, Record<string, number>> = {};
    for (const s of sessions) {
      if (s.session_type !== 'work') continue;
      (m[s.employee_id] ??= {});
      m[s.employee_id][s.session_date] = (m[s.employee_id][s.session_date] ?? 0) + (s.duration_minutes ?? 0);
    }
    return m;
  }, [sessions]);

  const [selected, setSelected] = useState<{ empId: string; date: string } | null>(null);
  const selectedSessions = useMemo(() =>
    !selected ? [] : sessions.filter((s) => s.employee_id === selected.empId && s.session_date === selected.date),
    [sessions, selected]);

  return (
    <AppLayout title="Attendance" subtitle="Admin Grid" moduleNav={ATTENDANCE_NAV}>
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); }}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium text-sm">
              {days[0].toLocaleDateString()} – {days[6].toLocaleDateString()}
            </span>
            <Button variant="ghost" size="sm" onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); }}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/attendance/admin/import')}>
            <Upload className="h-4 w-4" /> Import CSV
          </Button>
        </div>

        <MobileScrollHint />
        <Card className="overflow-x-auto -mx-4 md:mx-0 rounded-none md:rounded-md">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left p-2 sticky left-0 bg-muted/40">Employee</th>
                {days.map((d) => (
                  <th key={d.toISOString()} className="p-2 text-center min-w-[80px]">
                    {d.toLocaleDateString([], { weekday: 'short', day: 'numeric' })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id} className="border-t">
                  <td className="p-2 sticky left-0 bg-card font-medium">{e.full_name}</td>
                  {days.map((d) => {
                    const dateStr = isoDate(d);
                    const v = grid[e.id]?.[dateStr] ?? 0;
                    return (
                      <td key={dateStr} className="p-1 text-center">
                        <button
                          className={`w-full rounded px-2 py-1 text-xs ${v ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'text-muted-foreground hover:bg-accent'}`}
                          onClick={() => setSelected({ empId: e.id, date: dateStr })}
                        >
                          {fmtDur(v)}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {employees.length === 0 && (
                <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No employees.</td></tr>
              )}
            </tbody>
          </table>
        </Card>

        <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selected && employees.find((e) => e.id === selected.empId)?.full_name} — {selected?.date}
              </DialogTitle>
            </DialogHeader>
            {selectedSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sessions.</p>
            ) : (
              <ul className="space-y-2">
                {selectedSessions.map((s) => (
                  <li key={s.id} className="border rounded-md p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span>
                        <Badge variant="outline" className="mr-2 capitalize">{s.session_type}</Badge>
                        {fmtTime(s.check_in_time)} → {fmtTime(s.check_out_time)}
                      </span>
                      <span className="flex items-center gap-2">
                        <span>{fmtDur(s.duration_minutes ?? 0)}</span>
                        <Button
                          size="sm" variant="ghost" className="h-7 text-destructive"
                          onClick={async () => {
                            if (!confirm('Delete this session?')) return;
                            try { await del.mutateAsync(s.id); toast({ title: 'Deleted' }); }
                            catch (e: any) { toast({ title: 'Delete failed', description: e?.message, variant: 'destructive' }); }
                          }}
                        >Delete</Button>
                      </span>
                    </div>
                    {s.notes && <p className="text-xs text-muted-foreground mt-1">{s.notes}</p>}
                  </li>
                ))}
              </ul>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}