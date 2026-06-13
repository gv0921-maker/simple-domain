import { useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  useEmployees, useSundayRosters, useAssignSundayDuty, useClearRosterAssignment,
} from '@/hooks/hr';
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';
import { toast } from 'sonner';

function monthBounds(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  };
}

export default function AdminWorkSchedule() {
  const { isAdmin, loading } = useIsSuperAdmin();
  const { data: employees = [] } = useEmployees();
  const [month, setMonth] = useState(new Date());
  const bounds = useMemo(() => monthBounds(month), [month]);
  const { data: rosters = [] } = useSundayRosters(bounds.from, bounds.to);
  const assign = useAssignSundayDuty();
  const clearOne = useClearRosterAssignment();

  const [single, setSingle] = useState({ employeeId: '', sundayDate: '', compOffDate: '' });
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkSunday, setBulkSunday] = useState('');
  const [bulkRows, setBulkRows] = useState<Record<string, { selected: boolean; compOff: string }>>({});

  if (loading) return <AppLayout title="Admin · Work Schedule"><div className="p-6">Loading…</div></AppLayout>;
  if (!isAdmin) return <AppLayout title="Admin · Work Schedule"><div className="p-6 text-sm text-muted-foreground">Super admin access required.</div></AppLayout>;

  async function handleAssignSingle() {
    if (!single.employeeId || !single.sundayDate || !single.compOffDate) {
      toast.error('Pick employee, Sunday, comp-off date'); return;
    }
    try {
      await assign.mutateAsync({
        employeeId: single.employeeId,
        sundayDate: single.sundayDate,
        compOffDate: single.compOffDate,
      });
      toast.success('Sunday duty assigned');
      setSingle({ employeeId: '', sundayDate: '', compOffDate: '' });
    } catch (e: any) { toast.error(e.message ?? 'Failed'); }
  }

  async function handleBulk() {
    if (!bulkSunday) { toast.error('Pick a Sunday'); return; }
    let count = 0;
    for (const empId of Object.keys(bulkRows)) {
      const r = bulkRows[empId];
      if (!r.selected || !r.compOff) continue;
      try {
        await assign.mutateAsync({ employeeId: empId, sundayDate: bulkSunday, compOffDate: r.compOff });
        count++;
      } catch (e: any) { toast.error(`${empId}: ${e.message}`); }
    }
    toast.success(`Assigned to ${count} employee(s)`);
    setBulkOpen(false); setBulkRows({}); setBulkSunday('');
  }

  return (
    <AppLayout title="Admin · Work Schedule">
      <div className="p-6 space-y-4">
        <Card className="p-4 space-y-3">
          <div className="font-medium">Assign Sunday Duty</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label>Employee</Label>
              <Select value={single.employeeId} onValueChange={(v) => setSingle({ ...single, employeeId: v })}>
                <SelectTrigger><SelectValue placeholder="" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sunday date</Label>
              <Input type="date" value={single.sundayDate} onChange={(e) => setSingle({ ...single, sundayDate: e.target.value })} />
            </div>
            <div>
              <Label>Comp-off date (same week)</Label>
              <Input type="date" value={single.compOffDate} onChange={(e) => setSingle({ ...single, compOffDate: e.target.value })} />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleAssignSingle} disabled={assign.isPending}>Assign</Button>
              <Button variant="outline" onClick={() => setBulkOpen(true)}>Bulk…</Button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-3 flex items-center justify-between">
            <div className="font-medium">Current month assignments</div>
            <div className="flex gap-2">
              <Input type="month" value={`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`}
                onChange={(e) => {
                  const [y, m] = e.target.value.split('-').map(Number);
                  setMonth(new Date(y, m - 1, 1));
                }} className="w-44" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Employee</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Linked date</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rosters.map((r: any) => {
                  const emp = employees.find((e) => e.id === r.employee_id);
                  return (
                    <tr key={r.id} className="border-t">
                      <td className="p-3">{r.roster_date}</td>
                      <td className="p-3">{emp?.full_name ?? '—'}</td>
                      <td className="p-3">
                        {r.is_sunday_duty
                          ? <Badge className="bg-amber-100 text-amber-800">Sunday duty</Badge>
                          : <Badge variant="secondary">{r.roster_type}</Badge>}
                      </td>
                      <td className="p-3 text-muted-foreground">{r.compensatory_off_for_date ?? ''}</td>
                      <td className="p-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => clearOne.mutate(r.id)}>Clear</Button>
                      </td>
                    </tr>
                  );
                })}
                {rosters.length === 0 && (
                  <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No assignments this month.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Bulk assign Sunday duty</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Sunday date</Label>
                <Input type="date" value={bulkSunday} onChange={(e) => setBulkSunday(e.target.value)} />
              </div>
              <div className="max-h-80 overflow-y-auto border rounded">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs sticky top-0">
                    <tr><th className="p-2 w-8"></th><th className="text-left p-2">Employee</th><th className="text-left p-2">Comp-off date</th></tr>
                  </thead>
                  <tbody>
                    {employees.map((e) => {
                      const row = bulkRows[e.id] ?? { selected: false, compOff: '' };
                      return (
                        <tr key={e.id} className="border-t">
                          <td className="p-2"><Checkbox checked={row.selected}
                            onCheckedChange={(c) => setBulkRows({ ...bulkRows, [e.id]: { ...row, selected: !!c } })} /></td>
                          <td className="p-2">{e.full_name}</td>
                          <td className="p-2">
                            <Input type="date" value={row.compOff} className="h-8"
                              onChange={(ev) => setBulkRows({ ...bulkRows, [e.id]: { ...row, compOff: ev.target.value } })} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button>
              <Button onClick={handleBulk} disabled={assign.isPending}>Assign</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}