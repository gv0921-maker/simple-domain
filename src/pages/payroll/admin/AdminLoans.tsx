import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PAYROLL_NAV } from '@/lib/navigation/payroll';
import { useLoans, useAddLoan, useUpdateLoan, useEmployees } from '@/hooks/hr';
import { toast } from '@/hooks/use-toast';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function AdminLoans() {
  const { data: loans = [] } = useLoans();
  const { data: employees = [] } = useEmployees();
  const add = useAddLoan();
  const upd = useUpdateLoan();
  const [form, setForm] = useState({ employee_id: '', loan_amount: 0, monthly_emi: 0, total_emis: 12, start_month: new Date().toISOString().slice(0, 10) });

  return (
    <AppLayout title="Employee Loans" moduleNav={PAYROLL_NAV}>
      <div className="p-6 space-y-4">
        <Card className="p-4 grid md:grid-cols-6 gap-2 items-end">
          <div className="md:col-span-2"><label className="text-xs">Employee</label>
            <select className="border rounded px-2 py-1 h-9 text-sm w-full" value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })}>
              <option value="">—</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
            </select></div>
          <div><label className="text-xs">Amount</label><Input type="number" value={form.loan_amount} onChange={(e) => setForm({ ...form, loan_amount: parseFloat(e.target.value) || 0 })} /></div>
          <div><label className="text-xs">EMI</label><Input type="number" value={form.monthly_emi} onChange={(e) => setForm({ ...form, monthly_emi: parseFloat(e.target.value) || 0 })} /></div>
          <div><label className="text-xs">Total EMIs</label><Input type="number" value={form.total_emis} onChange={(e) => setForm({ ...form, total_emis: parseInt(e.target.value) || 1 })} /></div>
          <div><label className="text-xs">Start</label><Input type="date" value={form.start_month} onChange={(e) => setForm({ ...form, start_month: e.target.value })} /></div>
          <Button className="md:col-span-6" onClick={async () => { if (!form.employee_id) return; await add.mutateAsync(form as any); toast({ title: 'Loan added' }); }}>Add Loan</Button>
        </Card>

        <Card>
          <table className="w-full text-sm">
            <thead className="bg-muted/50"><tr><th className="p-3 text-left">Employee</th><th className="text-right p-3">Amount</th><th className="text-right p-3">EMI</th><th className="text-right p-3">Paid/Total</th><th className="text-right p-3">Remaining</th><th className="text-center p-3">Status</th><th></th></tr></thead>
            <tbody>
              {loans.map((l) => {
                const emp = employees.find((e) => e.id === l.employee_id);
                return (
                  <tr key={l.id} className="border-t">
                    <td className="p-3">{emp?.full_name ?? l.employee_id}</td>
                    <td className="p-3 text-right">{fmt(Number(l.loan_amount))}</td>
                    <td className="p-3 text-right">{fmt(Number(l.monthly_emi))}</td>
                    <td className="p-3 text-right">{l.paid_emis}/{l.total_emis}</td>
                    <td className="p-3 text-right">{fmt(Number(l.remaining_amount))}</td>
                    <td className="p-3 text-center"><Badge>{l.status}</Badge></td>
                    <td className="p-3 text-right">
                      {l.status === 'active' && <Button size="sm" variant="ghost" onClick={() => upd.mutate({ id: l.id, patch: { status: 'closed' } })}>Close</Button>}
                    </td>
                  </tr>
                );
              })}
              {loans.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No loans.</td></tr>}
            </tbody>
          </table>
        </Card>
      </div>
    </AppLayout>
  );
}