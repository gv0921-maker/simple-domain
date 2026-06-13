import { useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useUnifiedCalendar } from '@/hooks/hr/unifiedCalendar';
import { useEmployees } from '@/hooks/hr';
import { useCurrentEmployee } from '@/hooks/hr/useCurrentEmployee';
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';
import type { CalendarEntry, CalendarEntryType } from '@/lib/services/hr/unifiedCalendar';

const TYPE_LABELS: Record<CalendarEntryType, string> = {
  working: 'Working',
  sunday_duty: 'Sunday Duty',
  comp_off: 'Comp Off',
  leave_paid: 'Paid Leave',
  leave_unpaid: 'Unpaid Leave',
  holiday: 'Holiday',
  off_day: 'Off Day',
};
const TYPE_COLORS: Record<CalendarEntryType, string> = {
  working: '#10b981', sunday_duty: '#a855f7', comp_off: '#f97316',
  leave_paid: '#3b82f6', leave_unpaid: '#ef4444', holiday: '#6b7280', off_day: '#d1d5db',
};

function ymd(d: Date) { return d.toISOString().slice(0, 10); }

export default function UnifiedCalendarPage() {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const { isAdmin } = useIsSuperAdmin();
  const { data: me } = useCurrentEmployee();
  const { data: employees = [] } = useEmployees();

  const [selectedEmp, setSelectedEmp] = useState<string>(isAdmin ? 'all' : 'me');
  const [typeFilter, setTypeFilter] = useState<Set<CalendarEntryType>>(
    new Set(Object.keys(TYPE_LABELS) as CalendarEntryType[]),
  );

  const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const effectiveEmpId = selectedEmp === 'all' ? undefined : (selectedEmp === 'me' ? (me?.id ?? undefined) : selectedEmp);

  const { data: days = [] } = useUnifiedCalendar(ymd(start), ymd(end), effectiveEmpId);

  // Build a grid: leading blanks, then days.
  const grid = useMemo(() => {
    const firstDow = start.getDay(); // 0=Sun
    const cells: Array<{ date: string | null; entries: CalendarEntry[] }> = [];
    for (let i = 0; i < firstDow; i++) cells.push({ date: null, entries: [] });
    for (const d of days) {
      const entries = (d.entries ?? []).filter((e) => typeFilter.has(e.type));
      cells.push({ date: d.date, entries });
    }
    return cells;
  }, [days, start, typeFilter]);

  // Summary for current employee view
  const summary = useMemo(() => {
    const empId = effectiveEmpId ?? me?.id;
    if (!empId) return null;
    const s = { working: 0, leave: 0, holiday: 0, sunday: 0 };
    for (const d of days) for (const e of d.entries ?? []) if (e.employee_id === empId) {
      if (e.type === 'working') s.working++;
      else if (e.type === 'leave_paid' || e.type === 'leave_unpaid') s.leave++;
      else if (e.type === 'holiday') s.holiday++;
      else if (e.type === 'sunday_duty') s.sunday++;
    }
    return s;
  }, [days, effectiveEmpId, me?.id]);

  function toggleType(t: CalendarEntryType) {
    setTypeFilter((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  }

  return (
    <AppLayout title="Calendar" subtitle="Unified attendance, leaves & holidays">
      <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
        {/* Header controls */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="font-semibold min-w-[160px] text-center">
                {cursor.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
              </div>
              <Button variant="outline" size="icon"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="gap-1"
                onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}>
                <CalendarIcon className="h-4 w-4" /> Today
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && (
                <Select value={selectedEmp} onValueChange={setSelectedEmp}>
                  <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {me && <SelectItem value="me">My View</SelectItem>}
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Type filter chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            {(Object.keys(TYPE_LABELS) as CalendarEntryType[]).map((t) => {
              const on = typeFilter.has(t);
              return (
                <button key={t} type="button" onClick={() => toggleType(t)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-opacity ${on ? '' : 'opacity-40'}`}
                  style={{ borderColor: TYPE_COLORS[t], color: TYPE_COLORS[t] }}>
                  <span className="inline-block h-2 w-2 rounded-full mr-1 align-middle"
                    style={{ backgroundColor: TYPE_COLORS[t] }} />
                  {TYPE_LABELS[t]}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Calendar grid */}
        <Card className="p-3 overflow-x-auto">
          <div className="grid grid-cols-7 gap-1 min-w-[700px]">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
              <div key={d} className="text-xs font-medium text-muted-foreground text-center py-1">{d}</div>
            ))}
            {grid.map((cell, i) => {
              if (!cell.date) return <div key={`b${i}`} className="aspect-square" />;
              const dayNum = parseInt(cell.date.slice(8, 10), 10);
              const isToday = cell.date === ymd(today);
              return (
                <div key={cell.date}
                  className={`aspect-square rounded border p-1 flex flex-col text-[10px] overflow-hidden ${isToday ? 'border-primary border-2' : 'border-border'}`}>
                  <div className="font-medium text-foreground">{dayNum}</div>
                  <div className="flex flex-wrap gap-0.5 mt-0.5 overflow-hidden">
                    {cell.entries.slice(0, 4).map((e, idx) => (
                      <span key={idx}
                        title={`${e.employee_name} — ${e.label}`}
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: e.color }} />
                    ))}
                    {cell.entries.length > 4 && (
                      <span className="text-muted-foreground">+{cell.entries.length - 4}</span>
                    )}
                  </div>
                  {selectedEmp !== 'all' && cell.entries[0] && (
                    <div className="mt-auto truncate" style={{ color: cell.entries[0].color }}>
                      {cell.entries[0].label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-3"><div className="text-xs text-muted-foreground">Days Worked</div><div className="text-2xl font-semibold">{summary.working}</div></Card>
            <Card className="p-3"><div className="text-xs text-muted-foreground">Leaves Taken</div><div className="text-2xl font-semibold">{summary.leave}</div></Card>
            <Card className="p-3"><div className="text-xs text-muted-foreground">Holidays</div><div className="text-2xl font-semibold">{summary.holiday}</div></Card>
            <Card className="p-3"><div className="text-xs text-muted-foreground">Sunday Duties</div><div className="text-2xl font-semibold">{summary.sunday}</div></Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}