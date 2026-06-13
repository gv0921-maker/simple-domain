import { Users, UserMinus, ClipboardList, CalendarCheck, Plus, Cake, FileText, Clock, AlertTriangle } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from './_shared';
import { StatCard } from '@/components/dashboard/StatCard';
import { MiniRanking } from '@/components/dashboard/MiniRanking';
import { QuickActionGrid } from '@/components/dashboard/QuickActionGrid';
import { useHRManagerMetrics, useDashboardRole } from '@/hooks/dashboard';
import { useEmployees, useRangeAttendance } from '@/hooks/hr';
import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';

export default function HRDashboard() {
  const { data: role } = useDashboardRole();
  const { data, isLoading } = useHRManagerMetrics();
  const { data: employees = [] } = useEmployees();
  const { isAdmin: isSuperAdmin } = useIsSuperAdmin();
  const today = new Date().toISOString().slice(0, 10);
  const { data: todaySessions = [] } = useRangeAttendance(employees.map((e) => e.id), today, today);

  const att = useMemo(() => {
    const presentIds = new Set<string>();
    const lateAlerts: Array<{ id: string; name: string; mins: number }> = [];
    const otAlerts: Array<{ id: string; name: string; mins: number }> = [];
    const empMap = new Map(employees.map((e) => [e.id, e]));
    let lateCount = 0, otCount = 0;
    const seenLate = new Set<string>();
    const seenOt = new Set<string>();
    for (const s of todaySessions as any[]) {
      presentIds.add(s.employee_id);
      if ((s.late_arrival_minutes ?? 0) > 0 && !seenLate.has(s.employee_id)) {
        lateCount++; seenLate.add(s.employee_id);
        const e = empMap.get(s.employee_id);
        if (e) lateAlerts.push({ id: e.id, name: e.full_name, mins: s.late_arrival_minutes });
      }
      if ((s.overtime_minutes ?? 0) > 0 && !seenOt.has(s.employee_id)) {
        otCount++; seenOt.add(s.employee_id);
        const e = empMap.get(s.employee_id);
        if (e) otAlerts.push({ id: e.id, name: e.full_name, mins: s.overtime_minutes });
      }
    }
    return {
      present: presentIds.size,
      absent: Math.max(0, employees.length - presentIds.size - (data?.onLeaveToday ?? 0)),
      late: lateCount,
      ot: otCount,
      lateAlerts: lateAlerts.slice(0, 5),
      otAlerts: otAlerts.slice(0, 5),
    };
  }, [todaySessions, employees, data?.onLeaveToday]);

  if (role && !['super_admin','admin','hr_manager'].includes(role)) {
    return <Navigate to="/dashboards" replace />;
  }

  return (
    <DashboardLayout title="HR Dashboard">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Active Employees" value={data?.activeEmployees ?? '—'} icon={Users} loading={isLoading} viewHref="/employees/directory" />
        <StatCard title="On Leave Today" value={data?.onLeaveToday ?? '—'} icon={UserMinus} loading={isLoading} viewHref="/employees/leave" />
        <StatCard title="Pending Leaves" value={data?.pendingLeaveApprovals ?? '—'} icon={ClipboardList} loading={isLoading} viewHref="/leave/admin/requests" />
        <StatCard title="Attendance Today" value={data?.attendanceToday ?? '—'} icon={CalendarCheck} loading={isLoading} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Present Today" value={att.present} icon={CalendarCheck} viewHref="/attendance/admin" />
        <StatCard title="Absent Today" value={att.absent} icon={UserMinus} viewHref="/attendance/admin" />
        <StatCard title="Late Today" value={att.late} icon={Clock} viewHref="/attendance/admin" />
        <StatCard title="Overtime Today" value={att.ot} icon={AlertTriangle} viewHref="/attendance/admin" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Clock className="h-4 w-4" /> Late Arrivals Today</h3>
          {att.lateAlerts.length === 0 ? (
            <p className="text-xs text-muted-foreground">No late arrivals.</p>
          ) : (
            <ul className="space-y-1.5">
              {att.lateAlerts.map((a) => (
                <li key={a.id} className="flex justify-between text-sm">
                  <span>{a.name}</span>
                  <Badge variant="destructive" className="font-normal">+{a.mins}m late</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Overtime Today</h3>
          {att.otAlerts.length === 0 ? (
            <p className="text-xs text-muted-foreground">No overtime recorded.</p>
          ) : (
            <ul className="space-y-1.5">
              {att.otAlerts.map((a) => (
                <li key={a.id} className="flex justify-between text-sm">
                  <span>{a.name}</span>
                  <Badge className="font-normal bg-emerald-100 text-emerald-700" variant="outline">+{a.mins}m OT</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MiniRanking
          title="Upcoming Birthdays"
          items={(data?.upcomingBirthdays ?? []).map((b) => ({ id: b.id, label: b.label, subtitle: b.subtitle, value: b.value }))}
        />
        <MiniRanking
          title="Expiring Contracts (30 days)"
          items={(data?.expiringContracts ?? []).map((c) => ({ id: c.id, label: c.label, value: c.value }))}
        />
      </div>

      {isSuperAdmin && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard title="Pending Appraisals" value={data?.pendingAppraisals ?? '—'} icon={FileText} loading={isLoading} viewHref="/appraisals" />
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold mb-3">Quick Actions</h3>
        <QuickActionGrid actions={[
          { label: 'Add Employee', href: '/employees/new', icon: Plus, variant: 'primary' },
          { label: 'Approve Leaves', href: '/leave/admin/requests', icon: ClipboardList },
          ...(isSuperAdmin ? [{ label: 'Run Payroll', href: '/payroll/periods', icon: Cake } as const] : []),
        ]} />
      </div>
    </DashboardLayout>
  );
}