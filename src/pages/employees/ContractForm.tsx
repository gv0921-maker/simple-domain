import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { HR_NAV } from '@/lib/navigation/hr';
import { useEmployees, useCreateContract } from '@/hooks/hr';
import type { ContractInsert } from '@/lib/services/hr/api';
import { toast } from '@/hooks/use-toast';

const fmtINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function ContractForm() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { data: employees = [] } = useEmployees();
  const createMut = useCreateContract();

  const [form, setForm] = useState<ContractInsert>({
    employee_id: '',
    contract_type: 'permanent',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: null,
    basic_salary: 0,
    hra: 0,
    da: 0,
    special_allowance: 0,
    conveyance_allowance: 0,
    medical_allowance: 0,
    ctc: 0,
    currency: 'INR',
    working_hours_per_day: 8,
    working_days_per_week: 6,
    status: 'draft',
  });

  useEffect(() => {
    const empId = params.get('employee');
    if (empId) setForm((p) => ({ ...p, employee_id: empId }));
  }, [params]);

  const set = <K extends keyof ContractInsert>(k: K, v: ContractInsert[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const num = (v: any) => Number(v ?? 0);
  const gross = useMemo(
    () => num(form.basic_salary) + num(form.hra) + num(form.da) +
      num(form.special_allowance) + num(form.conveyance_allowance) + num(form.medical_allowance),
    [form]
  );

  const handleSave = async () => {
    if (!form.employee_id) {
      toast({ title: 'Select an employee', variant: 'destructive' });
      return;
    }
    try {
      const created = await createMut.mutateAsync(form);
      toast({ title: 'Contract created' });
      navigate(`/employees/contracts/${created.id}`);
    } catch (e: any) {
      toast({ title: 'Create failed', description: e?.message, variant: 'destructive' });
    }
  };

  return (
    <AppLayout title="Employees" subtitle="New Contract" moduleNav={HR_NAV}>
      <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/employees/contracts')}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMut.isPending} className="gap-2">
              <Save className="h-4 w-4" /> Create
            </Button>
          </div>
        </div>

        <Card className="p-6 space-y-6">
          <h1 className="text-2xl font-semibold">New Contract</h1>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Employee *">
              <Select value={form.employee_id} onValueChange={(v) => set('employee_id', v)}>
                <SelectTrigger><SelectValue placeholder="" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Contract Type">
              <Select value={form.contract_type ?? 'permanent'} onValueChange={(v) => set('contract_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="probation">Probation</SelectItem>
                  <SelectItem value="temporary">Temporary</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                  <SelectItem value="intern">Intern</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Start Date *">
              <Input type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
            </Field>
            <Field label="End Date">
              <Input type="date" value={form.end_date ?? ''} onChange={(e) => set('end_date', e.target.value || null)} />
            </Field>
          </div>

          <div>
            <h2 className="font-semibold mb-3">Salary Components (Monthly)</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <NumField label="Basic" value={form.basic_salary} onChange={(v) => set('basic_salary', v)} />
              <NumField label="HRA" value={form.hra} onChange={(v) => set('hra', v)} />
              <NumField label="DA" value={form.da} onChange={(v) => set('da', v)} />
              <NumField label="Special Allowance" value={form.special_allowance} onChange={(v) => set('special_allowance', v)} />
              <NumField label="Conveyance" value={form.conveyance_allowance} onChange={(v) => set('conveyance_allowance', v)} />
              <NumField label="Medical" value={form.medical_allowance} onChange={(v) => set('medical_allowance', v)} />
            </div>
            <div className="mt-4 p-3 rounded-md bg-primary/5 flex justify-between">
              <span className="font-medium">Gross Salary (Monthly)</span>
              <span className="font-semibold text-primary">{fmtINR(gross)}</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <NumField label="CTC (Annual)" value={form.ctc} onChange={(v) => set('ctc', v)} />
            <NumField label="Working hrs / day" value={form.working_hours_per_day} onChange={(v) => set('working_hours_per_day', Math.round(v))} />
            <NumField label="Working days / week" value={form.working_days_per_week} onChange={(v) => set('working_days_per_week', Math.round(v))} />
            <NumField label="Probation (months)" value={form.probation_period_months ?? 0} onChange={(v) => set('probation_period_months', Math.round(v))} />
            <NumField label="Notice period (days)" value={form.notice_period_days ?? 0} onChange={(v) => set('notice_period_days', Math.round(v))} />
            <Field label="Status">
              <Select value={form.status ?? 'draft'} onValueChange={(v) => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: any; onChange: (n: number) => void }) {
  return (
    <Field label={label}>
      <Input type="number" value={value ?? 0} onChange={(e) => onChange(Number(e.target.value))} />
    </Field>
  );
}