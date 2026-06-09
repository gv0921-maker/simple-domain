import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HR_NAV } from '@/lib/navigation/hr';
import { useEmployees, useSchedules, useUpsertSchedule } from '@/hooks/hr';
import { toast } from '@/hooks/use-toast';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export default function WorkSchedulesPage() {
  const { data: employees = [] } = useEmployees();
  const [empId, setEmpId] = useState<string>('');
  useEffect(() => { if (!empId && employees[0]) setEmpId(employees[0].id); }, [employees, empId]);
  const { data: schedules = [] } = useSchedules(empId || undefined);
  const upsert = useUpsertSchedule();

  const map = useMemo(() => {
    const m: Record<number, typeof schedules[number]> = {} as any;
    for (const s of schedules) m[s.day_of_week] = s;
    return m;
  }, [schedules]);

  async function patch(dow: number, fields: any) {
    if (!empId) return;
    const existing = map[dow];
    try {
      await upsert.mutateAsync({
        employee_id: empId,
        day_of_week: dow,
        start_time: existing?.start_time ?? '09:00',
        end_time: existing?.end_time ?? '18:00',
        break_duration_minutes: existing?.break_duration_minutes ?? 60,
        is_working_day: existing?.is_working_day ?? true,
        ...fields,
      });
    } catch (e: any) { toast({ title: 'Failed', description: e?.message, variant: 'destructive' }); }
  }

  return (
    <AppLayout title="Attendance" subtitle="Work Schedules" moduleNav={HR_NAV}>
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
        <Card className="p-4">
          <Label>Employee</Label>
          <Select value={empId} onValueChange={setEmpId}>
            <SelectTrigger><SelectValue placeholder="" /></SelectTrigger>
            <SelectContent>
              {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Card>
        <Card>
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left p-2">Day</th>
                <th className="p-2">Working</th>
                <th className="p-2">Start</th>
                <th className="p-2">End</th>
                <th className="p-2">Break (min)</th>
              </tr>
            </thead>
            <tbody>
              {DAYS.map((label, dow) => {
                const s = map[dow];
                return (
                  <tr key={dow} className="border-t">
                    <td className="p-2">{label}</td>
                    <td className="p-2 text-center">
                      <Switch checked={s?.is_working_day ?? false} onCheckedChange={(v) => patch(dow, { is_working_day: v })} />
                    </td>
                    <td className="p-2"><Input type="time" value={s?.start_time?.slice(0,5) ?? '09:00'} onChange={(e) => patch(dow, { start_time: e.target.value })} /></td>
                    <td className="p-2"><Input type="time" value={s?.end_time?.slice(0,5) ?? '18:00'} onChange={(e) => patch(dow, { end_time: e.target.value })} /></td>
                    <td className="p-2"><Input type="number" value={s?.break_duration_minutes ?? 60} onChange={(e) => patch(dow, { break_duration_minutes: Number(e.target.value) })} /></td>
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