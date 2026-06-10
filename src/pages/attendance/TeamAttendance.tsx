import { useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ATTENDANCE_NAV } from '@/lib/navigation/attendance';
import { useCurrentEmployee } from '@/hooks/hr/useCurrentEmployee';
import { useEmployees, useRangeAttendance } from '@/hooks/hr';

function fmtDur(min: number) {
  const h = Math.floor(min / 60), m = min % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}
const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export default function TeamAttendance() {
  const { data: me } = useCurrentEmployee();
  const { data: all = [] } = useEmployees();
  const reports = useMemo(() => all.filter((e) => e.reports_to === me?.id), [all, me]);
  const ids = reports.map((r) => r.id);

  const today = isoDate(new Date());
  const weekStart = isoDate(new Date(Date.now() - 6 * 86400_000));
  const { data: sessions = [] } = useRangeAttendance(ids, weekStart, today);

  const summary = useMemo(() => {
    const map: Record<string, { todayWork: number; weekWork: number; active: boolean }> = {};
    for (const id of ids) map[id] = { todayWork: 0, weekWork: 0, active: false };
    for (const s of sessions) {
      const m = map[s.employee_id]; if (!m) continue;
      if (s.session_type === 'work') {
        m.weekWork += s.duration_minutes ?? 0;
        if (s.session_date === today) m.todayWork += s.duration_minutes ?? 0;
      }
      if (!s.check_out_time && s.session_date === today) m.active = true;
    }
    return map;
  }, [sessions, ids, today]);

  return (
    <AppLayout title="Attendance" subtitle="Team" moduleNav={ATTENDANCE_NAV}>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
        {reports.length === 0 ? (
          <Card className="p-6 text-sm text-muted-foreground">You have no direct reports.</Card>
        ) : (
          <Card>
            <div className="p-4 border-b font-semibold">Direct Reports — Today &amp; Past 7 Days</div>
            <div className="divide-y">
              {reports.map((r) => {
                const s = summary[r.id];
                return (
                  <div key={r.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{r.full_name}</p>
                      <p className="text-xs text-muted-foreground">{r.designation ?? '—'}</p>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      {s?.active && <Badge className="bg-emerald-100 text-emerald-700" variant="outline">Active now</Badge>}
                      <span>Today: <strong>{fmtDur(s?.todayWork ?? 0)}</strong></span>
                      <span className="text-muted-foreground">7d: {fmtDur(s?.weekWork ?? 0)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}