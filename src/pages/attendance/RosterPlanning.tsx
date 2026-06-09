import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HR_NAV } from '@/lib/navigation/hr';
import { useEmployees, useDepartments, useRosters, useUpsertRoster } from '@/hooks/hr';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TYPE_CYCLE = ['working', 'weekly_off', 'comp_off', 'training', 'holiday'] as const;
const COLORS: Record<string, string> = {
  working: 'bg-white',
  weekly_off: 'bg-blue-200',
  comp_off: 'bg-green-200',
  training: 'bg-purple-200',
  holiday: 'bg-red-200',
};
const LABELS: Record<string, string> = {
  working: 'W', weekly_off: 'WO', comp_off: 'CO', training: 'T', holiday: 'H',
};

export default function RosterPlanning() {
  const [cursor, setCursor] = useState(new Date());
  const [deptId, setDeptId] = useState('all');
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const from = first.toISOString().slice(0, 10);
  const to = last.toISOString().slice(0, 10);

  const { data: employees = [] } = useEmployees();
  const { data: depts = [] } = useDepartments();
  const { data: rosters = [] } = useRosters(from, to);
  const upsert = useUpsertRoster();

  const filtered = employees.filter((e) => deptId === 'all' || e.department_id === deptId);
  const days = Array.from({ length: last.getDate() }, (_, i) => i + 1);

  function get(empId: string, dt: string) {
    return rosters.find((r) => r.employee_id === empId && r.roster_date === dt);
  }
  function cycle(empId: string, dt: string) {
    const cur = get(empId, dt);
    const idx = TYPE_CYCLE.indexOf((cur?.roster_type ?? 'working') as typeof TYPE_CYCLE[number]);
    const next = TYPE_CYCLE[(idx + 1) % TYPE_CYCLE.length];
    upsert.mutate({ employee_id: empId, roster_date: dt, roster_type: next });
  }

  return (
    <AppLayout title="Roster Planning" moduleNav={HR_NAV}>
      <div className="p-6 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <div className="font-medium">{cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
            <Button size="icon" variant="outline" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <Select value={deptId} onValueChange={setDeptId}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {depts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="text-xs text-muted-foreground">Click a cell to cycle: Working → Weekly Off → Comp Off → Training → Holiday.</div>
        <Card className="overflow-x-auto">
          <table className="text-xs border-collapse w-max">
            <thead><tr>
              <th className="p-1 sticky left-0 bg-background text-left">Employee</th>
              {days.map((d) => <th key={d} className="p-1 w-7 text-center">{d}</th>)}
            </tr></thead>
            <tbody>
              {filtered.map((emp) => (
                <tr key={emp.id} className="border-t">
                  <td className="p-1 sticky left-0 bg-background font-medium whitespace-nowrap">{emp.full_name}</td>
                  {days.map((d) => {
                    const dt = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const r = get(emp.id, dt);
                    const t = (r?.roster_type ?? 'working') as keyof typeof COLORS;
                    return (
                      <td key={d} className={`p-1 text-center w-7 cursor-pointer border ${COLORS[t]}`}
                        onClick={() => cycle(emp.id, dt)}>{LABELS[t]}</td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </AppLayout>
  );
}