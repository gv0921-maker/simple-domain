import { useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HR_NAV } from '@/lib/navigation/hr';
import { usePayslip } from '@/hooks/hr';
import { generatePayslipPDF } from '@/lib/payroll/pdf';
import { Download } from 'lucide-react';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n);

export default function PayslipDetail() {
  const { id } = useParams();
  const { data: psl } = usePayslip(id);
  if (!psl) return <AppLayout title="Payslip" moduleNav={HR_NAV}><div className="p-6">Loading…</div></AppLayout>;

  const emp: any = (psl as any).employees;
  const period: any = (psl as any).payroll_periods;
  const comps: any[] = (psl as any).payslip_components ?? [];
  const earnings = comps.filter((c) => c.salary_components?.type === 'earning');
  const deductions = comps.filter((c) => c.salary_components?.type === 'deduction');
  const employer = comps.filter((c) => c.salary_components?.type === 'employer_contribution');

  return (
    <AppLayout title={`Payslip · ${period?.period_label}`} moduleNav={HR_NAV}>
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold">GLF Payslip</h1>
            <p className="text-sm text-muted-foreground">{(psl as any).payslip_number} · <Badge variant="outline">{(psl as any).status}</Badge></p>
          </div>
          <Button onClick={() => generatePayslipPDF(psl)} className="gap-2"><Download className="h-4 w-4" />Download PDF</Button>
        </div>

        <Card className="p-6 grid md:grid-cols-2 gap-3 text-sm">
          <Info label="Name" value={emp?.full_name} />
          <Info label="Employee Code" value={emp?.employee_code} />
          <Info label="Designation" value={emp?.designation} />
          <Info label="Period" value={period?.period_label} />
          <Info label="PAN" value={emp?.pan_number} />
          <Info label="UAN" value={emp?.uan_number} />
          <Info label="Bank" value={emp?.bank_name} />
          <Info label="Account" value={emp?.bank_account_number} />
          <Info label="Working Days" value={String((psl as any).total_working_days)} />
          <Info label="Paid Days" value={String((psl as any).paid_days ?? '')} />
          <Info label="LOP Days" value={String((psl as any).lop_days)} />
          <Info label="Overtime" value={`${(psl as any).overtime_hours} hrs`} />
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Earnings</h3>
            <table className="w-full text-sm">
              <tbody>
                {earnings.map((c) => (
                  <tr key={c.id} className="border-b"><td className="py-1">{c.salary_components.name}</td><td className="py-1 text-right">{fmt(Number(c.amount))}</td></tr>
                ))}
                <tr className="font-semibold"><td className="py-2">Gross</td><td className="py-2 text-right">{fmt(Number((psl as any).gross_earnings))}</td></tr>
              </tbody>
            </table>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Deductions</h3>
            <table className="w-full text-sm">
              <tbody>
                {deductions.map((c) => (
                  <tr key={c.id} className="border-b"><td className="py-1">{c.salary_components.name}</td><td className="py-1 text-right">{fmt(Number(c.amount))}</td></tr>
                ))}
                <tr className="font-semibold"><td className="py-2">Total Deductions</td><td className="py-2 text-right">{fmt(Number((psl as any).total_deductions))}</td></tr>
              </tbody>
            </table>
          </Card>
        </div>

        <Card className="p-6 bg-primary/5 flex justify-between items-center">
          <div><div className="text-xs text-muted-foreground">NET PAY</div><div className="text-3xl font-bold">{fmt(Number((psl as any).net_pay))}</div></div>
          <div className="text-right text-sm text-muted-foreground">CTC for period: {fmt(Number((psl as any).ctc_for_period))}</div>
        </Card>

        {employer.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Employer Contributions</h3>
            <table className="w-full text-sm">
              <tbody>
                {employer.map((c) => (
                  <tr key={c.id} className="border-b"><td className="py-1">{c.salary_components.name}</td><td className="py-1 text-right">{fmt(Number(c.amount))}</td></tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return <div><div className="text-xs text-muted-foreground uppercase">{label}</div><div>{value || '—'}</div></div>;
}