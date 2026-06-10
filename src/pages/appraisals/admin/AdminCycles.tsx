import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { APPRAISALS_NAV } from '@/lib/navigation/appraisals';
import { useAppraisalCycles, useCreateAppraisalCycle, useDeleteAppraisalCycle } from '@/hooks/hr';
import { toast } from '@/hooks/use-toast';

const TYPES = ['quarterly','half_yearly','annual','probation','custom'] as const;

export default function AdminCycles() {
  const { data: cycles = [] } = useAppraisalCycles();
  const create = useCreateAppraisalCycle();
  const del = useDeleteAppraisalCycle();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', cycle_type: 'annual' as any, period_start_date: '', period_end_date: '' });

  const onCreate = async () => {
    if (!form.name || !form.period_start_date || !form.period_end_date) return;
    await create.mutateAsync(form);
    toast({ title: 'Cycle created' });
    setOpen(false);
    setForm({ name: '', cycle_type: 'annual', period_start_date: '', period_end_date: '' });
  };

  return (
    <AppLayout title="Appraisals" subtitle="Cycles" moduleNav={APPRAISALS_NAV}>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
        <div className="flex justify-between">
          <h2 className="text-lg font-semibold">Appraisal Cycles</h2>
          <Button onClick={() => setOpen(!open)}>{open ? 'Cancel' : 'New Cycle'}</Button>
        </div>
        {open && (
          <Card className="p-6 grid md:grid-cols-2 gap-3">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div>
              <Label>Type</Label>
              <Select value={form.cycle_type} onValueChange={(v) => setForm({ ...form, cycle_type: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Period Start</Label><Input type="date" value={form.period_start_date} onChange={(e) => setForm({ ...form, period_start_date: e.target.value })} /></div>
            <div><Label>Period End</Label><Input type="date" value={form.period_end_date} onChange={(e) => setForm({ ...form, period_end_date: e.target.value })} /></div>
            <div className="md:col-span-2 flex justify-end"><Button onClick={onCreate}>Create</Button></div>
          </Card>
        )}
        <div className="space-y-2">
          {cycles.map((c) => (
            <Card key={c.id} className="p-4 flex justify-between items-center">
              <Link to={`/appraisals/admin/cycles/${c.id}`} className="flex-1">
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.cycle_type} · {c.period_start_date} → {c.period_end_date}</p>
              </Link>
              <Badge variant="outline">{c.status}</Badge>
              <Button variant="ghost" size="sm" onClick={() => del.mutate(c.id)}>Delete</Button>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}