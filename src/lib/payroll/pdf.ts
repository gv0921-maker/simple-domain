import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n);

function numberToWords(num: number): string {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if (num === 0) return 'Zero';
  const n = Math.floor(num);
  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + inWords(n % 10000000) : '');
  };
  return inWords(n) + ' Rupees Only';
}

export function generatePayslipPDF(psl: any) {
  const doc = new jsPDF();
  const emp = psl.employees ?? {};
  const period = psl.payroll_periods ?? {};
  const comps: any[] = psl.payslip_components ?? [];

  const earnings = comps.filter((c) => c.salary_components?.type === 'earning');
  const deductions = comps.filter((c) => c.salary_components?.type === 'deduction');
  const employer = comps.filter((c) => c.salary_components?.type === 'employer_contribution');

  doc.setFontSize(16); doc.text('GLF Payslip', 105, 15, { align: 'center' });
  doc.setFontSize(10); doc.text(`Pay Period: ${period.period_label ?? ''}`, 105, 22, { align: 'center' });
  doc.text(`Payslip No: ${psl.payslip_number}`, 105, 28, { align: 'center' });

  autoTable(doc, {
    startY: 34,
    body: [
      ['Name', emp.full_name ?? '', 'Code', emp.employee_code ?? ''],
      ['Designation', emp.designation ?? '', 'Department', emp.department_id ?? ''],
      ['PAN', emp.pan_number ?? '', 'UAN', emp.uan_number ?? ''],
      ['Bank', emp.bank_name ?? '', 'A/c', emp.bank_account_number ?? ''],
      ['Working Days', String(psl.total_working_days), 'Paid Days', String(psl.paid_days ?? '')],
      ['LOP Days', String(psl.lop_days), 'OT Hours', String(psl.overtime_hours)],
    ],
    theme: 'grid', styles: { fontSize: 8 },
  });

  const y1 = (doc as any).lastAutoTable.finalY + 4;
  autoTable(doc, {
    startY: y1,
    head: [['Earnings', 'Amount']],
    body: [
      ...earnings.map((c) => [c.salary_components.name, fmt(Number(c.amount))]),
      [{ content: 'Gross Earnings', styles: { fontStyle: 'bold' } }, { content: fmt(Number(psl.gross_earnings)), styles: { fontStyle: 'bold' } }],
    ],
    theme: 'striped', margin: { right: 110 }, styles: { fontSize: 9 },
  });
  autoTable(doc, {
    startY: y1,
    head: [['Deductions', 'Amount']],
    body: [
      ...deductions.map((c) => [c.salary_components.name, fmt(Number(c.amount))]),
      [{ content: 'Total Deductions', styles: { fontStyle: 'bold' } }, { content: fmt(Number(psl.total_deductions)), styles: { fontStyle: 'bold' } }],
    ],
    theme: 'striped', margin: { left: 110 }, styles: { fontSize: 9 },
  });

  const y2 = Math.max((doc as any).lastAutoTable.finalY, y1 + 60) + 6;
  autoTable(doc, {
    startY: y2,
    body: [
      [{ content: 'NET PAY', styles: { fontStyle: 'bold', fillColor: [230, 240, 255] } },
       { content: fmt(Number(psl.net_pay)), styles: { fontStyle: 'bold', fillColor: [230, 240, 255] } }],
      [{ content: 'Amount in Words', styles: { fontStyle: 'italic' } },
       { content: numberToWords(Number(psl.net_pay)), styles: { fontStyle: 'italic' } }],
    ], theme: 'grid', styles: { fontSize: 10 },
  });

  const y3 = (doc as any).lastAutoTable.finalY + 4;
  if (employer.length) {
    autoTable(doc, {
      startY: y3,
      head: [['Employer Contributions', 'Amount']],
      body: employer.map((c) => [c.salary_components.name, fmt(Number(c.amount))]),
      theme: 'striped', styles: { fontSize: 9 },
    });
  }

  const finalY = (doc as any).lastAutoTable.finalY + 20;
  doc.setFontSize(8);
  doc.text('HR Signature: ______________', 14, finalY);
  doc.text('Authorized Signatory: ______________', 130, finalY);
  doc.text('This is a system-generated payslip.', 105, finalY + 10, { align: 'center' });

  doc.save(`${psl.payslip_number || 'payslip'}.pdf`);
}