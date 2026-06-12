import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, startOfYear, endOfMonth, format, subMonths } from 'date-fns';

export type DashboardRole =
  | 'super_admin'
  | 'admin'
  | 'sales_manager'
  | 'sales_rep'
  | 'warehouse_operator'
  | 'pos_operator'
  | 'accountant'
  | 'hr_manager'
  | 'employee'
  | 'unknown';

export async function getDashboardRole(): Promise<DashboardRole> {
  const { data, error } = await supabase.rpc('get_dashboard_role' as never);
  if (error || !data) return 'unknown';
  return data as DashboardRole;
}

function iso(d: Date) { return d.toISOString(); }
function dateOnly(d: Date) { return format(d, 'yyyy-MM-dd'); }

// ---------- Super Admin ----------
export interface SuperAdminMetrics {
  revenueMTD: number;
  revenueYTD: number;
  activeOrders: number;
  pendingInvoices: number;
  totalCustomers: number;
  totalEmployees: number;
  pendingLeaves: number;
  lowStockCount: number;
  activeMOs: number;
  pendingQC: number;
  cashPosition: number;
  revenueTrend: { label: string; value: number }[];
  orderStatusBreakdown: { label: string; value: number }[];
}

export async function getSuperAdminMetrics(): Promise<SuperAdminMetrics> {
  const now = new Date();
  const mtdStart = iso(startOfMonth(now));
  const ytdStart = iso(startOfYear(now));

  const [
    ordersMTD, ordersYTD, activeOrdersRes, pendingInvRes, customersRes,
    employeesRes, leavesRes, lowStockRes, mosRes, qcRes, paidInvRes, orderStatusRes,
  ] = await Promise.all([
    supabase.from('sales_orders').select('total, order_date').gte('order_date', mtdStart),
    supabase.from('sales_orders').select('total, order_date').gte('order_date', ytdStart),
    supabase.from('sales_orders').select('id', { count: 'exact', head: true }).in('status', ['confirmed', 'in_progress']),
    supabase.from('invoices').select('id', { count: 'exact', head: true }).in('status', ['draft', 'sent', 'overdue']),
    supabase.from('customers').select('id', { count: 'exact', head: true }),
    supabase.from('employees').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('products').select('id, stock_on_hand, reorder_level').not('reorder_level', 'is', null),
    supabase.from('work_orders').select('id', { count: 'exact', head: true }).in('state', ['confirmed', 'in_progress']),
    supabase.from('delivery_notes').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('invoices').select('total').eq('status', 'paid'),
    supabase.from('sales_orders').select('status'),
  ]);

  const revenueMTD = (ordersMTD.data ?? []).reduce((s, o: any) => s + Number(o.total ?? 0), 0);
  const revenueYTD = (ordersYTD.data ?? []).reduce((s, o: any) => s + Number(o.total ?? 0), 0);
  const cashPosition = (paidInvRes.data ?? []).reduce((s, i: any) => s + Number(i.total ?? 0), 0);

  const lowStock = (lowStockRes.data ?? []).filter(
    (p: any) => p.reorder_level != null && Number(p.stock_on_hand ?? 0) <= Number(p.reorder_level)
  );

  // Revenue trend (last 6 months)
  const sixStart = iso(startOfMonth(subMonths(now, 5)));
  const trendRes = await supabase
    .from('sales_orders')
    .select('total, order_date')
    .gte('order_date', sixStart);
  const monthlyBuckets = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(now, i);
    monthlyBuckets.set(format(d, 'yyyy-MM'), 0);
  }
  (trendRes.data ?? []).forEach((o: any) => {
    const key = format(new Date(o.order_date), 'yyyy-MM');
    if (monthlyBuckets.has(key)) {
      monthlyBuckets.set(key, (monthlyBuckets.get(key) ?? 0) + Number(o.total ?? 0));
    }
  });
  const revenueTrend = Array.from(monthlyBuckets.entries()).map(([k, v]) => ({
    label: format(new Date(k + '-01'), 'MMM'),
    value: v,
  }));

  // Order status breakdown
  const statusMap = new Map<string, number>();
  (orderStatusRes.data ?? []).forEach((o: any) => {
    const k = o.status ?? 'unknown';
    statusMap.set(k, (statusMap.get(k) ?? 0) + 1);
  });
  const orderStatusBreakdown = Array.from(statusMap.entries()).map(([k, v]) => ({ label: k, value: v }));

  return {
    revenueMTD,
    revenueYTD,
    activeOrders: activeOrdersRes.count ?? 0,
    pendingInvoices: pendingInvRes.count ?? 0,
    totalCustomers: customersRes.count ?? 0,
    totalEmployees: employeesRes.count ?? 0,
    pendingLeaves: leavesRes.count ?? 0,
    lowStockCount: lowStock.length,
    activeMOs: mosRes.count ?? 0,
    pendingQC: qcRes.count ?? 0,
    cashPosition,
    revenueTrend,
    orderStatusBreakdown,
  };
}

