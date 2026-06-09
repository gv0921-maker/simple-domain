import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserPlus, Building2, Cake, Briefcase } from 'lucide-react';
import { HR_NAV } from '@/lib/navigation/hr';
import { useEmployees, useDepartments } from '@/hooks/hr';

const COLORS = ['#1D9E75', '#FF7043', '#1976D2', '#AD1457', '#F59E0B', '#00838F', '#616161'];

export default function EmployeesOverview() {
  const navigate = useNavigate();
  const { data: employees = [], isLoading } = useEmployees();
  const { data: departments = [] } = useDepartments();

  const stats = useMemo(() => {
    const active = employees.filter((e) => e.status === 'active').length;
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
    const joinedThisMonth = employees.filter((e) =>
      e.date_of_joining && new Date(e.date_of_joining) >= startOfMonth
    ).length;

    const today = new Date();
    const weekLater = new Date(); weekLater.setDate(today.getDate() + 7);
    const upcomingBirthdays = employees
      .filter((e) => e.date_of_birth)
      .map((e) => {
        const dob = new Date(e.date_of_birth!);
        const next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
        if (next < today) next.setFullYear(today.getFullYear() + 1);
        return { ...e, next };
      })
      .filter((e) => e.next <= weekLater)
      .sort((a, b) => a.next.getTime() - b.next.getTime());

    const byDept = new Map<string, number>();
    employees.forEach((e) => {
      const key = e.department_id ?? '__none';
      byDept.set(key, (byDept.get(key) ?? 0) + 1);
    });
    const deptBreakdown = Array.from(byDept.entries()).map(([id, count]) => ({
      id,
      name: id === '__none' ? 'Unassigned' : (departments.find((d) => d.id === id)?.name ?? '—'),
      count,
    })).sort((a, b) => b.count - a.count);

    const byType = new Map<string, number>();
    employees.forEach((e) => byType.set(e.employment_type, (byType.get(e.employment_type) ?? 0) + 1));

    return { active, joinedThisMonth, upcomingBirthdays, deptBreakdown, byType };
  }, [employees, departments]);

  const maxDeptCount = Math.max(1, ...stats.deptBreakdown.map((d) => d.count));

  return (
    <AppLayout title="Employees" subtitle="Overview" moduleNav={HR_NAV}>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">HR Overview</h1>
          <Button onClick={() => navigate('/employees/new')} className="gap-2">
            <UserPlus className="h-4 w-4" /> New Employee
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <KpiCard icon={Users} label="Total Employees" value={employees.length} />
              <KpiCard icon={Briefcase} label="Active" value={stats.active} />
              <KpiCard icon={UserPlus} label="Joined This Month" value={stats.joinedThisMonth} />
              <KpiCard icon={Cake} label="Birthdays This Week" value={stats.upcomingBirthdays.length} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold">By Department</h2>
                </div>
                <div className="space-y-3">
                  {stats.deptBreakdown.length === 0 && (
                    <p className="text-sm text-muted-foreground">No employees yet.</p>
                  )}
                  {stats.deptBreakdown.map((d, i) => (
                    <div key={d.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{d.name}</span>
                        <span className="font-medium">{d.count}</span>
                      </div>
                      <div className="h-2 bg-muted rounded">
                        <div
                          className="h-full rounded transition-all"
                          style={{
                            width: `${(d.count / maxDeptCount) * 100}%`,
                            background: COLORS[i % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold">By Employment Type</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {['permanent', 'temporary', 'contractor', 'intern'].map((t) => (
                    <div key={t} className="p-3 rounded-md bg-muted/50">
                      <p className="text-xs text-muted-foreground uppercase">{t}</p>
                      <p className="text-xl font-semibold">{stats.byType.get(t) ?? 0}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Cake className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Upcoming Birthdays</h2>
              </div>
              {stats.upcomingBirthdays.length === 0 ? (
                <p className="text-sm text-muted-foreground">No birthdays in the next 7 days.</p>
              ) : (
                <div className="space-y-2">
                  {stats.upcomingBirthdays.map((e) => (
                    <div key={e.id} className="flex justify-between text-sm">
                      <span>{e.full_name}</span>
                      <span className="text-muted-foreground">
                        {e.next.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}

function KpiCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
      </div>
    </Card>
  );
}