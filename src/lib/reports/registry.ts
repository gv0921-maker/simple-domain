import type { ReportColumn } from "./exporters";
import { supabase } from "@/integrations/supabase/client";

export type FilterType = "dateRange" | "select" | "text" | "number";

export type ReportFilterDef = {
  key: string;
  label: string;
  type: FilterType;
  options?: { value: string; label: string }[];
  defaultValue?: unknown;
};

export type ReportFilters = Record<string, unknown>;

export type ReportDef = {
  key: string;
  module: string;
  modulePath: string;
  title: string;
  description: string;
  roles?: string[]; // role names that can view; undefined = any authenticated
  filters: ReportFilterDef[];
  columns: ReportColumn<Record<string, unknown>>[];
  fetch: (filters: ReportFilters) => Promise<Record<string, unknown>[]>;
};

// ----- helpers -----
const inr = (n: unknown) =>
  typeof n === "number"
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n)
    : "";

const dateRangeFilter: ReportFilterDef = {
  key: "dateRange",
  label: "Date Range",
  type: "dateRange",
};

async function emptyFetch(): Promise<Record<string, unknown>[]> {
  return [];
}

// ----- Sales -----
const salesByPeriod: ReportDef = {
  key: "sales-by-period",
  module: "Sales",
  modulePath: "/sales",
  title: "Sales by Period",
  description: "Revenue grouped by day/week/month with quotation→order conversion data",
  roles: ["sales_rep", "sales_manager", "admin", "super_admin", "accountant"],
  filters: [dateRangeFilter, { key: "groupBy", label: "Group By", type: "select", options: [
    { value: "day", label: "Day" }, { value: "week", label: "Week" }, { value: "month", label: "Month" },
  ], defaultValue: "month" }],
  columns: [
    { key: "period", label: "Period" },
    { key: "orders", label: "Orders", align: "right" },
    { key: "revenue", label: "Revenue", align: "right", format: (r) => inr(r.revenue) },
    { key: "quotations", label: "Quotations", align: "right" },
    { key: "conversion", label: "Conversion %", align: "right", format: (r) => r.conversion ? `${Number(r.conversion).toFixed(1)}%` : "-" },
  ],
  async fetch(filters) {
    const groupBy = (filters.groupBy as string) || "month";
    const { data: orders } = await supabase.from("sales_orders").select("created_at,total");
    const { data: quotes } = await supabase.from("quotations").select("created_at");
    const fmt = (d: Date) => {
      if (groupBy === "day") return d.toISOString().slice(0, 10);
      if (groupBy === "week") {
        const onejan = new Date(d.getFullYear(), 0, 1);
        const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
        return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
      }
      return d.toISOString().slice(0, 7);
    };
    const agg = new Map<string, { period: string; orders: number; revenue: number; quotations: number }>();
    (orders || []).forEach((o) => {
      const k = fmt(new Date(o.created_at as string));
      const e = agg.get(k) || { period: k, orders: 0, revenue: 0, quotations: 0 };
      e.orders += 1;
      e.revenue += Number(o.total || 0);
      agg.set(k, e);
    });
    (quotes || []).forEach((q) => {
      const k = fmt(new Date(q.created_at as string));
      const e = agg.get(k) || { period: k, orders: 0, revenue: 0, quotations: 0 };
      e.quotations += 1;
      agg.set(k, e);
    });
    return Array.from(agg.values()).sort((a, b) => b.period.localeCompare(a.period)).map((r) => ({
      ...r, conversion: r.quotations ? (r.orders / r.quotations) * 100 : 0,
    }));
  },
};

