import { useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HR_NAV } from '@/lib/navigation/hr';
import { useCurrentEmployee } from '@/hooks/hr/useCurrentEmployee';
import { useMonthlyAttendance } from '@/hooks/hr';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function fmtTime(iso: string | null) {
  return iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
}
function fmtDur(min: number) {
  const h = Math.floor(min / 60), m = min % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

export default function MyAttendance() {
  const { data: employee } = useCurrentEmployee();
  const empId = employee?.id;

  const [cursor, setCursor] = useState(() => new Date());
  const month = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
  const { data: sessions = [] } = useMonthlyAttendance(empId, month);

  const byDay = useMemo(() => {
    const m: Record<string, typeof sessions> = {};
    for (const s of sessions) (m[s.session_date] ??= []).push(s);
    return m;
  }, [sessions]);

  const [selected, setSelected] = useState<string | null>(null);
  const days = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const pad = first.getDay();
    return [
      ...Array(pad).fill(null),
      ...Array.from({ length: last }, (_, i) => i + 1),
    ];
  }, [cursor]);

  const monthLabel = cursor.toLocaleDateString([], { month: 'long', year: 'numeric' });
  const todayDay = selected ?? `${month}-01`;
  const dayList = byDay[selected ?? ''] ?? [];
  const dayWork = dayList.filter((s) => s.session_type === 'work').reduce((a, s) => a + (s.duration_minutes ?? 0), 0);
  const dayBreak = dayList.filter((s) => s.session_type === 'break').reduce((a, s) => a + (s.duration_minutes ?? 0), 0);

  return (
    <AppLayout title="Attendance" subtitle="My History" moduleNav={HR_NAV}>
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="font-semibold">{monthLabel}</h2>
            <Button variant="ghost" size="sm" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground mb-1">
            {['S','M','T','W','T','F','S'].map((d, i) => <div key={i}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d, i) => {
              if (d === null) return <div key={i} />;
              const dateStr = `${month}-${String(d).padStart(2, '0')}`;
              const list = byDay[dateStr] ?? [];
              const worked = list.filter((s) => s.session_type === 'work').reduce((a, s) => a + (s.duration_minutes ?? 0), 0);
              const has = list.length > 0;
              const isSel = selected === dateStr;
              return (
                <button
                  key={i}
                  onClick={() => setSelected(dateStr)}
                  className={`aspect-square rounded-md border text-sm p-1 flex flex-col items-center justify-center transition
                    ${isSel ? 'border-primary bg-primary/5' : 'hover:bg-accent'}
                    ${has ? 'border-emerald-200' : ''}`}
                >
                  <span>{d}</span>
                  {has && <span className="text-[10px] text-emerald-700">{fmtDur(worked)}</span>}
                </button>
              );
            })}
          </div>
        </Card>

        {selected && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{selected}</h3>
              <div className="flex gap-2 text-sm">
                <Badge variant="outline">Work: {fmtDur(dayWork)}</Badge>
                <Badge variant="outline">Break: {fmtDur(dayBreak)}</Badge>
              </div>
            </div>
            {dayList.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sessions.</p>
            ) : (
              <ul className="space-y-2">
                {dayList.map((s) => (
                  <li key={s.id} className="border rounded-md p-2 text-sm flex justify-between">
                    <span>
                      <strong className="capitalize">{s.session_type}</strong>{' '}
                      {fmtTime(s.check_in_time)} → {fmtTime(s.check_out_time)}
                    </span>
                    <span>{fmtDur(s.duration_minutes ?? 0)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>
    </AppLayout>
  );
}