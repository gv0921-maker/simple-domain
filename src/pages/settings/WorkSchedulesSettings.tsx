import { useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navigate } from 'react-router-dom';
import { Pencil, Users, History } from 'lucide-react';
import { SETTINGS_NAV } from '@/lib/navigation/settings';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  useAllEmployeeSchedules, useEmployeeScheduleHistory,
  useSetEmployeeWorkSchedule, useBulkUpdateSchedules,
} from '@/hooks/hr/workSchedules';
import type { EmployeeWithSchedule, ScheduleTemplate } from '@/lib/services/hr/workSchedules';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DEFAULT_TEMPLATE: ScheduleTemplate = {
  work_start_time: '09:00:00',
  work_end_time: '18:00:00',
  total_work_hours: 8,
  break_minutes_allotted: 60,
  working_days: [1, 2, 3, 4, 5, 6],
  late_threshold_minutes: 15,
  notes: '',
};

const fmtTime = (t: string) => t?.slice(0, 5) ?? '';
const fmtDays = (days: number[]) =>
  (days ?? []).sort((a, b) => a - b).map((d) => DAYS[d]).join(', ') || '—';

export default function WorkSchedulesSettings() {
  const { user } = useAuth();
  const isSuperAdmin = (user as any)?.role === 'super_admin';

  const { data: rows = [], isLoading } = useAllEmployeeSchedules();

  const [editTarget, setEditTarget] = useState<EmployeeWithSchedule | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<EmployeeWithSchedule | null>(null);

  if (!isSuperAdmin) return <Navigate to="/" replace />;

  return (
    <AppLayout title="Work Schedules" subtitle="Per-employee working hours & break allotment" moduleNav={SETTINGS_NAV}>
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {rows.length} {rows.length === 1 ? 'employee' : 'employees'}
          </div>
          <Button onClick={() => setBulkOpen(true)} size="sm" className="gap-2">
            <Users className="h-4 w-4" /> Bulk Apply Schedule
          </Button>
        </div>

        <Card className="overflow-x-auto">
          <table className="w-full text-sm min-w-[860px]">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="p-3">Employee</th>
                <th className="p-3">Designation</th>
                <th className="p-3">Work Hours</th>
                <th className="p-3">Break</th>
                <th className="p-3">Late After</th>
                <th className="p-3">Working Days</th>
                <th className="p-3 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {!isLoading && rows.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No employees.</td></tr>
              )}
              {rows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="p-3 font-medium">{row.full_name}</td>
                  <td className="p-3 text-muted-foreground">{row.designation ?? '—'}</td>
                  <td className="p-3">
                    {row.schedule
                      ? `${fmtTime(row.schedule.work_start_time)} – ${fmtTime(row.schedule.work_end_time)} (${row.schedule.total_work_hours}h)`
                      : <Badge variant="outline">Not set</Badge>}
                  </td>
                  <td className="p-3">{row.schedule ? `${row.schedule.break_minutes_allotted} min` : '—'}</td>
                  <td className="p-3">{row.schedule ? `+${row.schedule.late_threshold_minutes} min` : '—'}</td>
                  <td className="p-3 text-xs">{row.schedule ? fmtDays(row.schedule.working_days) : '—'}</td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => setHistoryTarget(row)} title="Schedule history">
                      <History className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditTarget(row)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <EditScheduleDialog target={editTarget} onClose={() => setEditTarget(null)} />
      <BulkApplyDialog open={bulkOpen} onClose={() => setBulkOpen(false)} employees={rows} />
      <HistoryDialog target={historyTarget} onClose={() => setHistoryTarget(null)} />
    </AppLayout>
  );
}