const topCustomers: ReportDef = {
  key: "top-customers",
  module: "Sales", modulePath: "/sales",
  title: "Top Customers", description: "Customers ranked by total revenue and order count",
  roles: ["sales_rep", "sales_manager", "admin", "super_admin", "accountant"],
  filters: [dateRangeFilter, { key: "limit", label: "Top N", type: "number", defaultValue: 20 }],
  columns: [
    { key: "customer_name", label: "Customer" },
    { key: "order_count", label: "Orders", align: "right" },
    { key: "total_revenue", label: "Total Revenue", align: "right", format: (r) => inr(r.total_revenue) },
  ],
  async fetch(filters) {
    const limit = Number(filters.limit) || 20;
    const { data: orders } = await supabase.from("sales_orders").select("customer_id,customer_name,total");
    const agg = new Map<string, { customer_name: string; order_count: number; total_revenue: number }>();
    (orders || []).forEach((o) => {
      const k = (o.customer_id as string) || (o.customer_name as string) || "Unknown";
      const name = (o.customer_name as string) || "Unknown";
      const e = agg.get(k) || { customer_name: name, order_count: 0, total_revenue: 0 };
      e.order_count += 1;
      e.total_revenue += Number(o.total || 0);
      agg.set(k, e);
    });
    return Array.from(agg.values()).sort((a, b) => b.total_revenue - a.total_revenue).slice(0, limit);
  },
};

const topProducts: ReportDef = {
  key: "top-products",
  module: "Sales", modulePath: "/sales",
  title: "Top Selling Products", description: "Products ranked by quantity sold and revenue",
  roles: ["sales_rep", "sales_manager", "admin", "super_admin"],
  filters: [dateRangeFilter, { key: "limit", label: "Top N", type: "number", defaultValue: 20 }],
  columns: [
    { key: "product_name", label: "Product" },
    { key: "qty_sold", label: "Qty Sold", align: "right" },
    { key: "revenue", label: "Revenue", align: "right", format: (r) => inr(r.revenue) },
  ],
  async fetch(filters) {
    const limit = Number(filters.limit) || 20;
    const { data: lines } = await supabase.from("order_lines").select("product_name,quantity,subtotal,unit_price");
    const agg = new Map<string, { product_name: string; qty_sold: number; revenue: number }>();
    (lines || []).forEach((l) => {
      const name = (l.product_name as string) || "Unknown";
      const e = agg.get(name) || { product_name: name, qty_sold: 0, revenue: 0 };
      e.qty_sold += Number(l.quantity || 0);
      e.revenue += Number((l as any).subtotal ?? Number(l.quantity || 0) * Number((l as any).unit_price || 0));
      agg.set(name, e);
    });
    return Array.from(agg.values()).sort((a, b) => b.revenue - a.revenue).slice(0, limit);
  },
};

const salesBySalesperson: ReportDef = {
  key: "sales-by-salesperson", module: "Sales", modulePath: "/sales",
  title: "Sales by Salesperson", description: "Per-rep performance with quotation/order counts and revenue",
  roles: ["sales_manager", "admin", "super_admin"],
  filters: [dateRangeFilter],
  columns: [
    { key: "salesperson", label: "Salesperson" },
    { key: "orders", label: "Orders", align: "right" },
    { key: "revenue", label: "Revenue", align: "right", format: (r) => inr(r.revenue) },
    { key: "quotations", label: "Quotations", align: "right" },
  ],
  async fetch() {
    const { data: orders } = await supabase.from("sales_orders").select("salesperson_id,salesperson_name,total");
    const { data: quotes } = await supabase.from("quotations").select("salesperson_id,salesperson_name");
    const agg = new Map<string, { salesperson: string; orders: number; revenue: number; quotations: number }>();
    (orders || []).forEach((o) => {
      const name = ((o as any).salesperson_name as string) || "Unassigned";
      const e = agg.get(name) || { salesperson: name, orders: 0, revenue: 0, quotations: 0 };
      e.orders += 1; e.revenue += Number(o.total || 0); agg.set(name, e);
    });
    (quotes || []).forEach((q) => {
      const name = ((q as any).salesperson_name as string) || "Unassigned";
      const e = agg.get(name) || { salesperson: name, orders: 0, revenue: 0, quotations: 0 };
      e.quotations += 1; agg.set(name, e);
    });
    return Array.from(agg.values()).sort((a, b) => b.revenue - a.revenue);
  },
};

