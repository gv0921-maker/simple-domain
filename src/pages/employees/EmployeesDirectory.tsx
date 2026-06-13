import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Search, UserPlus } from 'lucide-react';
import { EMPLOYEES_NAV } from '@/lib/navigation/employees';
import { useEmployees, useDepartments } from '@/hooks/hr';
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';
import { useEmployeeDirectoryRestricted, useTodayStatusMap } from '@/hooks/hr/employeesExt';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  on_leave: 'bg-amber-100 text-amber-700 border-amber-200',
  terminated: 'bg-red-100 text-red-700 border-red-200',
  resigned: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function EmployeesDirectory() {
  const navigate = useNavigate();
  const { isAdmin } = useIsSuperAdmin();

  if (!isAdmin) return <RestrictedDirectory />;

  const { data: employees = [], isLoading } = useEmployees();
  const { data: departments = [] } = useDepartments();
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return employees.filter((e) => {
      if (dept !== 'all' && e.department_id !== dept) return false;
      if (status !== 'all' && e.status !== status) return false;
      if (!s) return true;
      return (
        e.full_name?.toLowerCase().includes(s) ||
        e.email?.toLowerCase().includes(s) ||
        e.designation?.toLowerCase().includes(s) ||
        e.employee_code?.toLowerCase().includes(s)
      );
    });
  }, [employees, search, dept, status]);

  const deptById = useMemo(
    () => new Map(departments.map((d) => [d.id, d])),
    [departments]
  );

  return (
    <AppLayout title="Employees" subtitle="Directory" moduleNav={EMPLOYEES_NAV}>
      <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex flex-wrap gap-2 items-center flex-1">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9 w-72"
                placeholder=""
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={dept} onValueChange={setDept}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
                <SelectItem value="resigned">Resigned</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => navigate('/employees/new')} className="gap-2">
            <UserPlus className="h-4 w-4" /> New Employee
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">
            No employees match your filters.
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((e) => {
              const d = e.department_id ? deptById.get(e.department_id) : undefined;
              return (
                <Card
                  key={e.id}
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/employees/${e.id}`)}
                >
                  <div className="flex flex-col items-center text-center gap-2">
                    <Avatar className="h-16 w-16">
                      {e.profile_photo_url && <AvatarImage src={e.profile_photo_url} />}
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">
                        {(e.full_name || '?').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{e.full_name}</p>
                      <p className="text-xs text-muted-foreground">{e.designation || '—'}</p>
                    </div>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {d && (
                        <Badge variant="outline" style={{ borderColor: d.color, color: d.color }}>
                          {d.name}
                        </Badge>
                      )}
                      <Badge className={STATUS_COLORS[e.status] ?? ''} variant="outline">
                        {e.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{e.employee_code}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function fmtJoin(d: string | null) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
}
function fmtBday(d: string | null) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long' }); }
  catch { return d; }
}

function RestrictedDirectory() {
  const navigate = useNavigate();
  const { data: emps = [], isLoading } = useEmployeeDirectoryRestricted();
  const ids = useMemo(() => emps.map((e) => e.id), [emps]);
  const { data: statusMap } = useTodayStatusMap(ids);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return emps;
    return emps.filter((e) =>
      e.full_name?.toLowerCase().includes(s) ||
      e.designation?.toLowerCase().includes(s),
    );
  }, [emps, search]);

  return (
    <AppLayout title="Employees" subtitle="Directory" moduleNav={EMPLOYEES_NAV}>
      <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
        <div className="flex justify-between items-center gap-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9 w-72" placeholder=""
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button variant="outline" onClick={() => navigate('/employees/org-chart')}>Org Chart</Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">No employees.</Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((e) => {
              const status = statusMap?.get(e.id) ?? 'off';
              const statusColor = status === 'present'
                ? 'bg-emerald-100 text-emerald-700'
                : status === 'on_leave' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700';
              const statusLabel = status === 'present' ? 'Present today' : status === 'on_leave' ? 'On Leave today' : 'Off today';
              return (
                <Card key={e.id} className="p-4">
                  <div className="flex flex-col items-center text-center gap-2">
                    <Avatar className="h-16 w-16">
                      {e.profile_photo_url && <AvatarImage src={e.profile_photo_url} />}
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">
                        {(e.full_name || '?').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{e.full_name}</p>
                      <p className="text-xs text-muted-foreground">{e.designation || '—'}</p>
                    </div>
                    <Badge variant="outline" className={statusColor}>{statusLabel}</Badge>
                    <div className="text-[11px] text-muted-foreground space-y-0.5 mt-1">
                      <div>Joined: {fmtJoin(e.date_of_joining)}</div>
                      <div>Birthday: {fmtBday(e.date_of_birth)}</div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}