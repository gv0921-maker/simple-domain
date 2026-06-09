import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { HR_NAV } from '@/lib/navigation/hr';
import { useAdvances, useAddAdvance, useUpdateAdvance, useEmployees } from '@/hooks/hr';
import { toast } from '@/hooks/use-toast';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function AdminAdvances() {
  const { data: list = [] } = useAdvances();
  const { data: employees = [] } = useEmployees();
  const add = useAddAdvance();
  const upd = useUpdateAdvance();
  const [form, setForm] = useState({ employee_id: '', advance_amount: 0, deduction_month: new Date().toISOString().slice(0, 10) });

  return (
    <AppLayout title="Employee Advances" moduleNav={HR_NAV}>
      <div className="p-6 space-y-4">
        <Card className="p-4 grid md:grid-cols-5 gap-2 items-end">
          <div className="md:col-span-2"><label className="text-xs">Employee</label>
            <select className="border rounded px-2 py-1 h-9 text-sm w-full" value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })}>
              <option value="">—</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
            </select></div>
          <div><label className="text-xs">Amount</label><Input type="number" value={form.advance_amount} onChange={(e) => setForm({ ...form, advance_amount: parseFloat(e.target.value) || 0 })} /></div>
          <div><label className="text-xs">Deduct From</label><Input type="date" value={form.deduction_month} onChange={(e) => setForm({ ...form, deduction_month: e.target.value })} /></div>
          <Button onClick={async () => { if (!form.employee_id) return; await add.mutateAsync(form as any); toast({ title: 'Advance granted' }); }}>Grant</Button>
        </Card>

        <Card>
          <table className="w-full text-sm">
            <thead className="bg-muted/50"><tr><th className="p-3 text-left">Employee</th><th className="text-right p-3">Amount</th><th className="text-right p-3">Deducted</th><th className="text-right p-3">Remaining</th><th className="text-center p-3">Status</th><th></th></tr></thead>
            <tbody>
              {list.map((a) => {
                const emp = employees.find((e) => e.id === a.employee_id);
                return (
                  <tr key={a.id} className="border-t">
                    <td className="p-3">{emp?.full_name ?? a.employee_id}</td>
                    <td className="p-3 text-right">{fmt(Number(a.advance_amount))}</td>
                    <td className="p-3 text-right">{fmt(Number(a.deducted_amount))}</td>
                    <td className="p-3 text-right">{fmt(Number(a.remaining_amount))}</td>
                    <td className="p-3 text-center"><Badge>{a.status}</Badge></td>
                    <td className="p-3 text-right space-x-1">
                      {a.status === 'pending' && <>
                        <Button size="sm" variant="ghost" onClick={() => upd.mutate({ id: a.id, patch: { status: 'recovered', deducted_amount: a.advance_amount } })}>Recovered</Button>
                        <Button size="sm" variant="ghost" onClick={() => upd.mutate({ id: a.id, patch: { status: 'cancelled' } })}>Cancel</Button>
                      </>}
                    </td>
                  </tr>
                );
              })}
              {list.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No advances.</td></tr>}
            </tbody>
          </table>
        </Card>
      </div>
    </AppLayout>
  );
}