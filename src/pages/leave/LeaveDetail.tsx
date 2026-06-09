import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { HR_NAV } from '@/lib/navigation/hr';
import { useLeaveRequest, useApprovalLog, useApproveLeave, useRejectLeave, useCancelLeave, useLeaveTypes, useEmployees } from '@/hooks/hr';
import { useCurrentEmployee } from '@/hooks/hr/useCurrentEmployee';
import { toast } from 'sonner';

export default function LeaveDetail() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { data: req } = useLeaveRequest(id);
  const { data: log = [] } = useApprovalLog(id);
  const { data: types = [] } = useLeaveTypes();
  const { data: employees = [] } = useEmployees();
  const { data: me } = useCurrentEmployee();
  const approve = useApproveLeave();
  const reject = useRejectLeave();
  const cancel = useCancelLeave();
  const [reason, setReason] = useState('');

  if (!req) return <AppLayout title="Leave Request" moduleNav={HR_NAV}><div className="p-6">Loading…</div></AppLayout>;
  const type = types.find((t) => t.id === req.leave_type_id);
  const emp = employees.find((e) => e.id === req.employee_id);
  const isOwn = me?.id === req.employee_id;
  const canApprove = !isOwn && emp?.reports_to === me?.id && req.status === 'pending';

  return (
    <AppLayout title={`Leave ${req.request_number}`} moduleNav={HR_NAV}>
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Card className="p-6 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold">{type?.name}</h2>
              <div className="text-sm text-muted-foreground">{emp?.full_name}</div>
            </div>
            <Badge>{req.status}</Badge>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div><div className="text-muted-foreground text-xs">Start</div>{req.start_date}</div>
            <div><div className="text-muted-foreground text-xs">End</div>{req.end_date}</div>
            <div><div className="text-muted-foreground text-xs">Days</div>{req.total_days}</div>
            <div><div className="text-muted-foreground text-xs">Half day</div>{req.is_half_day ? req.half_day_session : 'No'}</div>
            <div><div className="text-muted-foreground text-xs">Applied</div>{req.applied_date?.slice(0, 10) ?? '—'}</div>
            <div><div className="text-muted-foreground text-xs">Contact</div>{req.contact_during_leave || '—'}</div>
          </div>
          {req.reason && <div><div className="text-xs text-muted-foreground">Reason</div>{req.reason}</div>}
          {req.rejection_reason && <div className="text-red-700 text-sm">Rejection: {req.rejection_reason}</div>}
        </Card>

        {canApprove && (
          <Card className="p-4 space-y-3">
            <Textarea placeholder="Optional comment" value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className="flex gap-2">
              <Button onClick={async () => {
                try { await approve.mutateAsync({ id, approver_id: me?.id, comments: reason }); toast.success('Approved'); }
                catch (e: any) { toast.error(e.message); }
              }}>Approve</Button>
              <Button variant="destructive" onClick={async () => {
                if (!reason) { toast.error('Reason required'); return; }
                try { await reject.mutateAsync({ id, reason }); toast.success('Rejected'); }
                catch (e: any) { toast.error(e.message); }
              }}>Reject</Button>
            </div>
          </Card>
        )}

        {isOwn && (req.status === 'pending' || req.status === 'draft') && (
          <Button variant="outline" onClick={async () => { await cancel.mutateAsync({ id }); nav('/leave/my-leaves'); }}>Cancel Request</Button>
        )}

        <Card className="p-4">
          <h3 className="font-semibold mb-2">Approval Timeline</h3>
          <ul className="space-y-2 text-sm">
            {log.length === 0 && <li className="text-muted-foreground">No actions recorded.</li>}
            {log.map((l) => (
              <li key={l.id} className="border-l-2 pl-3 border-primary">
                <div className="font-medium">{l.action} <span className="text-xs text-muted-foreground">· {l.previous_status} → {l.new_status}</span></div>
                <div className="text-xs text-muted-foreground">{new Date(l.action_date).toLocaleString()}</div>
                {l.comments && <div className="text-xs">{l.comments}</div>}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </AppLayout>
  );
}