// ---------- Sales Manager ----------
export interface SalesManagerMetrics {
  revenueMTD: number;
  conversionRate: number; // percentage
  pipelineValue: number;
  avgDealSize: number;
  topCustomers: { id: string; label: string; value: number }[];
  topSalespeople: { id: string; label: string; value: number }[];
  recentActivities: { id: string; title: string; subtitle: string; timestamp: string }[];
}

export async function getSalesManagerMetrics(): Promise<SalesManagerMetrics> {
  const now = new Date();
  const mtdStart = iso(startOfMonth(now));
  const [ordersRes, quotsRes, pipelineRes] = await Promise.all([
    supabase.from('sales_orders').select('id, customer_id, customer_name, salesperson_id, salesperson_name, total, order_date').gte('order_date', mtdStart),
    supabase.from('quotations').select('id, status'),
    supabase.from('crm_opportunities').select('id, expected_revenue, stage_id, name'),
  ]);

  const orders = ordersRes.data ?? [];
  const quotations = quotsRes.data ?? [];
  const revenueMTD = orders.reduce((s, o: any) => s + Number(o.total ?? 0), 0);
  const confirmedQuotes = quotations.filter((q: any) => ['accepted', 'confirmed'].includes(q.status)).length;
  const conversionRate = quotations.length ? (confirmedQuotes / quotations.length) * 100 : 0;
  const pipelineValue = (pipelineRes.data ?? []).reduce((s, o: any) => s + Number(o.expected_revenue ?? 0), 0);
  const avgDealSize = orders.length ? revenueMTD / orders.length : 0;

  // Top customers by revenue
  const custMap = new Map<string, { label: string; value: number }>();
  orders.forEach((o: any) => {
    const k = o.customer_id ?? o.customer_name ?? 'unknown';
    const cur = custMap.get(k) ?? { label: o.customer_name ?? 'Unknown', value: 0 };
    cur.value += Number(o.total ?? 0);
    custMap.set(k, cur);
  });
  const topCustomers = Array.from(custMap.entries())
    .sort((a, b) => b[1].value - a[1].value).slice(0, 5)
    .map(([id, v]) => ({ id, label: v.label, value: v.value }));

  // Top salespeople
  const spMap = new Map<string, { label: string; value: number }>();
  orders.forEach((o: any) => {
    if (!o.salesperson_id && !o.salesperson_name) return;
    const k = o.salesperson_id ?? o.salesperson_name;
    const cur = spMap.get(k) ?? { label: o.salesperson_name ?? 'Unknown', value: 0 };
    cur.value += Number(o.total ?? 0);
    spMap.set(k, cur);
  });
  const topSalespeople = Array.from(spMap.entries())
    .sort((a, b) => b[1].value - a[1].value).slice(0, 5)
    .map(([id, v]) => ({ id, label: v.label, value: v.value }));

  const { data: actRows } = await supabase
    .from('order_activities')
    .select('id, action, details, timestamp, order_id')
    .order('timestamp', { ascending: false })
    .limit(10);
  const recentActivities = (actRows ?? []).map((a: any) => ({
    id: a.id,
    title: a.action ?? 'Activity',
    subtitle: a.details ?? '',
    timestamp: a.timestamp,
  }));

  return { revenueMTD, conversionRate, pipelineValue, avgDealSize, topCustomers, topSalespeople, recentActivities };
}

// ---------- Sales Rep ----------
export interface SalesRepMetrics {
  myQuotations: number;
  myOrdersMTD: number;
  myCustomers: number;
  followUpsDue: number;
  recentActivities: { id: string; title: string; subtitle: string; timestamp: string }[];
}

