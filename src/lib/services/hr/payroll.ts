// HR Batch 4 — Payroll calculation engine and CRUD service.
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type SalaryComponent = Database['public']['Tables']['salary_components']['Row'];
export type SalaryComponentInsert = Database['public']['Tables']['salary_components']['Insert'];
export type SalaryComponentUpdate = Database['public']['Tables']['salary_components']['Update'];
export type PayrollSettings = Database['public']['Tables']['payroll_settings']['Row'];
export type PayrollSettingsUpdate = Database['public']['Tables']['payroll_settings']['Update'];
export type TaxSlab = Database['public']['Tables']['tax_slabs']['Row'];
export type TaxSlabInsert = Database['public']['Tables']['tax_slabs']['Insert'];
export type EmployeeLoan = Database['public']['Tables']['employee_loans']['Row'];
export type EmployeeLoanInsert = Database['public']['Tables']['employee_loans']['Insert'];
export type EmployeeAdvance = Database['public']['Tables']['employee_advances']['Row'];
export type EmployeeAdvanceInsert = Database['public']['Tables']['employee_advances']['Insert'];
export type PayrollPeriod = Database['public']['Tables']['payroll_periods']['Row'];
export type Payslip = Database['public']['Tables']['payslips']['Row'];
export type PayslipComponent = Database['public']['Tables']['payslip_components']['Row'];

// ---------- Salary Components ----------
export async function listSalaryComponents(): Promise<SalaryComponent[]> {
  const { data, error } = await supabase.from('salary_components').select('*').order('display_order');
  if (error) throw error;
  return data ?? [];
}
export async function createSalaryComponent(p: SalaryComponentInsert) {
  const { data, error } = await supabase.from('salary_components').insert(p).select().single();
  if (error) throw error; return data;
}
export async function updateSalaryComponent(id: string, patch: SalaryComponentUpdate) {
  const { data, error } = await supabase.from('salary_components').update(patch).eq('id', id).select().single();
  if (error) throw error; return data;
}
export async function deleteSalaryComponent(id: string) {
  const { error } = await supabase.from('salary_components').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Payroll Settings ----------
export async function getActivePayrollSettings(): Promise<PayrollSettings | null> {
  const { data, error } = await supabase.from('payroll_settings').select('*')
    .eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error; return data;
}
export async function updatePayrollSettings(id: string, patch: PayrollSettingsUpdate) {
  const { data, error } = await supabase.from('payroll_settings').update(patch).eq('id', id).select().single();
  if (error) throw error; return data;
}

// ---------- Tax Slabs ----------
export async function listTaxSlabs(financial_year: string, regime: 'old' | 'new'): Promise<TaxSlab[]> {
  const { data, error } = await supabase.from('tax_slabs').select('*')
    .eq('financial_year', financial_year).eq('regime', regime).order('slab_order');
  if (error) throw error; return data ?? [];
}
export async function upsertTaxSlab(p: TaxSlabInsert) {
  const { data, error } = await supabase.from('tax_slabs').insert(p).select().single();
  if (error) throw error; return data;
}
export async function deleteTaxSlab(id: string) {
  const { error } = await supabase.from('tax_slabs').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Loans / Advances ----------
export async function listLoans(employeeId?: string): Promise<EmployeeLoan[]> {
  let q = supabase.from('employee_loans').select('*').order('created_at', { ascending: false });
  if (employeeId) q = q.eq('employee_id', employeeId);
  const { data, error } = await q;
  if (error) throw error; return data ?? [];
}
export async function addLoan(p: EmployeeLoanInsert) {
  const { data, error } = await supabase.from('employee_loans').insert(p).select().single();
  if (error) throw error; return data;
}
export async function updateLoan(id: string, patch: Partial<EmployeeLoan>) {
  const { data, error } = await supabase.from('employee_loans').update(patch).eq('id', id).select().single();
  if (error) throw error; return data;
}
export async function listAdvances(employeeId?: string): Promise<EmployeeAdvance[]> {
  let q = supabase.from('employee_advances').select('*').order('created_at', { ascending: false });
  if (employeeId) q = q.eq('employee_id', employeeId);
  const { data, error } = await q;
  if (error) throw error; return data ?? [];
}
export async function addAdvance(p: EmployeeAdvanceInsert) {
  const { data, error } = await supabase.from('employee_advances').insert(p).select().single();
  if (error) throw error; return data;
}
export async function updateAdvance(id: string, patch: Partial<EmployeeAdvance>) {
  const { data, error } = await supabase.from('employee_advances').update(patch).eq('id', id).select().single();
  if (error) throw error; return data;
}

// ---------- Payroll Periods ----------
export async function listPayrollPeriods(): Promise<PayrollPeriod[]> {
  const { data, error } = await supabase.from('payroll_periods').select('*')
    .order('period_year', { ascending: false }).order('period_month', { ascending: false });
  if (error) throw error; return data ?? [];
}
export async function getPayrollPeriod(id: string) {
  const { data, error } = await supabase.from('payroll_periods').select('*').eq('id', id).maybeSingle();
  if (error) throw error; return data;
}
export async function createPayrollPeriod(period_month: number, period_year: number) {
  const { data, error } = await supabase.from('payroll_periods')
    .insert({ period_month, period_year, period_label: '', status: 'draft' })
    .select().single();
  if (error) throw error; return data;
}
export async function updatePayrollPeriod(id: string, patch: Partial<PayrollPeriod>) {
  const { data, error } = await supabase.from('payroll_periods').update(patch).eq('id', id).select().single();
  if (error) throw error; return data;
}

// ---------- Payslips ----------
export async function listPayslipsForPeriod(periodId: string) {
  const { data, error } = await supabase
    .from('payslips')
    .select('*, employees(full_name, employee_code, designation)')
    .eq('payroll_period_id', periodId)
    .order('created_at');
  if (error) throw error;
  return data ?? [];
}
export async function getPayslip(id: string) {
  const { data, error } = await supabase.from('payslips')
    .select('*, employees(*), contracts(*), payroll_periods(*), payslip_components(*, salary_components(*))')
    .eq('id', id).maybeSingle();
  if (error) throw error; return data;
}
export async function listPayslipsForEmployee(employeeId: string) {
  const { data, error } = await supabase.from('payslips')
    .select('*, payroll_periods(*)')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false });
  if (error) throw error; return data ?? [];
}

