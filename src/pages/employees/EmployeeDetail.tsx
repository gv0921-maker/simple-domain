import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ActivityChatter } from '@/components/shared/ActivityChatter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { ArrowLeft, Edit, FileText, Trash2, Users } from 'lucide-react';
import { ShareToChatButton } from '@/components/chat/ShareToChatDialog';
import { EMPLOYEES_NAV } from '@/lib/navigation/employees';
import {
  useEmployee, useEmployees, useDepartments,
  useContractsByEmployee, useDeleteEmployee,
} from '@/hooks/hr';
import { useRangeAttendance } from '@/hooks/hr';
import { useEmployeePayslips, useLoans, useAdvances } from '@/hooks/hr';
import { useAppraisalsForEmployee } from '@/hooks/hr';
import { Link } from 'react-router-dom';
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
  const [tab, setTab] = useState('profile');
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

  const ninetyDays = useMemo(() => {
    const end = new Date();
    const start = new Date(Date.now() - 90 * 86400_000);
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
  }, []);
  const { data: attendance = [] } = useRangeAttendance(id ? [id] : [], ninetyDays.start, ninetyDays.end);
  const { data: payslips = [] } = useEmployeePayslips(id);
  const { data: loans = [] } = useLoans(id);
  const { data: advances = [] } = useAdvances(id);
  const { data: empAppraisals = [] } = useAppraisalsForEmployee(id);
  const activeContract = contracts.find((c) => c.status === 'active') ?? contracts[0];
  const attStats = useMemo(() => {
    const work = attendance.filter((s) => s.session_type === 'work');
    const brk = attendance.filter((s) => s.session_type === 'break');
    const wm = work.reduce((a, s) => a + (s.duration_minutes ?? 0), 0);
    const bm = brk.reduce((a, s) => a + (s.duration_minutes ?? 0), 0);
    const days = new Set(work.map((s) => s.session_date)).size;
    return { workMin: wm, breakMin: bm, daysPresent: days, sessions: attendance.length };
  }, [attendance]);

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

  if (isLoading) return <AppLayout title="Employees" moduleNav={EMPLOYEES_NAV}><div className="p-6">Loading…</div></AppLayout>;
  if (!employee) return <AppLayout title="Employees" moduleNav={EMPLOYEES_NAV}><div className="p-6">Not found.</div></AppLayout>;

  return (
    <AppLayout title="Employees" subtitle={employee.full_name} moduleNav={EMPLOYEES_NAV}>
      <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/employees/directory')} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Directory
          </Button>
          <div className="flex gap-2">
            <ShareToChatButton resourceType="employee" resourceId={id!} resourceLabel={employee.full_name} />
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

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="hidden md:flex flex-wrap h-auto">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="contracts">Contracts</TabsTrigger>
            <TabsTrigger value="reports">Reports / Reportees</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
            <TabsTrigger value="appraisals">Appraisals</TabsTrigger>
          </TabsList>
          <div className="md:hidden mb-2">
            <Select value={tab} onValueChange={setTab}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="profile">Profile</SelectItem>
                <SelectItem value="contracts">Contracts</SelectItem>
                <SelectItem value="reports">Reports / Reportees</SelectItem>
                <SelectItem value="attendance">Attendance</SelectItem>
                <SelectItem value="payroll">Payroll</SelectItem>
                <SelectItem value="appraisals">Appraisals</SelectItem>
              </SelectContent>
            </Select>
          </div>

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

          <TabsContent value="attendance" className="mt-4">
            <Card className="p-6 grid gap-4 md:grid-cols-4">
              <Info label="Days Present (90d)" value={String(attStats.daysPresent)} />
              <Info label="Total Worked" value={`${Math.floor(attStats.workMin / 60)}h ${attStats.workMin % 60}m`} />
              <Info label="Total Break" value={`${Math.floor(attStats.breakMin / 60)}h ${attStats.breakMin % 60}m`} />
              <Info label="Sessions" value={String(attStats.sessions)} />
            </Card>
          </TabsContent>

          <TabsContent value="payroll" className="mt-4 space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Salary Breakup (Active Contract)</h3>
              {!activeContract ? (
                <p className="text-sm text-muted-foreground">No active contract.</p>
              ) : (
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <Info label="Basic" value={fmtINR(Number(activeContract.basic_salary || 0))} />
                  <Info label="HRA" value={fmtINR(Number(activeContract.hra || 0))} />
                  <Info label="DA" value={fmtINR(Number(activeContract.da || 0))} />
                  <Info label="Conveyance" value={fmtINR(Number(activeContract.conveyance_allowance || 0))} />
                  <Info label="Medical" value={fmtINR(Number(activeContract.medical_allowance || 0))} />
                  <Info label="Special" value={fmtINR(Number(activeContract.special_allowance || 0))} />
                  <Info label="Gross" value={fmtINR(Number(activeContract.gross_salary || 0))} />
                  <Info label="CTC" value={fmtINR(Number(activeContract.ctc || 0))} />
                </div>
              )}
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Last 6 Payslips</h3>
              {payslips.length === 0 ? <p className="text-sm text-muted-foreground">No payslips yet.</p> : (
                <div className="space-y-2">
                  {payslips.slice(0, 6).map((p: any) => (
                    <Link key={p.id} to={`/payroll/payslips/${p.id}`} className="flex justify-between p-2 rounded border hover:bg-accent">
                      <span>{p.payroll_periods?.period_label}</span>
                      <span className="font-medium">{fmtINR(Number(p.net_pay))}</span>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-6">
                <h3 className="font-semibold mb-3">Active Loans</h3>
                {loans.filter((l) => l.status === 'active').length === 0 ? <p className="text-sm text-muted-foreground">None.</p> : (
                  loans.filter((l) => l.status === 'active').map((l) => (
                    <div key={l.id} className="flex justify-between text-sm py-1">
                      <span>EMI {fmtINR(Number(l.monthly_emi))} · {l.paid_emis}/{l.total_emis}</span>
                      <span>Rem {fmtINR(Number(l.remaining_amount))}</span>
                    </div>
                  ))
                )}
              </Card>
              <Card className="p-6">
                <h3 className="font-semibold mb-3">Pending Advances</h3>
                {advances.filter((a) => a.status === 'pending').length === 0 ? <p className="text-sm text-muted-foreground">None.</p> : (
                  advances.filter((a) => a.status === 'pending').map((a) => (
                    <div key={a.id} className="flex justify-between text-sm py-1">
                      <span>{a.deduction_month}</span>
                      <span>{fmtINR(Number(a.remaining_amount))}</span>
                    </div>
                  ))
                )}
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="appraisals" className="mt-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Appraisal History</h3>
              {empAppraisals.length === 0 ? <p className="text-sm text-muted-foreground">No appraisals yet.</p> : (
                <div className="space-y-2">
                  {empAppraisals.map((a: any) => (
                    <Link key={a.id} to={`/appraisals/${a.id}`} className="flex justify-between p-3 rounded border hover:bg-accent">
                      <div>
                        <p className="font-medium">{a.appraisal_cycles?.name}</p>
                        <p className="text-xs text-muted-foreground">{a.status} · {a.appraisal_cycles?.period_start_date} → {a.appraisal_cycles?.period_end_date}</p>
                      </div>
                      <div className="text-right">
                        {a.final_overall_rating != null && <p className="font-medium">{a.final_overall_rating}</p>}
                        {a.recommendation && <p className="text-xs text-muted-foreground">{a.recommendation}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
        {id && <ActivityChatter recordType="employee" recordId={id} />}
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