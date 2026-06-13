import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { LEAVE_NAV } from '@/lib/navigation/leave';
import { useLeaveRequests, useEmployees, useLeaveTypes, useApproveLeave, useRejectLeave } from '@/hooks/hr';
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';
import { toast } from 'sonner';

export default function AdminApprovals() {
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const { isAdmin, loading } = useIsSuperAdmin();
  const { data: requests = [] } = useLeaveRequests({ status: tab });
  const { data: employees = [] } = useEmployees();
  const { data: types = [] } = useLeaveTypes();
  const approve = useApproveLeave();
  const reject = useRejectLeave();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  if (loading) return <AppLayout title="Leave Approvals" moduleNav={LEAVE_NAV}><div className="p-6">Loading…</div></AppLayout>;
  if (!isAdmin) return <AppLayout title="Leave Approvals" moduleNav={LEAVE_NAV}><div className="p-6 text-sm text-muted-foreground">Super admin access required.</div></AppLayout>;

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }

  async function handleApprove(id: string) {
    try { await approve.mutateAsync({ id }); toast.success('Approved'); }
    catch (e: any) { toast.error(e.message ?? 'Failed'); }
  }
  async function handleReject(id: string) {
    const reason = window.prompt('Rejection reason?');
    if (!reason) return;
    try { await reject.mutateAsync({ id, reason }); toast.success('Rejected'); }
    catch (e: any) { toast.error(e.message ?? 'Failed'); }
  }
  async function handleBulkApprove() {
    for (const id of selected) {
      try { await approve.mutateAsync({ id }); } catch {}
    }
    toast.success(`Processed ${selected.size} request(s)`);
    setSelected(new Set());
  }

  return (
    <AppLayout title="Leave Approvals" moduleNav={LEAVE_NAV}>
      <div className="p-6 space-y-3">
        <Tabs value={tab} onValueChange={(v: any) => { setTab(v); setSelected(new Set()); }}>
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
          <TabsContent value={tab} className="mt-4">
            {tab === 'pending' && selected.size > 0 && (
              <div className="mb-3">
                <Button onClick={handleBulkApprove} disabled={approve.isPending}>
                  Bulk approve ({selected.size})
                </Button>
              </div>
            )}
            <Card className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    {tab === 'pending' && <th className="p-3 w-8"></th>}
                    <th className="text-left p-3">Employee</th>
                    <th className="text-left p-3">Type</th>
                    <th className="text-left p-3">Dates</th>
                    <th className="text-left p-3">Days</th>
                    <th className="text-left p-3">Reason</th>
                    <th className="text-left p-3">Status</th>
                    {tab === 'pending' && <th className="text-right p-3">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => {
                    const e = employees.find((x) => x.id === r.employee_id);
                    const t = types.find((x) => x.id === r.leave_type_id);
                    return (
                      <tr key={r.id} className="border-t">
                        {tab === 'pending' && (
                          <td className="p-3">
                            <Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggle(r.id)} />
                          </td>
                        )}
                        <td className="p-3 font-medium">{e?.full_name ?? '—'}</td>
                        <td className="p-3">{t?.name ?? r.leave_type_code ?? '—'}</td>
                        <td className="p-3">{r.start_date} → {r.end_date}</td>
                        <td className="p-3">{r.total_days}</td>
                        <td className="p-3 text-muted-foreground max-w-xs truncate">{r.reason ?? ''}</td>
                        <td className="p-3"><Badge>{r.status}</Badge></td>
                        {tab === 'pending' && (
                          <td className="p-3 text-right space-x-2">
                            <Button size="sm" onClick={() => handleApprove(r.id)} disabled={approve.isPending}>Approve</Button>
                            <Button size="sm" variant="outline" onClick={() => handleReject(r.id)} disabled={reject.isPending}>Reject</Button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {requests.length === 0 && (
                    <tr><td colSpan={tab === 'pending' ? 8 : 6} className="p-6 text-center text-muted-foreground">No {tab} requests.</td></tr>
                  )}
                </tbody>
              </table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}