// ---------- Attendance/Leave aggregation ----------
export async function getEmployeeAttendanceForPeriod(employeeId: string, month: number, year: number) {
  const settings = await getActivePayrollSettings();
  const wdays = settings?.working_days_per_month ?? 26;
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const start = `${monthStr}-01`;
  const endDate = new Date(year, month, 0); // last day of month
  const end = endDate.toISOString().slice(0, 10);

  // LOP: unpaid leave (UPL) approved overlapping period
  const { data: leaveRows } = await supabase.from('leave_requests')
    .select('total_days, leave_types!inner(code)')
    .eq('employee_id', employeeId)
    .eq('status', 'approved')
    .lte('start_date', end)
    .gte('end_date', start);
  const lop_days = (leaveRows ?? [])
    .filter((r: any) => r.leave_types?.code === 'UPL')
    .reduce((a: number, r: any) => a + Number(r.total_days || 0), 0);

  // Overtime: extra hours beyond standard
  const { data: sessions } = await supabase.from('attendance_sessions')
    .select('duration_minutes, session_type, session_date')
    .eq('employee_id', employeeId)
    .gte('session_date', start)
    .lte('session_date', end);
  const workMin = (sessions ?? []).filter((s: any) => s.session_type === 'work')
    .reduce((a: number, s: any) => a + (s.duration_minutes || 0), 0);
  const standardMin = wdays * (settings?.working_hours_per_day ?? 8) * 60;
  const overtime_hours = Math.max(0, (workMin - standardMin) / 60);

  return { working_days: wdays, lop_days, paid_days: wdays - lop_days, overtime_hours };
}

