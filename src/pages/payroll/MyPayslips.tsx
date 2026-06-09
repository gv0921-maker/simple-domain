import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HR_NAV } from '@/lib/navigation/hr';
import { useCurrentEmployee } from '@/hooks/hr/useCurrentEmployee';
import { useEmployeePayslips } from '@/hooks/hr';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function MyPayslips() {
  const { data: employee } = useCurrentEmployee();
  const { data: payslips = [] } = useEmployeePayslips(employee?.id);

  return (
    <AppLayout title="My Payslips" moduleNav={HR_NAV}>
      <div className="p-6">
        {!employee && <Card className="p-6 text-sm text-muted-foreground">Your account is not linked to an employee record.</Card>}
        <Card>
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr><th className="text-left p-3">Period</th><th className="text-left p-3">Number</th><th className="text-right p-3">Gross</th><th className="text-right p-3">Net</th><th className="text-center p-3">Status</th><th></th></tr>
            </thead>
            <tbody>
              {payslips.map((p: any) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3">{p.payroll_periods?.period_label}</td>
                  <td className="p-3 text-xs">{p.payslip_number}</td>
                  <td className="p-3 text-right">{fmt(Number(p.gross_earnings))}</td>
                  <td className="p-3 text-right font-medium">{fmt(Number(p.net_pay))}</td>
                  <td className="p-3 text-center"><Badge variant="outline">{p.status}</Badge></td>
                  <td className="p-3 text-right"><Link to={`/payroll/payslips/${p.id}`}><Button size="sm" variant="outline">View</Button></Link></td>
                </tr>
              ))}
              {payslips.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No payslips yet.</td></tr>}
            </tbody>
          </table>
        </Card>
      </div>
    </AppLayout>
  );
}