const pipelineFunnel: ReportDef = {
  key: "pipeline-funnel", module: "Sales", modulePath: "/sales",
  title: "Pipeline Funnel", description: "Opportunities by stage with conversion rates",
  roles: ["sales_rep", "sales_manager", "admin", "super_admin"],
  filters: [],
  columns: [
    { key: "stage", label: "Stage" },
    { key: "count", label: "Opportunities", align: "right" },
    { key: "value", label: "Pipeline Value", align: "right", format: (r) => inr(r.value) },
  ],
  async fetch() {
    const { data } = await supabase.from("crm_opportunities").select("stage,expected_revenue");
    const agg = new Map<string, { stage: string; count: number; value: number }>();
    (data || []).forEach((o: any) => {
      const k = o.stage || "Unknown";
      const e = agg.get(k) || { stage: k, count: 0, value: 0 };
      e.count += 1; e.value += Number(o.expected_revenue || 0); agg.set(k, e);
    });
    return Array.from(agg.values());
  },
};

const outstandingQuotations: ReportDef = {
  key: "outstanding-quotations", module: "Sales", modulePath: "/sales",
  title: "Outstanding Quotations", description: "Pending/expired quotations needing follow-up",
  roles: ["sales_rep", "sales_manager", "admin", "super_admin"],
  filters: [dateRangeFilter],
  columns: [
    { key: "reference", label: "Quotation #" },
    { key: "customer_name", label: "Customer" },
    { key: "status", label: "Status" },
    { key: "total", label: "Total", align: "right", format: (r) => inr(r.total) },
    { key: "created_at", label: "Created", format: (r) => r.created_at ? new Date(r.created_at as string).toLocaleDateString("en-IN") : "" },
  ],
  async fetch() {
    const { data } = await supabase.from("quotations").select("reference,customer_name,status,total,created_at").in("status", ["draft", "sent"]).order("created_at", { ascending: false });
    return (data || []) as unknown as Record<string, unknown>[];
  },
};

// ----- Inventory -----
const stockValuation: ReportDef = {
  key: "stock-valuation", module: "Inventory", modulePath: "/inventory",
  title: "Stock Valuation", description: "Current stock value per product with cost and selling price",
  roles: ["warehouse_operator", "sales_manager", "admin", "super_admin", "accountant"],
  filters: [],
  columns: [
    { key: "name", label: "Product" },
    { key: "sku", label: "SKU" },
    { key: "stock_on_hand", label: "On Hand", align: "right" },
    { key: "cost", label: "Cost", align: "right", format: (r) => inr(r.cost) },
    { key: "price", label: "Price", align: "right", format: (r) => inr(r.price) },
    { key: "value", label: "Stock Value", align: "right", format: (r) => inr(r.value) },
  ],
  async fetch() {
    const { data } = await supabase.from("products").select("name,sku,stock_on_hand,cost_price,sale_price");
    return (data || []).map((p: any) => ({
      ...p, cost: p.cost_price, price: p.sale_price,
      value: Number(p.stock_on_hand || 0) * Number(p.cost_price || 0),
    }));
  },
};

const lowStock: ReportDef = {
  key: "low-stock", module: "Inventory", modulePath: "/inventory",
  title: "Low Stock Report", description: "Items below reorder point with suggested reorder quantity",
  roles: ["warehouse_operator", "sales_manager", "admin", "super_admin"],
  filters: [],
  columns: [
    { key: "name", label: "Product" },
    { key: "sku", label: "SKU" },
    { key: "stock_on_hand", label: "On Hand", align: "right" },
    { key: "reorder_level", label: "Reorder Level", align: "right" },
    { key: "shortage", label: "Shortage", align: "right" },
  ],
  async fetch() {
    const { data } = await supabase.from("products").select("name,sku,stock_on_hand,reorder_level");
    return (data || []).filter((p: any) => Number(p.stock_on_hand || 0) <= Number(p.reorder_level || 0))
      .map((p: any) => ({ ...p, shortage: Math.max(0, Number(p.reorder_level || 0) - Number(p.stock_on_hand || 0)) }));
  },
};

