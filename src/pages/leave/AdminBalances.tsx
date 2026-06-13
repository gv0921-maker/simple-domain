import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LEAVE_NAV } from '@/lib/navigation/leave';
import {
  useEmployees, useAllotments, useBulkSetAllotments, useCopyPrevMonthAllotments,
} from '@/hooks/hr';
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';
import { toast } from 'sonner';
import { MobileScrollHint } from '@/components/layout/MobileScrollHint';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AdminBalances() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const { isAdmin, loading } = useIsSuperAdmin();
  const { data: employees = [] } = useEmployees();
  const { data: allotments = [] } = useAllotments(year, month);
  const bulkSet = useBulkSetAllotments();
  const copyPrev = useCopyPrevMonthAllotments();

  const [drafts, setDrafts] = useState<Record<string, number>>({});
  useEffect(() => {
    const next: Record<string, number> = {};
    for (const a of allotments) next[a.employee_id] = a.paid_leaves_allotted;
    setDrafts(next);
  }, [allotments]);

  function get(empId: string) {
    return allotments.find((a) => a.employee_id === empId);
  }

  async function handleSave() {
    const rows = employees.map((e) => ({
      employee_id: e.id,
      paid_leaves_allotted: drafts[e.id] ?? 0,
    }));
    await bulkSet.mutateAsync({ year, month, rows });
    toast.success(`Allotments saved for ${MONTHS[month - 1]} ${year}`);
  }

  async function handleCopyPrev() {
    const n = await copyPrev.mutateAsync({ year, month });
    toast.success(`Copied ${n} allotment(s) from previous month`);
  }

  if (loading) return <AppLayout title="Monthly Leave Allotments" moduleNav={LEAVE_NAV}><div className="p-6">Loading…</div></AppLayout>;
  if (!isAdmin) return <AppLayout title="Monthly Leave Allotments" moduleNav={LEAVE_NAV}><div className="p-6 text-sm text-muted-foreground">Super admin access required.</div></AppLayout>;

  return (
    <AppLayout title="Monthly Leave Allotments" moduleNav={LEAVE_NAV}>
      <div className="p-6 space-y-3">
        <div className="flex flex-wrap gap-2 justify-between items-center">
          <div className="flex gap-2">
            <Input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value) || year)} className="w-28" />
            <select className="border rounded h-9 px-2 text-sm bg-background" value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCopyPrev} disabled={copyPrev.isPending}>Copy from previous month</Button>
            <Button onClick={handleSave} disabled={bulkSet.isPending}>Save allotments</Button>
          </div>
        </div>
        <MobileScrollHint />
        <Card className="overflow-x-auto -mx-4 md:mx-0 rounded-none md:rounded-md">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="text-left p-2">Employee</th>
                <th className="text-left p-2">Designation</th>
                <th className="text-right p-2">Paid Allotted</th>
                <th className="text-right p-2">Paid Used</th>
                <th className="text-right p-2">Paid Remaining</th>
                <th className="text-right p-2">Unpaid Used</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                const a = get(emp.id);
                const allotted = drafts[emp.id] ?? 0;
                const used = a?.paid_leaves_used ?? 0;
                return (
                  <tr key={emp.id} className="border-t">
                    <td className="p-2 font-medium">{emp.full_name}</td>
                    <td className="p-2 text-muted-foreground">{emp.designation ?? ''}</td>
                    <td className="p-2 text-right">
                      <Input type="number" className="h-8 w-20 ml-auto text-right"
                        value={allotted}
                        onChange={(e) => setDrafts({ ...drafts, [emp.id]: parseInt(e.target.value) || 0 })} />
                    </td>
                    <td className="p-2 text-right">{used}</td>
                    <td className="p-2 text-right font-medium">{Math.max(0, allotted - used)}</td>
                    <td className="p-2 text-right">{a?.unpaid_leaves_used ?? 0}</td>
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