import { PrintableDocument } from '@/components/print/PrintableDocument';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

function inWords(n: number): string {
  // Indian numbering words — simplified
  if (!n || n <= 0) return 'Zero Rupees Only';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const num = (x: number): string => {
    if (x < 20) return a[x];
    if (x < 100) return b[Math.floor(x / 10)] + (x % 10 ? ' ' + a[x % 10] : '');
    return a[Math.floor(x / 100)] + ' Hundred' + (x % 100 ? ' ' + num(x % 100) : '');
  };
  const r = Math.floor(n);
  let out = '';
  const crore = Math.floor(r / 10000000); if (crore) out += num(crore) + ' Crore ';
  const lakh = Math.floor((r % 10000000) / 100000); if (lakh) out += num(lakh) + ' Lakh ';
  const thou = Math.floor((r % 100000) / 1000); if (thou) out += num(thou) + ' Thousand ';
  const last = r % 1000; if (last) out += num(last);
  return out.trim() + ' Rupees Only';
}

export function PayslipPrint({ payslip }: { payslip: any }) {
  const emp = payslip?.employees ?? {};
  const period = payslip?.payroll_periods ?? {};
  const components: any[] = payslip?.payslip_components ?? [];
  const earnings = components.filter((c) => c.salary_components?.component_type === 'earning' || (c.sort_order ?? 0) < 100);
  const deductions = components.filter((c) => c.salary_components?.component_type === 'deduction' || ((c.sort_order ?? 0) >= 100 && (c.sort_order ?? 0) < 200));
  const snap = payslip?.payroll_settings_snapshot ?? null;

  return (
    <PrintableDocument
      documentType="payslip"
      documentNumber={payslip?.payslip_number ?? '—'}
      documentDate={period?.period_label ?? ''}
      isDraft={payslip?.status === 'draft'}
    >
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4 border p-3 rounded">
          <div>
            <div className="text-xs text-gray-500">Employee</div>
            <div className="font-medium">{emp.full_name} ({emp.employee_code})</div>
            <div className="text-xs">{emp.designation ?? ''}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Period</div>
            <div className="font-medium">{period.period_label}</div>
            <div className="text-xs">Paid Days: {payslip?.paid_days ?? '—'} / {payslip?.total_working_days}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="font-semibold border-b pb-1 mb-1">Earnings</div>
            <table className="w-full">
              <tbody>
                {earnings.map((c) => (
                  <tr key={c.id}><td className="py-0.5">{c.salary_components?.name ?? c.salary_components?.code ?? '—'}</td><td className="py-0.5 text-right">{fmt(Number(c.amount))}</td></tr>
                ))}
                <tr className="border-t font-semibold"><td className="py-1">Gross Earnings</td><td className="py-1 text-right">{fmt(Number(payslip?.gross_earnings))}</td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <div className="font-semibold border-b pb-1 mb-1">Deductions</div>
            <table className="w-full">
              <tbody>
                {deductions.map((c) => {
                  const code = c.salary_components?.code;
                  const isESI = code === 'ESI';
                  const isPT = code === 'PT';
                  const notApplicable = (isESI && payslip?.esi_applicable === false) || (isPT && payslip?.pt_applicable === false);
                  return (
                    <tr key={c.id}>
                      <td className="py-0.5">{c.salary_components?.name ?? code ?? '—'}</td>
                      <td className="py-0.5 text-right">
                        {notApplicable
                          ? <span className="text-xs text-gray-500">N/A — {c.calculation_notes ?? 'threshold not met'}</span>
                          : fmt(Number(c.amount))}
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t font-semibold"><td className="py-1">Total Deductions</td><td className="py-1 text-right">{fmt(Number(payslip?.total_deductions))}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="border-t pt-3 flex justify-between items-center">
          <div className="text-sm text-gray-600 italic max-w-[60%]">{inWords(Number(payslip?.net_pay))}</div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Net Pay</div>
            <div className="text-xl font-bold">{fmt(Number(payslip?.net_pay))}</div>
          </div>
        </div>

        {snap && (
          <div className="text-[10px] text-gray-500 border-t pt-2">
            Calculated as per Payroll Settings effective {snap.captured_at ? new Date(snap.captured_at).toLocaleDateString('en-IN') : '—'}.
            PF {snap.pf_rate}% · ESI {snap.esi_rate_employee}% (≤ ₹{Number(snap.esi_gross_threshold).toLocaleString('en-IN')}) ·
            PT ₹{Number(snap.pt_amount).toLocaleString('en-IN')} (&gt; ₹{Number(snap.pt_salary_threshold).toLocaleString('en-IN')}).
          </div>
        )}
      </div>
    </PrintableDocument>
  );
}