const stockMovements: ReportDef = {
  key: "stock-movements", module: "Inventory", modulePath: "/inventory",
  title: "Stock Movements", description: "Filter by date range, location, product, type (in/out/transfer)",
  roles: ["warehouse_operator", "admin", "super_admin"],
  filters: [dateRangeFilter, { key: "operation_type", label: "Type", type: "select", options: [
    { value: "", label: "All" }, { value: "receipt", label: "Receipt" }, { value: "delivery", label: "Delivery" }, { value: "transfer", label: "Transfer" }, { value: "return", label: "Return" },
  ] }],
  columns: [
    { key: "reference", label: "Reference" },
    { key: "operation_type", label: "Type" },
    { key: "state", label: "Status" },
    { key: "scheduled_date", label: "Scheduled", format: (r) => r.scheduled_date ? new Date(r.scheduled_date as string).toLocaleDateString("en-IN") : "" },
  ],
  async fetch(filters) {
    let q = supabase.from("stock_moves").select("reference,operation_type,state,scheduled_date").order("scheduled_date", { ascending: false }).limit(500);
    if (filters.operation_type) q = q.eq("operation_type", filters.operation_type as string);
    const { data } = await q;
    return (data || []) as Record<string, unknown>[];
  },
};

const qcHistory: ReportDef = {
  key: "qc-history", module: "Inventory", modulePath: "/inventory",
  title: "QC History", description: "Goods receipt and pre-delivery QC records with pass/fail breakdown",
  roles: ["warehouse_operator", "admin", "super_admin"],
  filters: [dateRangeFilter],
  columns: [{ key: "note", label: "Note" }],
  fetch: emptyFetch,
};

const serialTracking: ReportDef = {
  key: "serial-number-tracking", module: "Inventory", modulePath: "/inventory",
  title: "Serial Number Tracking", description: "Trace any serial number through receipt → reservation → delivery",
  roles: ["warehouse_operator", "admin", "super_admin"],
  filters: [{ key: "serial", label: "Serial Number", type: "text" }],
  columns: [
    { key: "serial_number", label: "Serial" },
    { key: "product_name", label: "Product" },
    { key: "status", label: "Status" },
  ],
  async fetch(filters) {
    const s = (filters.serial as string)?.trim();
    if (!s) return [];
    const { data } = await supabase.from("serial_numbers").select("name,product_id,status").ilike("name", `%${s}%`).limit(200);
    const rows = (data || []).map((r: any) => ({ serial_number: r.name, product_name: r.product_id, status: r.status }));
    return rows as Record<string, unknown>[];
  },
};

// ----- Manufacturing -----

// ----- Manufacturing -----
const workOrderSummary: ReportDef = {
  key: "work-order-summary", module: "Manufacturing", modulePath: "/manufacturing",
  title: "Work Orders by Status", description: "Work order status summary with completion times",
  roles: ["admin", "super_admin"],
  filters: [dateRangeFilter],
  columns: [
    { key: "reference", label: "WO #" },
    { key: "state", label: "Status" },
    { key: "planned_qty", label: "Qty", align: "right" },
    { key: "scheduled_end", label: "Due", format: (r) => r.scheduled_end ? new Date(r.scheduled_end as string).toLocaleDateString("en-IN") : "" },
  ],
  async fetch() {
    const { data } = await supabase.from("work_orders").select("reference,state,planned_qty,scheduled_end").order("scheduled_end", { ascending: false }).limit(500);
    return (data || []) as unknown as Record<string, unknown>[];
  },
};