// ---------- Tax calculation ----------
function computeAnnualTax(annualIncome: number, slabs: TaxSlab[]): number {
  let tax = 0;
  for (const slab of slabs) {
    const from = Number(slab.from_amount);
    const to = slab.to_amount == null ? Infinity : Number(slab.to_amount);
    if (annualIncome > from) {
      const taxable = Math.min(annualIncome, to) - from;
      tax += (taxable * Number(slab.rate_percentage)) / 100;
    }
  }
  return tax;
}

// ---------- Core calc engine ----------
export interface CalcResult {
  earnings: Array<{ code: string; name: string; amount: number; notes?: string }>;
  deductions: Array<{ code: string; name: string; amount: number; notes?: string }>;
  employer: Array<{ code: string; name: string; amount: number; notes?: string }>;
  gross: number;
  totalDeductions: number;
  net: number;
  employerContrib: number;
  paid_days: number;
  lop_days: number;
  overtime_hours: number;
  working_days: number;
}

export async function calculatePayslip(employeeId: string, periodMonth: number, periodYear: number): Promise<CalcResult> {
  const settings = await getActivePayrollSettings();
  if (!settings) throw new Error('Payroll settings not configured');

  // Get active contract
  const { data: contract } = await supabase.from('contracts')
    .select('*').eq('employee_id', employeeId).eq('status', 'active')
    .order('start_date', { ascending: false }).limit(1).maybeSingle();
  if (!contract) throw new Error('No active contract for employee');

  const att = await getEmployeeAttendanceForPeriod(employeeId, periodMonth, periodYear);
  const wdays = settings.working_days_per_month;
  const proration = att.paid_days / wdays;

  // Earnings (prorated)
  const basicFull = Number(contract.basic_salary || 0);
  const basic = basicFull * proration;
  const hra = Number(contract.hra || 0) * proration;
  const da = Number(contract.da || 0) * proration;
  const conv = Number(contract.conveyance_allowance || 0) * proration;
  const med = Number(contract.medical_allowance || 0) * proration;
  const spl = Number(contract.special_allowance || 0) * proration;
  const otRate = basicFull / wdays / (settings.working_hours_per_day || 8);
  const ot = att.overtime_hours * otRate * Number(settings.overtime_rate_multiplier || 1.5);

  const earnings = [
    { code: 'BASIC', name: 'Basic', amount: basic, notes: `${att.paid_days}/${wdays} paid days` },
    { code: 'HRA', name: 'House Rent Allowance', amount: hra },
    { code: 'DA', name: 'Dearness Allowance', amount: da },
    { code: 'CONV', name: 'Conveyance', amount: conv },
    { code: 'MED', name: 'Medical', amount: med },
    { code: 'SPL', name: 'Special Allowance', amount: spl },
    { code: 'OT', name: 'Overtime', amount: ot, notes: `${att.overtime_hours.toFixed(2)} hrs` },
  ];
  const gross = earnings.reduce((a, e) => a + e.amount, 0);

  // PF Employee
  const pfRate = Number(settings.pf_rate);
  const pfCap = Number(settings.pf_basic_cap);
  const pfBase = Math.min(basic, pfCap * proration);
  const pf = basic > 0 ? (pfBase * pfRate) / 100 : 0;

  // ESI Employee
  const esiThreshold = Number(settings.esi_gross_threshold);
  const esi = gross <= esiThreshold ? (gross * Number(settings.esi_rate_employee)) / 100 : 0;

  // Professional Tax
  const pt = Number(settings.pt_amount);

  // TDS — annualize and apply slabs
  const slabs = await listTaxSlabs(settings.financial_year, settings.tds_regime as 'old' | 'new');
  const stdDed = Number(settings.standard_deduction || 50000);
  const annualProjected = Math.max(0, gross * 12 - stdDed);
  const annualTax = computeAnnualTax(annualProjected, slabs);
  const tds = annualTax / 12;

  // Loans
  const { data: activeLoans } = await supabase.from('employee_loans')
    .select('*').eq('employee_id', employeeId).eq('status', 'active');
  const loanDeduction = (activeLoans ?? []).reduce((a, l) => a + Number(l.monthly_emi || 0), 0);

  // Advances pending for this month
  const monthStart = `${periodYear}-${String(periodMonth).padStart(2, '0')}-01`;
  const { data: pendingAdv } = await supabase.from('employee_advances')
    .select('*').eq('employee_id', employeeId).eq('status', 'pending')
    .lte('deduction_month', monthStart);
  const advDeduction = (pendingAdv ?? []).reduce((a, x) => a + (Number(x.advance_amount) - Number(x.deducted_amount || 0)), 0);

  // LOP (informational)
  const lopAmount = (basicFull / wdays) * att.lop_days;

  const deductions = [
    { code: 'PF', name: 'Provident Fund', amount: pf },
    { code: 'ESI', name: 'ESI', amount: esi },
    { code: 'PT', name: 'Professional Tax', amount: pt },
    { code: 'TDS', name: 'Tax Deducted at Source', amount: tds },
    { code: 'LOAN', name: 'Loan EMI', amount: loanDeduction },
    { code: 'ADV', name: 'Advance Recovery', amount: advDeduction },
    { code: 'LOP', name: 'Loss of Pay (info)', amount: 0, notes: `${att.lop_days} day(s) = ₹${lopAmount.toFixed(0)} already deducted via proration` },
  ];
  const totalDeductions = deductions.reduce((a, d) => a + d.amount, 0);

  // Employer contributions
  const pfEmp = pf;
  const esiEmp = gross <= esiThreshold ? (gross * Number(settings.esi_rate_employer)) / 100 : 0;
  const employer = [
    { code: 'PF_EMP', name: 'Provident Fund (Employer)', amount: pfEmp },
    { code: 'ESI_EMP', name: 'ESI (Employer)', amount: esiEmp },
  ];
  const employerContrib = employer.reduce((a, e) => a + e.amount, 0);

  return {
    earnings, deductions, employer,
    gross, totalDeductions, net: gross - totalDeductions,
    employerContrib,
    paid_days: att.paid_days, lop_days: att.lop_days,
    overtime_hours: att.overtime_hours, working_days: wdays,
  };
}

