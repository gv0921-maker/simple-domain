import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HR_NAV } from '@/lib/navigation/hr';
import { useWorkedOnWeeklyOff, useEmployees, useRescheduleWeeklyOff, useGrantCompOff } from '@/hooks/hr';
import { toast } from 'sonner';

export default function RosterReschedule() {
  const today = new Date();
  const monthAgo = new Date(); monthAgo.setDate(today.getDate() - 30);
  const [from, setFrom] = useState(monthAgo.toISOString().slice(0, 10));
  const [to, setTo] = useState(today.toISOString().slice(0, 10));
  const { data: items = [] } = useWorkedOnWeeklyOff(from, to);
  const { data: employees = [] } = useEmployees();
  const reschedule = useRescheduleWeeklyOff();
  const grant = useGrantCompOff();
  const [newDates, setNewDates] = useState<Record<string, string>>({});

  return (
    <AppLayout title="Roster Reschedule" moduleNav={HR_NAV}>
      <div className="p-6 space-y-3">
        <div className="flex gap-2 items-end">
          <div><label className="text-xs">From</label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><label className="text-xs">To</label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        </div>
        <Card>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground"><tr>
              <th className="text-left p-3">Employee</th><th className="text-left p-3">Original Off</th>
              <th className="text-left p-3">New Off Date</th><th></th>
            </tr></thead>
            <tbody>
              {items.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No worked-on-weekly-off entries.</td></tr>}
              {items.map((it, i) => {
                const emp = employees.find((e) => e.id === it.employee_id);
                const key = `${it.employee_id}__${it.roster_date}`;
                return (
                  <tr key={i} className="border-t">
                    <td className="p-3">{emp?.full_name}</td>
                    <td className="p-3">{it.roster_date}</td>
                    <td className="p-3">
                      <Input type="date" className="h-8" value={newDates[key] ?? ''}
                        onChange={(e) => setNewDates({ ...newDates, [key]: e.target.value })} />
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <Button size="sm" onClick={async () => {
                        const nd = newDates[key]; if (!nd) { toast.error('Pick new date'); return; }
                        try { await reschedule.mutateAsync({ employeeId: it.employee_id, originalDate: it.roster_date, newDate: nd });
                          toast.success('Rescheduled'); } catch (e: any) { toast.error(e.message); }
                      }}>Reschedule</Button>
                      <Button size="sm" variant="outline" onClick={async () => {
                        try { await grant.mutateAsync({ employee_id: it.employee_id, work_date: it.roster_date }); toast.success('Comp off granted'); }
                        catch (e: any) { toast.error(e.message); }
                      }}>Grant Comp Off</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>
    </AppLayout>
  );
}