const materialConsumption: ReportDef = {
  key: "material-consumption", module: "Manufacturing", modulePath: "/manufacturing",
  title: "Material Consumption", description: "Material consumption per BOM/work order",
  roles: ["admin", "super_admin"],
  filters: [dateRangeFilter],
  columns: [{ key: "note", label: "Note" }],
  fetch: emptyFetch,
};

const productionOutput: ReportDef = {
  key: "production-output", module: "Manufacturing", modulePath: "/manufacturing",
  title: "Production Output", description: "Finished goods produced by date range",
  roles: ["admin", "super_admin"],
  filters: [dateRangeFilter],
  columns: [{ key: "note", label: "Note" }],
  fetch: emptyFetch,
};

// ----- Invoicing -----
const invoiceRegister: ReportDef = {
  key: "invoice-register", module: "Invoicing", modulePath: "/invoicing",
  title: "Invoice Register", description: "All invoices with filter by type, status, date range, customer",
  roles: ["accountant", "admin", "super_admin"],
  filters: [dateRangeFilter, { key: "status", label: "Status", type: "select", options: [
    { value: "", label: "All" }, { value: "draft", label: "Draft" }, { value: "sent", label: "Sent" }, { value: "paid", label: "Paid" }, { value: "overdue", label: "Overdue" },
  ] }],
  columns: [
    { key: "reference", label: "Invoice #" },
    { key: "customer_id", label: "Customer" },
    { key: "status", label: "Status" },
    { key: "total", label: "Total", align: "right", format: (r) => inr(r.total) },
    { key: "issue_date", label: "Issue Date", format: (r) => r.issue_date ? new Date(r.issue_date as string).toLocaleDateString("en-IN") : "" },
  ],
  async fetch(filters) {
    let q = supabase.from("invoices").select("reference,customer_id,status,total,issue_date").order("issue_date", { ascending: false }).limit(500);
    if (filters.status) q = q.eq("status", filters.status as string);
    const { data } = await q;
    return (data || []) as unknown as Record<string, unknown>[];
  },
};

const gstSummary: ReportDef = {
  key: "gst-summary", module: "Invoicing", modulePath: "/invoicing",
  title: "GST Summary", description: "Per month breakdown of CGST, SGST, IGST collected (foundation for GSTR-1)",
  roles: ["accountant", "admin", "super_admin"],
  filters: [dateRangeFilter],
  columns: [{ key: "note", label: "Note" }],
  fetch: emptyFetch,
};

const agingReceivables: ReportDef = {
  key: "aging-receivables", module: "Invoicing", modulePath: "/invoicing",
  title: "Aging Receivables", description: "0-30, 31-60, 61-90, 90+ buckets of outstanding amounts",
  roles: ["accountant", "admin", "super_admin"],
  filters: [],
  columns: [
    { key: "bucket", label: "Aging Bucket" },
    { key: "count", label: "Invoices", align: "right" },
    { key: "amount", label: "Outstanding", align: "right", format: (r) => inr(r.amount) },
  ],
  async fetch() {
    const { data } = await supabase.from("invoices").select("issue_date,total,status").neq("status", "paid");
    const buckets = { "0-30": { bucket: "0-30 days", count: 0, amount: 0 }, "31-60": { bucket: "31-60 days", count: 0, amount: 0 }, "61-90": { bucket: "61-90 days", count: 0, amount: 0 }, "90+": { bucket: "90+ days", count: 0, amount: 0 } };
    const now = Date.now();
    (data || []).forEach((i: any) => {
      if (!i.issue_date) return;
      const days = Math.floor((now - new Date(i.issue_date).getTime()) / 86400000);
      const key = days <= 30 ? "0-30" : days <= 60 ? "31-60" : days <= 90 ? "61-90" : "90+";
      buckets[key].count += 1; buckets[key].amount += Number(i.total || 0);
    });
    return Object.values(buckets);
  },
};