export async function getSalesRepMetrics(userId: string): Promise<SalesRepMetrics> {
  const now = new Date();
  const today = dateOnly(now);
  const mtdStart = iso(startOfMonth(now));

  const [qRes, oRes, cRes, fRes, aRes] = await Promise.all([
    supabase.from('quotations').select('id', { count: 'exact', head: true }).eq('salesperson_id', userId),
    supabase.from('sales_orders').select('id', { count: 'exact', head: true }).eq('salesperson_id', userId).gte('order_date', mtdStart),
    supabase.from('crm_contacts').select('id', { count: 'exact', head: true }).eq('assigned_to', userId),
    supabase.from('crm_activities').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('completed', false).lte('due_date', today),
    supabase.from('crm_activities').select('id, type, subject, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
  ]);

  return {
    myQuotations: qRes.count ?? 0,
    myOrdersMTD: oRes.count ?? 0,
    myCustomers: cRes.count ?? 0,
    followUpsDue: fRes.count ?? 0,
    recentActivities: (aRes.data ?? []).map((a: any) => ({
      id: a.id, title: a.type ?? 'Activity', subtitle: a.subject ?? '', timestamp: a.created_at,
    })),
  };
}

// ---------- Warehouse ----------
export interface WarehouseMetrics {
  pendingPicks: number;
  pendingQC: number;
  lowStockCount: number;
  todaysDeliveries: number;
  lowStockItems: { id: string; label: string; value: string }[];
  recentMovements: { id: string; title: string; subtitle: string; timestamp: string }[];
}

export async function getWarehouseOperatorMetrics(): Promise<WarehouseMetrics> {
  const now = new Date();
  const todayStart = iso(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  const todayEnd = iso(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59));

  const [picksRes, qcRes, lowStockRes, delsRes, movesRes] = await Promise.all([
    supabase.from('stock_moves').select('id', { count: 'exact', head: true }).in('state', ['confirmed', 'assigned']).eq('operation_type', 'delivery'),
    supabase.from('delivery_notes').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('products').select('id, name, stock_on_hand, reorder_level').not('reorder_level', 'is', null),
    supabase.from('delivery_notes').select('id', { count: 'exact', head: true }).gte('delivery_date', todayStart.slice(0, 10)).lte('delivery_date', todayEnd.slice(0, 10)),
    supabase.from('stock_moves').select('id, reference, operation_type, state, created_at').order('created_at', { ascending: false }).limit(10),
  ]);

  const lowStock = (lowStockRes.data ?? []).filter(
    (p: any) => p.reorder_level != null && Number(p.stock_on_hand ?? 0) <= Number(p.reorder_level)
  );

  return {
    pendingPicks: picksRes.count ?? 0,
    pendingQC: qcRes.count ?? 0,
    lowStockCount: lowStock.length,
    todaysDeliveries: delsRes.count ?? 0,
    lowStockItems: lowStock.slice(0, 8).map((p: any) => ({
      id: p.id, label: p.name ?? 'Product', value: `${p.stock_on_hand ?? 0} / ${p.reorder_level}`,
    })),
    recentMovements: (movesRes.data ?? []).map((m: any) => ({
      id: m.id, title: m.reference ?? m.operation_type ?? 'Move', subtitle: `${m.operation_type ?? ''} · ${m.state ?? ''}`, timestamp: m.created_at,
    })),
  };
}

// ---------- Accountant ----------
export interface AccountantMetrics {
  toCollect: number;
  overdue: number;
  collectedMTD: number;
  gstMTD: number;
  recentPaidInvoices: { id: string; title: string; subtitle: string; timestamp: string }[];
  pendingPriceApprovals: number;
  agingChart: { label: string; value: number }[];
}

export async function getAccountantMetrics(): Promise<AccountantMetrics> {
  const now = new Date();
  const mtdStart = iso(startOfMonth(now));
  const today = dateOnly(now);

  const [openInv, paidMTD, recentPaid] = await Promise.all([
    supabase.from('invoices').select('id, total, due_date, status, issue_date').in('status', ['draft', 'sent', 'overdue']),
    supabase.from('invoices').select('id, total, issue_date').eq('status', 'paid').gte('issue_date', mtdStart.slice(0, 10)),
    supabase.from('invoices').select('id, reference, total, updated_at').eq('status', 'paid').order('updated_at', { ascending: false }).limit(8),
  ]);

  const toCollect = (openInv.data ?? []).reduce((s, i: any) => s + Number(i.total ?? 0), 0);
  const overdue = (openInv.data ?? []).filter((i: any) => i.due_date && i.due_date < today).reduce((s, i: any) => s + Number(i.total ?? 0), 0);
  const collectedMTD = (paidMTD.data ?? []).reduce((s, i: any) => s + Number(i.total ?? 0), 0);
  const gstMTD = collectedMTD * 0.18 / 1.18; // best-effort estimate

  // Aging buckets
  const buckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 } as Record<string, number>;
  const todayMs = Date.now();
  (openInv.data ?? []).forEach((i: any) => {
    if (!i.due_date) return;
    const days = Math.floor((todayMs - new Date(i.due_date).getTime()) / 86400000);
    if (days < 31) buckets['0-30'] += Number(i.total ?? 0);
    else if (days < 61) buckets['31-60'] += Number(i.total ?? 0);
    else if (days < 91) buckets['61-90'] += Number(i.total ?? 0);
    else buckets['90+'] += Number(i.total ?? 0);
  });
  const agingChart = Object.entries(buckets).map(([label, value]) => ({ label, value }));

  return {
    toCollect, overdue, collectedMTD, gstMTD,
    recentPaidInvoices: (recentPaid.data ?? []).map((i: any) => ({
      id: i.id,
      title: i.reference ?? 'Invoice',
      subtitle: `₹${Number(i.total ?? 0).toLocaleString('en-IN')}`,
      timestamp: i.updated_at,
    })),
    pendingPriceApprovals: 0,
    agingChart,
  };
}

