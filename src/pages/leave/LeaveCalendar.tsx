import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LEAVE_NAV } from '@/lib/navigation/leave';
import { useLeaveRequests, useEmployees, useRosters } from '@/hooks/hr';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function LeaveCalendar() {
  const [cursor, setCursor] = useState(new Date());
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const fromStr = first.toISOString().slice(0, 10);
  const toStr = last.toISOString().slice(0, 10);
  const { data: requests = [] } = useLeaveRequests({ from: fromStr, to: toStr });
  const { data: employees = [] } = useEmployees();
  const { data: rosters = [] } = useRosters(fromStr, toStr);

  const days = Array.from({ length: last.getDate() }, (_, i) => i + 1);

  return (
    <AppLayout title="Leave Calendar" moduleNav={LEAVE_NAV}>
      <div className="p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <div className="font-medium">{cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
          <Button size="icon" variant="outline" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <Card className="overflow-x-auto">
          <table className="text-xs border-collapse w-max">
            <thead><tr><th className="p-1 text-left sticky left-0 bg-background">Employee</th>
              {days.map((d) => <th key={d} className="p-1 w-6 text-center">{d}</th>)}</tr></thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-t">
                  <td className="p-1 sticky left-0 bg-background font-medium whitespace-nowrap">{emp.full_name}</td>
                  {days.map((d) => {
                    const dt = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const onLeave = requests.find((r) => r.employee_id === emp.id && r.start_date <= dt && r.end_date >= dt && r.status === 'approved');
                    const off = rosters.find((r) => r.employee_id === emp.id && r.roster_date === dt && r.roster_type === 'weekly_off');
                    const bg = onLeave ? 'bg-yellow-200' : off ? 'bg-blue-200' : '';
                    return <td key={d} className={`p-1 text-center w-6 ${bg}`}>{onLeave ? 'L' : off ? 'O' : ''}</td>;
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