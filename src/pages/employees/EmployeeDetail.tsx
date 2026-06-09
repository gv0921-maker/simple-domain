import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit, FileText, Trash2, Users } from 'lucide-react';
import { HR_NAV } from '@/lib/navigation/hr';
import {
  useEmployee, useEmployees, useDepartments,
  useContractsByEmployee, useDeleteEmployee,
} from '@/hooks/hr';
import { toast } from '@/hooks/use-toast';

const fmtINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  on_leave: 'bg-amber-100 text-amber-700',
  terminated: 'bg-red-100 text-red-700',
  resigned: 'bg-slate-100 text-slate-700',
};

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: employee, isLoading } = useEmployee(id);
  const { data: allEmployees = [] } = useEmployees();
  const { data: departments = [] } = useDepartments();
  const { data: contracts = [] } = useContractsByEmployee(id);
  const deleteMut = useDeleteEmployee();

  const directReports = useMemo(
    () => allEmployees.filter((e) => e.reports_to === id),
    [allEmployees, id]
  );
  const manager = employee?.reports_to ? allEmployees.find((e) => e.id === employee.reports_to) : null;
  const dept = employee?.department_id ? departments.find((d) => d.id === employee.department_id) : null;

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm('Delete this employee? This will also delete their contracts.')) return;
    try {
      await deleteMut.mutateAsync(id);
      toast({ title: 'Employee deleted' });
      navigate('/employees/directory');
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e?.message, variant: 'destructive' });
    }
  };

  if (isLoading) return <AppLayout title="Employees" moduleNav={HR_NAV}><div className="p-6">Loading…</div></AppLayout>;
  if (!employee) return <AppLayout title="Employees" moduleNav={HR_NAV}><div className="p-6">Not found.</div></AppLayout>;

  return (
    <AppLayout title="Employees" subtitle={employee.full_name} moduleNav={HR_NAV}>
      <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/employees/directory')} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Directory
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => navigate(`/employees/${id}/edit`)}>
              <Edit className="h-4 w-4" /> Edit
            </Button>
            <Button variant="outline" className="gap-2 text-destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        </div>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              {employee.profile_photo_url && <AvatarImage src={employee.profile_photo_url} />}
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {employee.full_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold">{employee.full_name}</h1>
              <p className="text-muted-foreground">{employee.designation || '—'}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {dept && <Badge variant="outline" style={{ borderColor: dept.color, color: dept.color }}>{dept.name}</Badge>}
                <Badge className={STATUS_COLORS[employee.status] ?? ''} variant="outline">
                  {employee.status.replace('_', ' ')}
                </Badge>
                <Badge variant="secondary">{employee.employment_type}</Badge>
                <span className="text-xs text-muted-foreground self-center">{employee.employee_code}</span>
              </div>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="contracts">Contracts</TabsTrigger>
            <TabsTrigger value="reports">Reports / Reportees</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-4">
            <Card className="p-6 grid gap-4 md:grid-cols-2">
              <Info label="Email" value={employee.email} />
              <Info label="Work Phone" value={employee.phone} />
              <Info label="Personal Phone" value={employee.personal_phone} />
              <Info label="Date of Birth" value={employee.date_of_birth} />
              <Info label="Gender" value={employee.gender} />
              <Info label="Blood Group" value={employee.blood_group} />
              <Info label="Marital Status" value={employee.marital_status} />
              <Info label="Date of Joining" value={employee.date_of_joining} />
              <Info label="Work Location" value={employee.work_location} />
              <Info label="Address" value={employee.address} className="md:col-span-2" />
              <Info label="Emergency Contact" value={
                [employee.emergency_contact_name, employee.emergency_contact_phone].filter(Boolean).join(' · ') || null
              } className="md:col-span-2" />
              <Info label="PAN" value={employee.pan_number} />
              <Info label="Aadhaar" value={employee.aadhaar_number} />
              <Info label="Bank Account" value={employee.bank_account_number} />
              <Info label="Bank Name" value={employee.bank_name} />
              <Info label="IFSC" value={employee.ifsc_code} />
              <Info label="UAN" value={employee.uan_number} />
              <Info label="PF Number" value={employee.pf_number} />
              <Info label="ESI Number" value={employee.esi_number} />
              <Info label="Notes" value={employee.notes} className="md:col-span-2" />
            </Card>
          </TabsContent>

          <TabsContent value="contracts" className="mt-4">
            <Card className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Contracts</h2>
                <Button size="sm" className="gap-2" onClick={() => navigate(`/employees/contracts/new?employee=${id}`)}>
                  <FileText className="h-4 w-4" /> New Contract
                </Button>
              </div>
              {contracts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No contracts yet.</p>
              ) : (
                <div className="space-y-2">
                  {contracts.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-3 rounded-md border hover:bg-accent cursor-pointer"
                      onClick={() => navigate(`/employees/contracts/${c.id}`)}
                    >
                      <div>
                        <p className="font-medium">{c.contract_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.contract_type} · {c.start_date}{c.end_date ? ` → ${c.end_date}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{fmtINR(Number(c.gross_salary ?? 0))}</p>
                        <Badge variant="outline">{c.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="mt-4">
            <Card className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" /> Reports To
                </h3>
                {manager ? (
                  <div
                    className="p-3 rounded-md border cursor-pointer hover:bg-accent inline-block"
                    onClick={() => navigate(`/employees/${manager.id}`)}
                  >
                    <p className="font-medium">{manager.full_name}</p>
                    <p className="text-xs text-muted-foreground">{manager.designation}</p>
                  </div>
                ) : <p className="text-sm text-muted-foreground">No manager assigned.</p>}
              </div>
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" /> Direct Reports ({directReports.length})
                </h3>
                {directReports.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No direct reports.</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {directReports.map((r) => (
                      <div
                        key={r.id}
                        className="p-3 rounded-md border cursor-pointer hover:bg-accent"
                        onClick={() => navigate(`/employees/${r.id}`)}
                      >
                        <p className="font-medium">{r.full_name}</p>
                        <p className="text-xs text-muted-foreground">{r.designation}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function Info({ label, value, className }: { label: string; value: string | null | undefined; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground uppercase">{label}</p>
      <p className="text-sm mt-0.5">{value || '—'}</p>
    </div>
  );
}