// ---------- HR Manager ----------
export interface HRMetrics {
  activeEmployees: number;
  onLeaveToday: number;
  pendingLeaveApprovals: number;
  attendanceToday: number;
  upcomingBirthdays: { id: string; label: string; subtitle: string; value: string }[];
  expiringContracts: { id: string; label: string; subtitle: string; value: string }[];
  pendingAppraisals: number;
}

export async function getHRManagerMetrics(): Promise<HRMetrics> {
  const now = new Date();
  const today = dateOnly(now);
  const next30 = dateOnly(new Date(now.getTime() + 30 * 86400000));

  const [empRes, onLeaveRes, pendLeaveRes, attRes, empBdays, contractsRes, apprRes] = await Promise.all([
    supabase.from('employees').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'approved').lte('start_date', today).gte('end_date', today),
    supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('attendance_sessions').select('id', { count: 'exact', head: true }).gte('check_in_time', today + 'T00:00:00').lte('check_in_time', today + 'T23:59:59'),
    supabase.from('employees').select('id, full_name, date_of_birth').not('date_of_birth', 'is', null).eq('status', 'active').limit(50),
    supabase.from('contracts').select('id, contract_number, end_date, employee_id').not('end_date', 'is', null).lte('end_date', next30).gte('end_date', today).limit(10),
    supabase.from('appraisals').select('id', { count: 'exact', head: true }).in('status', ['self_review', 'manager_review', 'hr_review']),
  ]);

  const upcoming = (empBdays.data ?? [])
    .map((e: any) => {
      if (!e.date_of_birth) return null;
      const dob = new Date(e.date_of_birth);
      const next = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
      if (next < now) next.setFullYear(next.getFullYear() + 1);
      const days = Math.floor((next.getTime() - now.getTime()) / 86400000);
      return { id: e.id, label: e.full_name ?? 'Employee', subtitle: format(next, 'MMM d'), value: `${days}d`, days };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => a.days - b.days)
    .slice(0, 5) as any[];

  return {
    activeEmployees: empRes.count ?? 0,
    onLeaveToday: onLeaveRes.count ?? 0,
    pendingLeaveApprovals: pendLeaveRes.count ?? 0,
    attendanceToday: attRes.count ?? 0,
    upcomingBirthdays: upcoming.map(({ days: _d, ...rest }: any) => rest),
    expiringContracts: (contractsRes.data ?? []).map((c: any) => ({
      id: c.id, label: c.contract_number ?? 'Contract', subtitle: c.employee_id ?? '', value: c.end_date,
    })),
    pendingAppraisals: apprRes.count ?? 0,
  };
}

// ---------- Employee (self) ----------
export interface EmployeeMetrics {
  employeeId: string | null;
  activeSession: { id: string; type: string; check_in_time: string } | null;
  leaveBalances: { id: string; label: string; value: string }[];
  latestPayslip: { id: string; payslip_number: string; net_pay: number; period_label?: string } | null;
  pendingMentions: number;
}

export async function getEmployeeMetrics(userId: string): Promise<EmployeeMetrics> {
  const { data: emp } = await supabase.from('employees').select('id').eq('user_id', userId).maybeSingle();
  const employeeId = emp?.id ?? null;
  if (!employeeId) {
    const { count } = await supabase.from('chat_notifications').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false);
    return { employeeId: null, activeSession: null, leaveBalances: [], latestPayslip: null, pendingMentions: count ?? 0 };
  }

  const [sessRes, balRes, slipRes, mentRes] = await Promise.all([
    supabase.from('attendance_sessions').select('id, session_type, check_in_time').eq('employee_id', employeeId).is('check_out_time', null).order('check_in_time', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('leave_balances').select('id, leave_type_id, available_balance, leave_types(name)').eq('employee_id', employeeId).limit(3),
    supabase.from('payslips').select('id, payslip_number, net_pay, payroll_period_id').eq('employee_id', employeeId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('chat_notifications').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false),
  ]);

  const sess = sessRes.data as any;
  const slip = slipRes.data as any;

  return {
    employeeId,
    activeSession: sess ? { id: sess.id, type: sess.session_type, check_in_time: sess.check_in_time } : null,
    leaveBalances: (balRes.data ?? []).map((b: any) => ({
      id: b.id,
      label: b.leave_types?.name ?? 'Leave',
      value: `${Number(b.available_balance ?? 0)} days`,
    })),
    latestPayslip: slip ? {
      id: slip.id,
      payslip_number: slip.payslip_number ?? '',
      net_pay: Number(slip.net_pay ?? 0),
    } : null,
    pendingMentions: mentRes.count ?? 0,
  };
}