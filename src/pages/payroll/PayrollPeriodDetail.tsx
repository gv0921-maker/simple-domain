import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PAYROLL_NAV } from '@/lib/navigation/payroll';
import {
  usePayrollPeriod, usePeriodPayslips, useProcessPayroll, useRecalculatePayslip,
  useFinalizePayslip, useBulkFinalizePayroll, useLockPayrollPeriod, useMarkPaid,
} from '@/hooks/hr';
import { toast } from '@/hooks/use-toast';
import { MobileScrollHint } from '@/components/layout/MobileScrollHint';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function PayrollPeriodDetail() {
  const { id } = useParams();
  useNavigate();
  const { data: period } = usePayrollPeriod(id);
  const { data: payslips = [] } = usePeriodPayslips(id);
  const process = useProcessPayroll();
  const recalc = useRecalculatePayslip();
  const finalize = useFinalizePayslip();
  const bulkFin = useBulkFinalizePayroll();
  const lock = useLockPayrollPeriod();
  const markPaid = useMarkPaid();
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payRef, setPayRef] = useState('');

  if (!period) return <AppLayout title="Payroll" moduleNav={PAYROLL_NAV}><div className="p-6">Loading…</div></AppLayout>;

  const locked = period.status === 'locked' || period.status === 'paid';

  const exportCSV = () => {
    const header = ['Employee', 'Code', 'Working Days', 'Paid Days', 'Gross', 'Deductions', 'Net', 'Status'];
    const rows = payslips.map((p: any) => [
      p.employees?.full_name, p.employees?.employee_code, p.total_working_days, p.paid_days,
      p.gross_earnings, p.total_deductions, p.net_pay, p.status,
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${c ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `payroll-${period.period_label}.csv`; a.click();
  };

  return (
    <AppLayout title={`Payroll · ${period.period_label}`} moduleNav={PAYROLL_NAV}>
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <div className="flex gap-2 items-center">
            <Badge>{period.status}</Badge>
            <span className="text-sm text-muted-foreground">{period.total_employees} employees</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportCSV}>Export CSV</Button>
            {!locked && (
              <Button onClick={async () => {
                try {
                  const r = await process.mutateAsync(period.id);
                  toast({ title: `Processed ${r.processed} employees`, description: r.errors.length ? `${r.errors.length} errors` : '' });
                } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
              }}>Process / Recalculate All</Button>
            )}
            {period.status === 'processed' && (
              <>
                <Button variant="outline" onClick={async () => { await bulkFin.mutateAsync(period.id); toast({ title: 'All finalized' }); }}>
                  Finalize All
                </Button>
                <Button variant="destructive" onClick={async () => {
                  if (!confirm('Lock period? Cannot edit afterwards.')) return;
                  await lock.mutateAsync(period.id); toast({ title: 'Locked' });
                }}>Lock Period</Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4"><div className="text-xs text-muted-foreground">Gross</div><div className="text-lg font-semibold">{fmt(Number(period.total_gross))}</div></Card>
          <Card className="p-4"><div className="text-xs text-muted-foreground">Deductions</div><div className="text-lg font-semibold">{fmt(Number(period.total_deductions))}</div></Card>
          <Card className="p-4"><div className="text-xs text-muted-foreground">Net</div><div className="text-lg font-semibold">{fmt(Number(period.total_net))}</div></Card>
          <Card className="p-4"><div className="text-xs text-muted-foreground">Employer Contrib.</div><div className="text-lg font-semibold">{fmt(Number(period.total_employer_contrib))}</div></Card>
        </div>

        {period.status === 'locked' && (
          <Card className="p-4 flex gap-2 items-end">
            <div><label className="text-xs">Payment Date</label><Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} /></div>
            <div className="flex-1"><label className="text-xs">Payment Reference</label><Input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="Transaction ref" /></div>
            <Button onClick={async () => {
              await markPaid.mutateAsync({ periodId: period.id, date: payDate, reference: payRef });
              toast({ title: 'Marked paid' });
            }}>Mark Paid</Button>
          </Card>
        )}

        <MobileScrollHint />
        <Card className="overflow-x-auto -mx-4 md:mx-0 rounded-none md:rounded-md">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 sticky left-0 bg-muted/50 z-10">Employee</th>
                <th className="text-right p-3">Paid Days</th>
                <th className="text-right p-3">Gross</th>
                <th className="text-right p-3">Deductions</th>
                <th className="text-right p-3">Net</th>
                <th className="text-center p-3">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {payslips.map((p: any) => (
                <tr key={p.id} className="border-t hover:bg-accent">
                  <td className="p-3 sticky left-0 bg-card z-10"><div className="font-medium">{p.employees?.full_name}</div><div className="text-xs text-muted-foreground">{p.employees?.employee_code}</div></td>
                  <td className="p-3 text-right">{p.paid_days}/{p.total_working_days}</td>
                  <td className="p-3 text-right">{fmt(Number(p.gross_earnings))}</td>
                  <td className="p-3 text-right">{fmt(Number(p.total_deductions))}</td>
                  <td className="p-3 text-right font-medium">{fmt(Number(p.net_pay))}</td>
                  <td className="p-3 text-center"><Badge variant="outline">{p.status}</Badge></td>
                  <td className="p-3 text-right space-x-1">
                    <Link to={`/payroll/payslips/${p.id}`}><Button size="sm" variant="outline">View</Button></Link>
                    {!locked && p.status !== 'finalized' && (
                      <>
                        <Button size="sm" variant="ghost" onClick={async () => { await recalc.mutateAsync(p.id); toast({ title: 'Recalculated' }); }}>Recalc</Button>
                        <Button size="sm" variant="ghost" onClick={async () => { await finalize.mutateAsync(p.id); toast({ title: 'Finalized' }); }}>Finalize</Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {payslips.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No payslips. Click Process to generate.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </AppLayout>
  );
}