async function savePayslipFromCalc(periodId: string, employeeId: string, calc: CalcResult) {
  // Get contract id
  const { data: contract } = await supabase.from('contracts')
    .select('id, ctc').eq('employee_id', employeeId).eq('status', 'active')
    .order('start_date', { ascending: false }).limit(1).maybeSingle();

  // Upsert payslip
  const { data: existing } = await supabase.from('payslips').select('id')
    .eq('payroll_period_id', periodId).eq('employee_id', employeeId).maybeSingle();

  const payload = {
    payroll_period_id: periodId,
    employee_id: employeeId,
    payslip_number: '',
    contract_id: contract?.id ?? null,
    total_working_days: calc.working_days,
    lop_days: calc.lop_days,
    overtime_hours: calc.overtime_hours,
    gross_earnings: calc.gross,
    total_deductions: calc.totalDeductions,
    net_pay: calc.net,
    employer_contributions: calc.employerContrib,
    ctc_for_period: Number(contract?.ctc || 0) / 12,
    status: 'draft' as const,
  };

  let payslipId: string;
  if (existing) {
    const { data, error } = await supabase.from('payslips').update(payload).eq('id', existing.id).select('id').single();
    if (error) throw error;
    payslipId = data.id;
    await supabase.from('payslip_components').delete().eq('payslip_id', payslipId);
  } else {
    const { data, error } = await supabase.from('payslips').insert(payload).select('id').single();
    if (error) throw error;
    payslipId = data.id;
  }

  // Insert components
  const { data: components } = await supabase.from('salary_components').select('id, code');
  const codeToId = new Map((components ?? []).map((c) => [c.code, c.id]));

  const rows = [
    ...calc.earnings.map((e, i) => ({ payslip_id: payslipId, salary_component_id: codeToId.get(e.code)!, amount: e.amount, calculation_notes: e.notes ?? null, sort_order: i })),
    ...calc.deductions.map((d, i) => ({ payslip_id: payslipId, salary_component_id: codeToId.get(d.code)!, amount: d.amount, calculation_notes: d.notes ?? null, sort_order: 100 + i })),
    ...calc.employer.map((e, i) => ({ payslip_id: payslipId, salary_component_id: codeToId.get(e.code)!, amount: e.amount, calculation_notes: e.notes ?? null, sort_order: 200 + i })),
  ].filter((r) => r.salary_component_id);
  if (rows.length) {
    const { error } = await supabase.from('payslip_components').insert(rows);
    if (error) throw error;
  }
  return payslipId;
}

