import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HR_NAV } from '@/lib/navigation/hr';
import { useLeaveRequests, useEmployees, useLeaveTypes } from '@/hooks/hr';

export default function AdminRequests() {
  const [status, setStatus] = useState<string>('all');
  const [q, setQ] = useState('');
  const { data: requests = [] } = useLeaveRequests({ status: status === 'all' ? undefined : status });
  const { data: employees = [] } = useEmployees();
  const { data: types = [] } = useLeaveTypes();
  const filtered = requests.filter((r) => {
    if (!q) return true;
    const e = employees.find((x) => x.id === r.employee_id);
    return ((e?.full_name ?? '') + ' ' + r.request_number).toLowerCase().includes(q.toLowerCase());
  });
  return (
    <AppLayout title="Leave Requests (Admin)" moduleNav={HR_NAV}>
      <div className="p-6 space-y-3">
        <div className="flex gap-2">
          <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Card>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr><th className="text-left p-3">Request</th><th className="text-left p-3">Employee</th>
                <th className="text-left p-3">Type</th><th className="text-left p-3">Dates</th>
                <th className="text-left p-3">Days</th><th className="text-left p-3">Status</th></tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const e = employees.find((x) => x.id === r.employee_id);
                const t = types.find((x) => x.id === r.leave_type_id);
                return (
                  <tr key={r.id} className="border-t">
                    <td className="p-3"><Link to={`/leave/${r.id}`} className="text-primary hover:underline">{r.request_number}</Link></td>
                    <td className="p-3">{e?.full_name}</td>
                    <td className="p-3">{t?.code}</td>
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