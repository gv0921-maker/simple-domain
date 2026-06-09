import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HR_NAV } from '@/lib/navigation/hr';
import { usePayrollPeriods, useCreatePayrollPeriod, useEmployees } from '@/hooks/hr';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function PayrollDashboard() {
  const { data: periods = [] } = usePayrollPeriods();
  const { data: employees = [] } = useEmployees();
  const create = useCreatePayrollPeriod();
  const navigate = useNavigate();

  const now = new Date();
  const current = useMemo(
    () => periods.find((p) => p.period_month === now.getMonth() + 1 && p.period_year === now.getFullYear()),
    [periods],
  );
  const last6 = periods.slice(0, 6).reverse();
  const totals = periods.reduce(
    (a, p) => ({ gross: a.gross + Number(p.total_gross), net: a.net + Number(p.total_net), ded: a.ded + Number(p.total_deductions) }),
    { gross: 0, net: 0, ded: 0 },
  );

  return (
    <AppLayout title="Payroll" subtitle="Dashboard" moduleNav={HR_NAV}>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Current Period" value={current?.period_label ?? `${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`} sub={current?.status ?? 'not created'} />
          <Stat label="Active Employees" value={String(employees.filter((e) => e.status === 'active').length)} />
          <Stat label="Total Gross (All Periods)" value={fmt(totals.gross)} />
          <Stat label="Total Net Paid" value={fmt(totals.net)} />
        </div>

        <Card className="p-6">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h2 className="font-semibold">Process Current Month</h2>
              <p className="text-sm text-muted-foreground">{now.toLocaleString('default', { month: 'long' })} {now.getFullYear()}</p>
            </div>
            {current ? (
              <Button onClick={() => navigate(`/payroll/periods/${current.id}`)}>Open Current Period</Button>
            ) : (
              <Button
                onClick={async () => {
                  try {
                    const p = await create.mutateAsync({ month: now.getMonth() + 1, year: now.getFullYear() });
                    toast({ title: 'Period created' });
                    navigate(`/payroll/periods/${p.id}`);
                  } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
                }}
              >Create Current Period</Button>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-4">Last 6 Periods</h2>
          {last6.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payroll periods yet.</p>
          ) : (
            <div className="space-y-2">
              {last6.map((p) => {
                const max = Math.max(...last6.map((x) => Number(x.total_gross)), 1);
                const pct = (Number(p.total_gross) / max) * 100;
                return (
                  <Link to={`/payroll/periods/${p.id}`} key={p.id} className="block">
                    <div className="flex items-center gap-3 hover:bg-accent p-2 rounded">
                      <div className="w-24 text-sm">{p.period_label}</div>
                      <div className="flex-1 h-2 bg-muted rounded overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="w-32 text-right text-sm">{fmt(Number(p.total_net))}</div>
                      <div className="w-20 text-right text-xs text-muted-foreground">{p.status}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground uppercase">{label}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </Card>
  );
}