const paymentCollection: ReportDef = {
  key: "payment-collection", module: "Invoicing", modulePath: "/invoicing",
  title: "Payment Collection", description: "Payments received by date with method breakdown",
  roles: ["accountant", "admin", "super_admin"],
  filters: [dateRangeFilter],
  columns: [
    { key: "payment_date", label: "Date", format: (r) => r.payment_date ? new Date(r.payment_date as string).toLocaleDateString("en-IN") : "" },
    { key: "method", label: "Method" },
    { key: "amount", label: "Amount", align: "right", format: (r) => inr(r.amount) },
    { key: "reference", label: "Reference" },
  ],
  async fetch() {
    const { data } = await supabase.from("payments").select("payment_date,method,amount,reference").order("payment_date", { ascending: false }).limit(500);
    return (data || []) as unknown as Record<string, unknown>[];
  },
};

const priceApprovalHistory: ReportDef = {
  key: "price-approval-history", module: "Invoicing", modulePath: "/invoicing",
  title: "Price Approval History", description: "Warranty/factory bill price approvals with approver and decision",
  roles: ["accountant", "admin", "super_admin"],
  filters: [dateRangeFilter],
  columns: [{ key: "note", label: "Note" }],
  fetch: emptyFetch,
};

// ----- Employees -----
const employeeMaster: ReportDef = {
  key: "employee-master", module: "Employees", modulePath: "/employees",
  title: "Employee Master", description: "Employee master list with all key fields",
  roles: ["hr_manager", "admin", "super_admin"],
  filters: [],
  columns: [
    { key: "employee_code", label: "Code" },
    { key: "full_name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "department_name", label: "Department" },
    { key: "designation", label: "Designation" },
    { key: "status", label: "Status" },
  ],
  async fetch() {
    const { data } = await supabase.from("employees").select("employee_code,full_name,email,designation,status,department:departments(name)").limit(1000);
    return (data || []).map((e: any) => ({ ...e, department_name: e.department?.name || "" }));
  },
};

const headcountByDept: ReportDef = {
  key: "headcount-by-department", module: "Employees", modulePath: "/employees",
  title: "Headcount by Department", description: "Active employee count per department",
  roles: ["hr_manager", "admin", "super_admin"],
  filters: [],
  columns: [
    { key: "department", label: "Department" },
    { key: "headcount", label: "Headcount", align: "right" },
  ],
  async fetch() {
    const { data } = await supabase.from("employees").select("department:departments(name),status");
    const agg = new Map<string, { department: string; headcount: number }>();
    (data || []).forEach((e: any) => {
      if (e.status && e.status !== "active") return;
      const d = e.department?.name || "Unassigned";
      const v = agg.get(d) || { department: d, headcount: 0 }; v.headcount += 1; agg.set(d, v);
    });
    return Array.from(agg.values()).sort((a, b) => b.headcount - a.headcount);
  },
};

const joiningExits: ReportDef = {
  key: "joining-and-exits", module: "Employees", modulePath: "/employees",
  title: "Joining & Exits", description: "Joining and exit report by date range",
  roles: ["hr_manager", "admin", "super_admin"],
  filters: [dateRangeFilter],
  columns: [
    { key: "full_name", label: "Name" },
    { key: "date_of_joining", label: "Joining", format: (r) => r.date_of_joining ? new Date(r.date_of_joining as string).toLocaleDateString("en-IN") : "" },
    { key: "date_of_exit", label: "Exit", format: (r) => r.date_of_exit ? new Date(r.date_of_exit as string).toLocaleDateString("en-IN") : "" },
  ],
  async fetch() {
    const { data } = await supabase.from("employees").select("full_name,date_of_joining,date_of_exit").limit(500);
    return (data || []) as unknown as Record<string, unknown>[];
  },
};

// ----- Attendance -----
const attendanceSummary: ReportDef = {
  key: "attendance-summary", module: "Attendance", modulePath: "/attendance",
  title: "Attendance Summary", description: "Attendance summary per employee for selected period",
  roles: ["hr_manager", "admin", "super_admin"],
  filters: [dateRangeFilter],
  columns: [{ key: "note", label: "Note" }],
  fetch: emptyFetch,
};
const lateArrivals: ReportDef = {
  key: "late-arrivals", module: "Attendance", modulePath: "/attendance",
  title: "Late Arrivals", description: "Late arrivals report",
  roles: ["hr_manager", "admin", "super_admin"],
  filters: [dateRangeFilter],
  columns: [{ key: "note", label: "Note" }], fetch: emptyFetch,
};
const overtimeReport: ReportDef = {
  key: "overtime-report", module: "Attendance", modulePath: "/attendance",
  title: "Overtime Report", description: "Overtime hours by employee",
  roles: ["hr_manager", "admin", "super_admin"],
  filters: [dateRangeFilter],
  columns: [{ key: "note", label: "Note" }], fetch: emptyFetch,
};

// ----- Leave -----
const leaveUtilization: ReportDef = {
  key: "leave-utilization", module: "Leave", modulePath: "/leave",
  title: "Leave Utilization", description: "Leave utilization per employee per leave type",
  roles: ["hr_manager", "admin", "super_admin"],
  filters: [],
  columns: [{ key: "note", label: "Note" }], fetch: emptyFetch,
};
const leaveHistory: ReportDef = {
  key: "leave-history", module: "Leave", modulePath: "/leave",
  title: "Leave History", description: "Leave history with filters",
  roles: ["hr_manager", "admin", "super_admin"],
  filters: [dateRangeFilter, { key: "status", label: "Status", type: "select", options: [
    { value: "", label: "All" }, { value: "pending", label: "Pending" }, { value: "approved", label: "Approved" }, { value: "rejected", label: "Rejected" },
  ] }],
  columns: [
    { key: "request_number", label: "Request #" },
    { key: "status", label: "Status" },
    { key: "start_date", label: "From", format: (r) => r.start_date ? new Date(r.start_date as string).toLocaleDateString("en-IN") : "" },
    { key: "end_date", label: "To", format: (r) => r.end_date ? new Date(r.end_date as string).toLocaleDateString("en-IN") : "" },
  ],
  async fetch(filters) {
    let q = supabase.from("leave_requests").select("request_number,status,start_date,end_date").order("start_date", { ascending: false }).limit(500);
    if (filters.status) q = q.eq("status", filters.status as string);
    const { data } = await q;
    return (data || []) as unknown as Record<string, unknown>[];
  },
};

// ----- Payroll -----
const salaryRegister: ReportDef = {
  key: "salary-register", module: "Payroll", modulePath: "/payroll",
  title: "Salary Register", description: "Salary Register for any payroll period",
  roles: ["hr_manager", "accountant", "admin", "super_admin"],
  filters: [{ key: "period_id", label: "Payroll Period", type: "text" }],
  columns: [{ key: "note", label: "Note" }], fetch: emptyFetch,
};
const pfEsiSummary: ReportDef = {
  key: "pf-esi-summary", module: "Payroll", modulePath: "/payroll",
  title: "PF/ESI Summary", description: "PF/ESI Summary for statutory filing",
  roles: ["hr_manager", "accountant", "admin", "super_admin"],
  filters: [dateRangeFilter],
  columns: [{ key: "note", label: "Note" }], fetch: emptyFetch,
};
const tdsSummary: ReportDef = {
  key: "tds-summary", module: "Payroll", modulePath: "/payroll",
  title: "TDS Summary", description: "TDS deducted summary",
  roles: ["accountant", "admin", "super_admin"],
  filters: [dateRangeFilter],
  columns: [{ key: "note", label: "Note" }], fetch: emptyFetch,
};

// ----- Appraisals -----
const ratingDistribution: ReportDef = {
  key: "rating-distribution", module: "Appraisals", modulePath: "/appraisals",
  title: "Rating Distribution", description: "Rating distribution by department",
  roles: ["hr_manager", "admin", "super_admin"],
  filters: [],
  columns: [{ key: "note", label: "Note" }], fetch: emptyFetch,
};
const appraisalCompletion: ReportDef = {
  key: "appraisal-completion", module: "Appraisals", modulePath: "/appraisals",
  title: "Appraisal Completion", description: "Cycle completion status",
  roles: ["hr_manager", "admin", "super_admin"],
  filters: [],
  columns: [{ key: "note", label: "Note" }], fetch: emptyFetch,
};

// ----- CRM -----
const leadSourceAnalysis: ReportDef = {
  key: "lead-source-analysis", module: "CRM", modulePath: "/crm",
  title: "Lead Source Analysis", description: "Conversion by lead source",
  roles: ["sales_rep", "sales_manager", "admin", "super_admin"],
  filters: [dateRangeFilter],
  columns: [
    { key: "source", label: "Sales Team" },
    { key: "count", label: "Opportunities", align: "right" },
    { key: "value", label: "Pipeline Value", align: "right", format: (r) => inr(r.value) },
  ],
  async fetch() {
    const { data } = await supabase.from("crm_opportunities").select("sales_team,expected_revenue");
    const agg = new Map<string, { source: string; count: number; value: number }>();
    (data || []).forEach((o: any) => {
      const k = o.sales_team || "Unknown";
      const e = agg.get(k) || { source: k, count: 0, value: 0 };
      e.count += 1; e.value += Number(o.expected_revenue || 0); agg.set(k, e);
    });
    return Array.from(agg.values()).sort((a, b) => b.value - a.value);
  },
};
const activityReport: ReportDef = {
  key: "activity-report", module: "CRM", modulePath: "/crm",
  title: "Activity Report", description: "Activities logged by user by period",
  roles: ["sales_rep", "sales_manager", "admin", "super_admin"],
  filters: [dateRangeFilter],
  columns: [
    { key: "type", label: "Type" },
    { key: "subject", label: "Subject" },
    { key: "due_date", label: "Due", format: (r) => r.due_date ? new Date(r.due_date as string).toLocaleDateString("en-IN") : "" },
    { key: "completed", label: "Completed", format: (r) => r.completed ? "Yes" : "No" },
  ],
  async fetch() {
    const { data } = await supabase.from("crm_activities").select("type,subject,due_date,completed").order("due_date", { ascending: false }).limit(500);
    return (data || []) as unknown as Record<string, unknown>[];
  },
};

export const REPORTS: ReportDef[] = [
  salesByPeriod, topCustomers, topProducts, salesBySalesperson, pipelineFunnel, outstandingQuotations,
  stockValuation, lowStock, stockMovements, qcHistory, serialTracking,
  workOrderSummary, materialConsumption, productionOutput,
  invoiceRegister, gstSummary, agingReceivables, paymentCollection, priceApprovalHistory,
  employeeMaster, headcountByDept, joiningExits,
  attendanceSummary, lateArrivals, overtimeReport,
  leaveUtilization, leaveHistory,
  salaryRegister, pfEsiSummary, tdsSummary,
  ratingDistribution, appraisalCompletion,
  leadSourceAnalysis, activityReport,
];

export function getReport(key: string): ReportDef | undefined {
  return REPORTS.find((r) => r.key === key);
}

export function getReportsByModulePath(modulePath: string): ReportDef[] {
  return REPORTS.filter((r) => r.modulePath === modulePath);
}

export function getReportsByModule(module: string): ReportDef[] {
  return REPORTS.filter((r) => r.module === module);
}

export const MODULES = Array.from(new Set(REPORTS.map((r) => r.module)));