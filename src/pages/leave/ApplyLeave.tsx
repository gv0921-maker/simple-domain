import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { HR_NAV } from '@/lib/navigation/hr';
import { useCurrentEmployee } from '@/hooks/hr/useCurrentEmployee';
import { useLeaveTypes, useSubmitLeave, useEmployeeLeaveBalance } from '@/hooks/hr';
import { calculateLeaveDays } from '@/lib/services/hr/leaves';
import { toast } from 'sonner';

export default function ApplyLeave() {
  const navigate = useNavigate();
  const { data: employee } = useCurrentEmployee();
  const { data: types = [] } = useLeaveTypes();
  const year = new Date().getFullYear();
  const { data: balances = [] } = useEmployeeLeaveBalance(employee?.id, year);
  const submit = useSubmitLeave();

  const [form, setForm] = useState({
    leave_type_id: '', start_date: '', end_date: '',
    is_half_day: false, half_day_session: 'first_half' as 'first_half' | 'second_half',
    reason: '', contact_during_leave: '',
  });
  const [calc, setCalc] = useState<{ totalDays: number; excludedDates: string[] }>({ totalDays: 0, excludedDates: [] });

  useEffect(() => {
    let cancelled = false;
    if (!employee?.id || !form.start_date || !form.end_date) {
      setCalc({ totalDays: 0, excludedDates: [] }); return;
    }
    calculateLeaveDays(employee.id, form.start_date, form.end_date, form.is_half_day)
      .then((r) => { if (!cancelled) setCalc({ totalDays: r.totalDays, excludedDates: r.excludedDates }); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [employee?.id, form.start_date, form.end_date, form.is_half_day]);

  const balance = useMemo(
    () => balances.find((b) => b.leave_type.id === form.leave_type_id),
    [balances, form.leave_type_id],
  );

  async function handleSubmit() {
    if (!employee?.id) { toast.error('No employee profile linked'); return; }
    if (!form.leave_type_id || !form.start_date || !form.end_date) {
      toast.error('Pick a leave type and dates'); return;
    }
    try {
      await submit.mutateAsync({
        employee_id: employee.id,
        leave_type_id: form.leave_type_id,
        start_date: form.start_date,
        end_date: form.end_date,
        is_half_day: form.is_half_day,
        half_day_session: form.is_half_day ? form.half_day_session : null,
        reason: form.reason,
        contact_during_leave: form.contact_during_leave,
      });
      toast.success('Leave request submitted');
      navigate('/leave/my-leaves');
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to submit');
    }
  }

  return (
    <AppLayout title="Apply Leave" moduleNav={HR_NAV}>
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Card className="p-6 space-y-4">
          <div>
            <Label>Leave Type</Label>
            <Select value={form.leave_type_id} onValueChange={(v) => setForm({ ...form, leave_type_id: v })}>
              <SelectTrigger><SelectValue placeholder="" /></SelectTrigger>
              <SelectContent>
                {types.map((t) => <SelectItem key={t.id} value={t.id}>{t.name} ({t.code})</SelectItem>)}
              </SelectContent>
            </Select>
            {balance && (
              <p className="text-xs text-muted-foreground mt-1">
                Available: {balance.available} / Allocated: {balance.allocated}
                {balance.entitlement && ' (custom entitlement)'}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Start Date</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
            <div><Label>End Date</Label>
              <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={form.is_half_day} onCheckedChange={(c) => setForm({ ...form, is_half_day: !!c })} id="hd" />
            <Label htmlFor="hd">Half Day</Label>
            {form.is_half_day && (
              <Select value={form.half_day_session} onValueChange={(v: any) => setForm({ ...form, half_day_session: v })}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="first_half">First Half</SelectItem>
                  <SelectItem value="second_half">Second Half</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="rounded-md bg-muted/40 p-3 text-sm">
            <div><b>Calculated Working Days:</b> {calc.totalDays}</div>
            {calc.excludedDates.length > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                Excluded (holiday / weekly off): {calc.excludedDates.join(', ')}
              </div>
            )}
          </div>
          <div><Label>Reason</Label>
            <Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
          <div><Label>Contact During Leave</Label>
            <Input value={form.contact_during_leave} onChange={(e) => setForm({ ...form, contact_during_leave: e.target.value })} /></div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submit.isPending}>Submit Request</Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}