export async function recalculatePayslip(payslipId: string) {
  const { data: psl } = await supabase.from('payslips')
    .select('id, employee_id, payroll_period_id, payroll_periods(period_month, period_year), status')
    .eq('id', payslipId).single();
  if (!psl) throw new Error('Payslip not found');
  if (psl.status === 'finalized') throw new Error('Cannot recalculate a finalized payslip');
  const period = psl.payroll_periods as any;
  const calc = await calculatePayslip(psl.employee_id, period.period_month, period.period_year);
  await savePayslipFromCalc(psl.payroll_period_id, psl.employee_id, calc);
  return calc;
}

export async function processPayroll(periodId: string) {
  const period = await getPayrollPeriod(periodId);
  if (!period) throw new Error('Period not found');
  if (period.status === 'locked' || period.status === 'paid') {
    throw new Error('Period is locked');
  }
  await updatePayrollPeriod(periodId, { status: 'processing' });

  const { data: employees } = await supabase.from('employees').select('id').eq('status', 'active');
  let totalGross = 0, totalDed = 0, totalNet = 0, totalEmp = 0, count = 0;
  const errors: Array<{ employeeId: string; error: string }> = [];

  for (const emp of employees ?? []) {
    try {
      const calc = await calculatePayslip(emp.id, period.period_month, period.period_year);
      await savePayslipFromCalc(periodId, emp.id, calc);
      totalGross += calc.gross; totalDed += calc.totalDeductions;
      totalNet += calc.net; totalEmp += calc.employerContrib; count++;
    } catch (e: any) {
      errors.push({ employeeId: emp.id, error: e?.message ?? String(e) });
    }
  }

  await updatePayrollPeriod(periodId, {
    status: 'processed',
    processed_at: new Date().toISOString(),
    total_gross: totalGross, total_deductions: totalDed,
    total_net: totalNet, total_employer_contrib: totalEmp,
    total_employees: count,
  });
  return { processed: count, errors };
}

export async function finalizePayslip(payslipId: string) {
  const { data, error } = await supabase.from('payslips').update({
    status: 'finalized', finalized_at: new Date().toISOString(),
  }).eq('id', payslipId).select().single();
  if (error) throw error; return data;
}

export async function bulkFinalizePayroll(periodId: string) {
  const { error } = await supabase.from('payslips').update({
    status: 'finalized', finalized_at: new Date().toISOString(),
  }).eq('payroll_period_id', periodId).eq('status', 'draft');
  if (error) throw error;
}

export async function lockPayrollPeriod(periodId: string) {
  return updatePayrollPeriod(periodId, { status: 'locked', locked_at: new Date().toISOString() });
}

export async function markPaid(periodId: string, paymentDate: string, reference: string) {
  await supabase.from('payslips')
    .update({ payment_date: paymentDate, payment_reference: reference })
    .eq('payroll_period_id', periodId);
  return updatePayrollPeriod(periodId, {
    status: 'paid', paid_at: new Date().toISOString(), payment_reference: reference,
  });
}