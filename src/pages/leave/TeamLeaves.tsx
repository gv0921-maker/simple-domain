import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { HR_NAV } from '@/lib/navigation/hr';
import { useLeaveRequests, useEmployees } from '@/hooks/hr';
import { useCurrentEmployee } from '@/hooks/hr/useCurrentEmployee';

export default function TeamLeaves() {
  const { data: me } = useCurrentEmployee();
  const { data: employees = [] } = useEmployees();
  const { data: all = [] } = useLeaveRequests();
  const reportIds = new Set(employees.filter((e) => e.reports_to === me?.id).map((e) => e.id));
  const requests = all.filter((r) => reportIds.has(r.employee_id));

  return (
    <AppLayout title="Team Leaves" moduleNav={HR_NAV}>
      <div className="p-6 space-y-4">
        <Card>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="text-left p-3">Request</th><th className="text-left p-3">Employee</th>
                <th className="text-left p-3">Dates</th><th className="text-left p-3">Days</th><th className="text-left p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No team leave requests.</td></tr>}
              {requests.map((r) => {
                const e = employees.find((x) => x.id === r.employee_id);
                return (
                  <tr key={r.id} className="border-t">
                    <td className="p-3"><Link to={`/leave/${r.id}`} className="text-primary hover:underline">{r.request_number}</Link></td>
                    <td className="p-3">{e?.full_name}</td>
                    <td className="p-3">{r.start_date} → {r.end_date}</td>
                    <td className="p-3">{r.total_days}</td>
                    <td className="p-3"><Badge>{r.status}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>
    </AppLayout>
  );
}