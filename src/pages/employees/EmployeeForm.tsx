import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { EMPLOYEES_NAV } from '@/lib/navigation/employees';
import {
  useDepartments, useEmployee, useEmployees, useCreateEmployee, useUpdateEmployee,
} from '@/hooks/hr';
import { toast } from '@/hooks/use-toast';
import type { EmployeeInsert } from '@/lib/services/hr/api';

const emptyForm: EmployeeInsert = {
  full_name: '',
  display_name: null,
  email: null,
  phone: null,
  personal_phone: null,
  date_of_birth: null,
  gender: null,
  blood_group: null,
  marital_status: null,
  address: null,
  emergency_contact_name: null,
  emergency_contact_phone: null,
  profile_photo_url: null,
  department_id: null,
  designation: null,
  employment_type: 'permanent',
  date_of_joining: null,
  status: 'active',
  reports_to: null,
  work_location: null,
  pan_number: null,
  aadhaar_number: null,
  bank_account_number: null,
  bank_name: null,
  ifsc_code: null,
  pf_number: null,
  esi_number: null,
  uan_number: null,
  notes: null,
};

export default function EmployeeForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data: existing } = useEmployee(id);
  const { data: departments = [] } = useDepartments();
  const { data: employees = [] } = useEmployees();
  const createMut = useCreateEmployee();
  const updateMut = useUpdateEmployee();

  const [form, setForm] = useState<EmployeeInsert>(emptyForm);

  useEffect(() => {
    if (isEdit && existing) {
      const { id: _i, employee_code: _c, created_at: _a, updated_at: _u, ...rest } = existing;
      setForm({ ...emptyForm, ...rest });
    }
  }, [isEdit, existing]);

  const set = <K extends keyof EmployeeInsert>(k: K, v: EmployeeInsert[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.full_name?.trim()) {
      toast({ title: 'Full name is required', variant: 'destructive' });
      return;
    }
    try {
      if (isEdit && id) {
        await updateMut.mutateAsync({ id, patch: form });
        toast({ title: 'Employee updated' });
      } else {
        const created = await createMut.mutateAsync(form);
        toast({ title: 'Employee created' });
        navigate(`/employees/${created.id}`);
        return;
      }
      navigate(`/employees/${id}`);
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message ?? String(e), variant: 'destructive' });
    }
  };

  return (
    <AppLayout title="Employees" subtitle={isEdit ? 'Edit' : 'New'} moduleNav={EMPLOYEES_NAV}>
      <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/employees/directory')}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending} className="gap-2">
              <Save className="h-4 w-4" /> {isEdit ? 'Save' : 'Create'}
            </Button>
          </div>
        </div>

        <Card className="p-6">
          <h1 className="text-2xl font-semibold mb-1">{isEdit ? existing?.full_name : 'New Employee'}</h1>
          {isEdit && existing?.employee_code && (
            <p className="text-xs text-muted-foreground mb-4">{existing.employee_code}</p>
          )}

          <Tabs defaultValue="personal">
            <TabsList className="grid grid-cols-4 max-w-2xl">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="work">Work</TabsTrigger>
              <TabsTrigger value="address">Address & Contact</TabsTrigger>
              <TabsTrigger value="identity">Identity & Bank</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Full Name *">
                <Input value={form.full_name ?? ''} onChange={(e) => set('full_name', e.target.value)} />
              </Field>
              <Field label="Display Name">
                <Input value={form.display_name ?? ''} onChange={(e) => set('display_name', e.target.value || null)} />
              </Field>
              <Field label="Date of Birth">
                <Input type="date" value={form.date_of_birth ?? ''} onChange={(e) => set('date_of_birth', e.target.value || null)} />
              </Field>
              <Field label="Gender">
                <Select value={form.gender ?? ''} onValueChange={(v) => set('gender', v || null)}>
                  <SelectTrigger><SelectValue placeholder="" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Blood Group">
                <Input value={form.blood_group ?? ''} onChange={(e) => set('blood_group', e.target.value || null)} />
              </Field>
              <Field label="Marital Status">
                <Select value={form.marital_status ?? ''} onValueChange={(v) => set('marital_status', v || null)}>
                  <SelectTrigger><SelectValue placeholder="" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Profile Photo URL" className="md:col-span-2">
                <Input value={form.profile_photo_url ?? ''} onChange={(e) => set('profile_photo_url', e.target.value || null)} />
              </Field>
            </TabsContent>

            <TabsContent value="work" className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Designation">
                <Input value={form.designation ?? ''} onChange={(e) => set('designation', e.target.value || null)} />
              </Field>
              <Field label="Department">
                <Select value={form.department_id ?? ''} onValueChange={(v) => set('department_id', v || null)}>
                  <SelectTrigger><SelectValue placeholder="" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Employment Type">
                <Select value={form.employment_type ?? 'permanent'} onValueChange={(v) => set('employment_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="permanent">Permanent</SelectItem>
                    <SelectItem value="temporary">Temporary</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                    <SelectItem value="intern">Intern</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Status">
                <Select value={form.status ?? 'active'} onValueChange={(v) => set('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                    <SelectItem value="resigned">Resigned</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Date of Joining">
                <Input type="date" value={form.date_of_joining ?? ''} onChange={(e) => set('date_of_joining', e.target.value || null)} />
              </Field>
              <Field label="Work Location">
                <Input value={form.work_location ?? ''} onChange={(e) => set('work_location', e.target.value || null)} />
              </Field>
              <Field label="Reports To">
                <Select value={form.reports_to ?? ''} onValueChange={(v) => set('reports_to', v || null)}>
                  <SelectTrigger><SelectValue placeholder="" /></SelectTrigger>
                  <SelectContent>
                    {employees.filter((e) => e.id !== id).map((e) =>
                      <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Date of Exit">
                <Input type="date" value={form.date_of_exit ?? ''} onChange={(e) => set('date_of_exit', e.target.value || null)} />
              </Field>
              <Field label="Exit Reason" className="md:col-span-2">
                <Textarea value={form.exit_reason ?? ''} onChange={(e) => set('exit_reason', e.target.value || null)} />
              </Field>
            </TabsContent>

            <TabsContent value="address" className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Email">
                <Input type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value || null)} />
              </Field>
              <Field label="Work Phone">
                <Input value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value || null)} />
              </Field>
              <Field label="Personal Phone">
                <Input value={form.personal_phone ?? ''} onChange={(e) => set('personal_phone', e.target.value || null)} />
              </Field>
              <div />
              <Field label="Address" className="md:col-span-2">
                <Textarea value={form.address ?? ''} onChange={(e) => set('address', e.target.value || null)} />
              </Field>
              <Field label="Emergency Contact Name">
                <Input value={form.emergency_contact_name ?? ''} onChange={(e) => set('emergency_contact_name', e.target.value || null)} />
              </Field>
              <Field label="Emergency Contact Phone">
                <Input value={form.emergency_contact_phone ?? ''} onChange={(e) => set('emergency_contact_phone', e.target.value || null)} />
              </Field>
            </TabsContent>

            <TabsContent value="identity" className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="PAN Number">
                <Input value={form.pan_number ?? ''} onChange={(e) => set('pan_number', e.target.value || null)} />
              </Field>
              <Field label="Aadhaar Number">
                <Input value={form.aadhaar_number ?? ''} onChange={(e) => set('aadhaar_number', e.target.value || null)} />
              </Field>
              <Field label="Bank Account Number">
                <Input value={form.bank_account_number ?? ''} onChange={(e) => set('bank_account_number', e.target.value || null)} />
              </Field>
              <Field label="Bank Name">
                <Input value={form.bank_name ?? ''} onChange={(e) => set('bank_name', e.target.value || null)} />
              </Field>
              <Field label="IFSC Code">
                <Input value={form.ifsc_code ?? ''} onChange={(e) => set('ifsc_code', e.target.value || null)} />
              </Field>
              <Field label="PF Number">
                <Input value={form.pf_number ?? ''} onChange={(e) => set('pf_number', e.target.value || null)} />
              </Field>
              <Field label="ESI Number">
                <Input value={form.esi_number ?? ''} onChange={(e) => set('esi_number', e.target.value || null)} />
              </Field>
              <Field label="UAN Number">
                <Input value={form.uan_number ?? ''} onChange={(e) => set('uan_number', e.target.value || null)} />
              </Field>
              <Field label="Notes" className="md:col-span-2">
                <Textarea value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value || null)} />
              </Field>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </AppLayout>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}