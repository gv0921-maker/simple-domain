import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HR_NAV } from '@/lib/navigation/hr';
import { useCurrentEmployee } from '@/hooks/hr/useCurrentEmployee';
import { useEmployeeLeaveBalance, useLeaveRequests, useCancelLeave } from '@/hooks/hr';
import { Plus } from 'lucide-react';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-700',
  };
  return <Badge className={map[status] ?? ''}>{status}</Badge>;
}

export default function MyLeaves() {
  const { data: employee } = useCurrentEmployee();
  const [year] = useState(new Date().getFullYear());
  const { data: balances = [] } = useEmployeeLeaveBalance(employee?.id, year);
  const { data: requests = [] } = useLeaveRequests({ employeeId: employee?.id });
  const cancel = useCancelLeave();

  return (
    <AppLayout title="My Leaves" moduleNav={HR_NAV}>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Leave Balances — {year}</h2>
          <Button asChild><Link to="/leave/apply"><Plus className="h-4 w-4 mr-1" />Apply Leave</Link></Button>
        </div>
        {!employee && <Card className="p-6 text-sm text-muted-foreground">Your account is not linked to an employee record.</Card>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {balances.map((b) => (
            <Card key={b.leave_type.id} className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ background: b.leave_type.color }} />
                <div className="font-medium text-sm">{b.leave_type.name}</div>
              </div>
              <div className="text-2xl font-semibold">{b.available}</div>
              <div className="text-xs text-muted-foreground">
                of {b.allocated} {b.entitlement ? '(custom)' : ''}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Used {b.used} · Pending {b.pending}
              </div>
            </Card>
          ))}
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">My Requests</h2>
          <Card>
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Request</th>
                  <th className="text-left p-3">From</th>
                  <th className="text-left p-3">To</th>
                  <th className="text-left p-3">Days</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 && (
                  <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No leave requests yet.</td></tr>
                )}
                {requests.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-3"><Link to={`/leave/${r.id}`} className="text-primary hover:underline">{r.request_number}</Link></td>
                    <td className="p-3">{r.start_date}</td>
                    <td className="p-3">{r.end_date}</td>
                    <td className="p-3">{r.total_days}</td>
                    <td className="p-3"><StatusBadge status={r.status} /></td>
                    <td className="p-3 text-right">
                      {(r.status === 'pending' || r.status === 'draft') && (
                        <Button size="sm" variant="ghost" onClick={() => cancel.mutate({ id: r.id })}>Cancel</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}