import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { HR_NAV } from '@/lib/navigation/hr';
import { usePayrollPeriods, useCreatePayrollPeriod } from '@/hooks/hr';
import { toast } from '@/hooks/use-toast';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const statusColor: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  processing: 'bg-amber-100 text-amber-800',
  processed: 'bg-blue-100 text-blue-800',
  locked: 'bg-purple-100 text-purple-800',
  paid: 'bg-emerald-100 text-emerald-800',
};

export default function PayrollPeriodsList() {
  const { data: periods = [] } = usePayrollPeriods();
  const create = useCreatePayrollPeriod();
  const [m, setM] = useState(new Date().getMonth() + 1);
  const [y, setY] = useState(new Date().getFullYear());

  return (
    <AppLayout title="Payroll Periods" moduleNav={HR_NAV}>
      <div className="p-6 space-y-4">
        <Card className="p-4 flex gap-2 items-end">
          <div><label className="text-xs">Month (1-12)</label>
            <Input type="number" min={1} max={12} value={m} onChange={(e) => setM(parseInt(e.target.value) || 1)} className="w-24" /></div>
          <div><label className="text-xs">Year</label>
            <Input type="number" value={y} onChange={(e) => setY(parseInt(e.target.value) || y)} className="w-32" /></div>
          <Button onClick={async () => {
            try { await create.mutateAsync({ month: m, year: y }); toast({ title: 'Created' }); }
            catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
          }}>Create Period</Button>
        </Card>

        <Card>
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr><th className="text-left p-3">Period</th><th className="text-left p-3">Status</th>
                <th className="text-right p-3">Employees</th><th className="text-right p-3">Gross</th>
                <th className="text-right p-3">Deductions</th><th className="text-right p-3">Net</th><th></th></tr>
            </thead>
            <tbody>
              {periods.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3 font-medium">{p.period_label}</td>
                  <td className="p-3"><Badge className={statusColor[p.status] ?? ''}>{p.status}</Badge></td>
                  <td className="p-3 text-right">{p.total_employees}</td>
                  <td className="p-3 text-right">{fmt(Number(p.total_gross))}</td>
                  <td className="p-3 text-right">{fmt(Number(p.total_deductions))}</td>
                  <td className="p-3 text-right font-medium">{fmt(Number(p.total_net))}</td>
                  <td className="p-3 text-right"><Link to={`/payroll/periods/${p.id}`}><Button size="sm" variant="outline">Open</Button></Link></td>
                </tr>
              ))}
              {periods.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No periods yet.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </AppLayout>
  );
}