import { useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useEmployees, useSundayRosters } from '@/hooks/hr';
import { useCurrentEmployee } from '@/hooks/hr/useCurrentEmployee';
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function monthBounds(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
    days: end.getDate(),
    startDow: start.getDay(),
  };
}

export default function WorkSchedulePage() {
  const { isAdmin } = useIsSuperAdmin();
  const { data: me } = useCurrentEmployee();
  const { data: employees = [] } = useEmployees();
  const [cursor, setCursor] = useState(new Date());
  const [empFilter, setEmpFilter] = useState<string>('me');

  const bounds = useMemo(() => monthBounds(cursor), [cursor]);
  const employeeIds = useMemo(() => {
    if (empFilter === 'all') return undefined;
    if (empFilter === 'me') return me?.id ? [me.id] : undefined;
    return [empFilter];
  }, [empFilter, me?.id]);

  const { data: rosters = [] } = useSundayRosters(bounds.from, bounds.to, employeeIds);

  const byDate = useMemo(() => {
    const m: Record<string, typeof rosters> = {};
    for (const r of rosters) {
      (m[r.roster_date] ??= [] as any).push(r);
    }
    return m;
  }, [rosters]);

  function shift(delta: number) {
    const d = new Date(cursor); d.setMonth(d.getMonth() + delta); setCursor(d);
  }

  const cells: Array<{ key: string; date?: string; dow: number }> = [];
  for (let i = 0; i < bounds.startDow; i++) cells.push({ key: `b${i}`, dow: i });
  for (let day = 1; day <= bounds.days; day++) {
    const dateStr = new Date(cursor.getFullYear(), cursor.getMonth(), day).toISOString().slice(0, 10);
    cells.push({ key: dateStr, date: dateStr, dow: new Date(dateStr).getDay() });
  }

  return (
    <AppLayout title="Work Schedule">
      <div className="p-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => shift(-1)}><ChevronLeft className="h-4 w-4" /></Button>
            <div className="font-medium min-w-[140px] text-center">
              {cursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </div>
            <Button size="sm" variant="outline" onClick={() => shift(1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="flex items-center gap-2">
            <Select value={empFilter} onValueChange={setEmpFilter}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="me">My schedule</SelectItem>
                {isAdmin && <SelectItem value="all">All employees</SelectItem>}
                {isAdmin && employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isAdmin && (
              <Button asChild size="sm"><Link to="/work-schedule/admin">Admin</Link></Button>
            )}
          </div>
        </div>

        <Card className="p-3">
          <div className="grid grid-cols-7 gap-1 text-xs text-muted-foreground font-medium mb-1">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => <div key={d} className="p-1 text-center">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((c) => {
              if (!c.date) return <div key={c.key} className="min-h-[72px]" />;
              const day = new Date(c.date).getDate();
              const rows = byDate[c.date] ?? [];
              const isSunday = c.dow === 0;
              return (
                <div key={c.key} className={`min-h-[72px] rounded border p-1 text-xs ${isSunday ? 'bg-muted/40' : ''}`}>
                  <div className="font-medium mb-1">{day}</div>
                  {rows.map((r: any) => {
                    const emp = employees.find((e) => e.id === r.employee_id);
                    const label = emp?.full_name?.split(' ')[0] ?? '';
                    if (r.is_sunday_duty) return (
                      <Badge key={r.id} className="bg-amber-100 text-amber-800 font-normal text-[10px] mr-1 mb-0.5">
                        {label} duty
                      </Badge>
                    );
                    if (r.roster_type === 'comp_off') return (
                      <Badge key={r.id} className="bg-emerald-100 text-emerald-800 font-normal text-[10px] mr-1 mb-0.5">
                        {label} comp-off
                      </Badge>
                    );
                    if (r.roster_type === 'weekly_off') return (
                      <Badge key={r.id} variant="secondary" className="font-normal text-[10px] mr-1 mb-0.5">
                        {label} off
                      </Badge>
                    );
                    return null;
                  })}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}