// ---------- Edit ----------
function EditScheduleDialog({ target, onClose }: { target: EmployeeWithSchedule | null; onClose: () => void }) {
  const { toast } = useToast();
  const save = useSetEmployeeWorkSchedule();
  const [form, setForm] = useState<ScheduleTemplate>(DEFAULT_TEMPLATE);

  useMemo(() => {
    if (target) {
      const s = target.schedule;
      setForm(s ? {
        work_start_time: s.work_start_time,
        work_end_time: s.work_end_time,
        total_work_hours: Number(s.total_work_hours),
        break_minutes_allotted: s.break_minutes_allotted,
        working_days: s.working_days ?? DEFAULT_TEMPLATE.working_days,
        late_threshold_minutes: s.late_threshold_minutes,
        notes: s.notes ?? '',
      } : DEFAULT_TEMPLATE);
    }
  }, [target?.id]);

  if (!target) return null;

  const submit = async () => {
    try {
      await save.mutateAsync({ employeeId: target.id, schedule: form });
      toast({ title: 'Schedule updated' });
      onClose();
    } catch (e: any) {
      toast({ title: 'Failed to save', description: e?.message ?? String(e), variant: 'destructive' });
    }
  };

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Schedule — {target.full_name}</DialogTitle>
          <DialogDescription>Changes take effect from today; previous schedule is closed yesterday.</DialogDescription>
        </DialogHeader>
        <ScheduleFormFields form={form} setForm={setForm} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>Cancel</Button>
          <Button onClick={submit} disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save Schedule'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Bulk apply ----------
function BulkApplyDialog({ open, onClose, employees }: {
  open: boolean; onClose: () => void; employees: EmployeeWithSchedule[];
}) {
  const { toast } = useToast();
  const bulk = useBulkUpdateSchedules();
  const [form, setForm] = useState<ScheduleTemplate>(DEFAULT_TEMPLATE);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useMemo(() => { if (open) { setForm(DEFAULT_TEMPLATE); setSelected(new Set()); } }, [open]);

  const submit = async () => {
    if (selected.size === 0) {
      toast({ title: 'Select at least one employee', variant: 'destructive' }); return;
    }
    try {
      await bulk.mutateAsync({ employeeIds: Array.from(selected), template: form });
      toast({ title: `Schedule applied to ${selected.size} employee${selected.size === 1 ? '' : 's'}` });
      onClose();
    } catch (e: any) {
      toast({ title: 'Failed', description: e?.message ?? String(e), variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Apply Schedule</DialogTitle>
          <DialogDescription>Apply the same schedule template to multiple employees.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="template">
          <TabsList>
            <TabsTrigger value="template">Template</TabsTrigger>
            <TabsTrigger value="employees">Employees ({selected.size})</TabsTrigger>
          </TabsList>
          <TabsContent value="template" className="pt-4">
            <ScheduleFormFields form={form} setForm={setForm} />
          </TabsContent>
          <TabsContent value="employees" className="pt-4 max-h-80 overflow-y-auto space-y-1">
            <div className="flex justify-between items-center pb-2 border-b">
              <Label>Select all</Label>
              <Checkbox
                checked={selected.size === employees.length && employees.length > 0}
                onCheckedChange={(c) => setSelected(c ? new Set(employees.map((e) => e.id)) : new Set())}
              />
            </div>
            {employees.map((e) => (
              <label key={e.id} className="flex items-center justify-between py-1.5 cursor-pointer">
                <span className="text-sm">{e.full_name} <span className="text-muted-foreground">· {e.designation ?? '—'}</span></span>
                <Checkbox
                  checked={selected.has(e.id)}
                  onCheckedChange={(c) => {
                    const ns = new Set(selected);
                    if (c) ns.add(e.id); else ns.delete(e.id);
                    setSelected(ns);
                  }}
                />
              </label>
            ))}
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={bulk.isPending}>Cancel</Button>
          <Button onClick={submit} disabled={bulk.isPending}>
            {bulk.isPending ? 'Applying…' : `Apply to ${selected.size}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- History ----------
function HistoryDialog({ target, onClose }: { target: EmployeeWithSchedule | null; onClose: () => void }) {
  const { data: history = [], isLoading } = useEmployeeScheduleHistory(target?.id);
  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Schedule History — {target?.full_name}</DialogTitle>
        </DialogHeader>
        {isLoading ? <div className="p-4 text-muted-foreground text-sm">Loading…</div> : (
          history.length === 0 ? <div className="text-muted-foreground text-sm">No history.</div> : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {history.map((s) => (
                <Card key={s.id} className="p-3 text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{s.effective_from} → {s.effective_until ?? 'present'}</span>
                    {!s.effective_until && <Badge>Active</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {fmtTime(s.work_start_time)} – {fmtTime(s.work_end_time)} ({s.total_work_hours}h) ·
                    Break {s.break_minutes_allotted}m · Late +{s.late_threshold_minutes}m ·
                    Days {fmtDays(s.working_days)}
                  </div>
                  {s.notes && <div className="text-xs mt-1">{s.notes}</div>}
                </Card>
              ))}
            </div>
          )
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------- Shared form fields ----------
function ScheduleFormFields({ form, setForm }: {
  form: ScheduleTemplate; setForm: (f: ScheduleTemplate) => void;
}) {
  const toggleDay = (d: number) => {
    const days = new Set(form.working_days);
    if (days.has(d)) days.delete(d); else days.add(d);
    setForm({ ...form, working_days: Array.from(days).sort() });
  };
  const t = (s: string) => s.length === 5 ? `${s}:00` : s;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Work Start *</Label>
          <Input type="time" value={form.work_start_time.slice(0, 5)}
            onChange={(e) => setForm({ ...form, work_start_time: t(e.target.value) })} />
        </div>
        <div className="space-y-1">
          <Label>Work End *</Label>
          <Input type="time" value={form.work_end_time.slice(0, 5)}
            onChange={(e) => setForm({ ...form, work_end_time: t(e.target.value) })} />
        </div>
        <div className="space-y-1">
          <Label>Expected Hours / Day</Label>
          <Input type="number" step="0.5" min={0} value={form.total_work_hours}
            onChange={(e) => setForm({ ...form, total_work_hours: parseFloat(e.target.value) || 0 })} />
        </div>
        <div className="space-y-1">
          <Label>Break Allotment (min)</Label>
          <Input type="number" min={0} value={form.break_minutes_allotted}
            onChange={(e) => setForm({ ...form, break_minutes_allotted: parseInt(e.target.value) || 0 })} />
        </div>
        <div className="space-y-1 col-span-2">
          <Label>Late Threshold (min after start)</Label>
          <Input type="number" min={0} value={form.late_threshold_minutes}
            onChange={(e) => setForm({ ...form, late_threshold_minutes: parseInt(e.target.value) || 0 })} />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Working Days</Label>
        <div className="flex gap-1 flex-wrap">
          {DAYS.map((d, i) => (
            <Button
              key={d} type="button" size="sm"
              variant={form.working_days.includes(i) ? 'default' : 'outline'}
              onClick={() => toggleDay(i)}
            >{d}</Button>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        <Label>Notes</Label>
        <Textarea rows={2} value={form.notes ?? ''}
          onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="" />
      </div>
    </div>
  );
}