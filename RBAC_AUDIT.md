# GLF ERP — RBAC / RLS Audit (Phase 8 Batch 1)

_Generated: 2026-06-14. Source: live `pg_policies` + `pg_class` introspection on Supabase project `mdtwvuiakvxoqvksemyt`._

Scope: every public-schema table. Only findings still open AFTER Phase 1–7 work are listed.

## Severity legend
- 🔴 CRITICAL — RLS disabled, or sensitive table exposes every row via `USING (true)`
- 🟠 HIGH — Policy present but does not enforce scope (e.g. `sales_rep` `scope:'own'` ignored)
- 🟡 MEDIUM — Policy correct but inconsistent with sibling tables, or DELETE allowed where soft-delete is the canonical pattern
- 🟢 OK — Properly scoped, not listed here

---

## 🔴 CRITICAL — RLS disabled

| Table | Status | Fix |
|---|---|---|
| `crm_leads` | RLS **off** | Module retired (memory: Leads removed). Enable RLS + deny-all; do not drop in case legacy rows exist. |
| `crm_tags` | RLS **off** | Enable RLS, allow authenticated read, admin write. |

## 🔴 CRITICAL — `USING (true)` on sensitive tables

Every authenticated user can read every row. Confirmed via `pg_policies` scan.

| Table | Policy | Notes |
|---|---|---|
| `sales_orders` | `sales_orders_select` USING `true` | Should scope `sales_rep` to `salesperson_id = get_current_employee_id()`. |
| `quotations` | `quotations_select` USING `true` | Same scope rule. |
| `customers` | `customers_select` USING `true` | Same. |
| `order_lines` | `order_lines_select` USING `true` | Inherit from parent SO. |
| `quotation_lines` | `quotation_lines_select` USING `true` | Inherit from parent quotation. |
| `invoices` | `invoices_select_auth` USING `true` | Accountant+admin see all; sales_rep only sees invoices for own SOs. |
| `payments` | `payments_select_auth` USING `true` | Same as invoices. |
| `delivery_notes` | `Authenticated can view delivery notes` USING `true` | Same scope-by-SO rule. |
| `products` | `products_select_all` USING `true` | Catalog is global — acceptable, kept OK but documented. |
| `work_orders` | `work_orders select` USING `true` | `factory_incharge` scope deferred to Batch 2 once `factory_id` link is confirmed. |

## 🔴 CRITICAL — DELETE allowed where soft-delete is canonical

| Table | Current DELETE policy | Required |
|---|---|---|
| `sales_orders` | `is_admin()` | DENY ALL (use `status='cancelled'`). |
| `quotations` | `is_admin()` | DENY ALL (use `status='cancelled'`). |
| `invoices` | mixed admin/super | DENY ALL (use credit-note / void status). |
| `delivery_notes` | `is_admin()` | DENY ALL. |
| `vendor_orders` | `is_admin()` | DENY ALL. |
| `work_orders` | `is_admin()` | DENY ALL. |
| `return_requests` | `is_admin()` | DENY ALL. |
| `customers` | `is_admin()` | DENY ALL (use `is_active=false`). |
| `products` | `is_admin()` | DENY ALL (use `is_active=false`). |
| `vendors` | `is_admin()` | DENY ALL (use `is_active=false`). |
| `employees` | `hr_manager/admin/super_admin` | DENY ALL (use `status='terminated'`). Phase 1 audit item E6. |
| `contracts` | `hr_manager/admin/super_admin` | DENY ALL (legal retention). |
| `payslips` | super_admin only ✅ | Still DENY ALL — historical retention. |
| `payroll_periods` | super_admin only ✅ | DENY ALL. |
| `activity_log` | (none) | Already implicit deny — formalise with explicit deny policy. |
| `sales_order_payments` | (none) | Add explicit deny. |

## 🟠 HIGH — Scope not enforced (deferred to Batch 2 UI gating where blocking)

| Table | Issue | Plan |
|---|---|---|
| `crm_contacts`, `crm_companies`, `crm_opportunities`, `crm_activities`, `crm_notes` | `assigned_to` column exists but SELECT not scoped to it for `sales_rep` | Scoped this batch via new policies (assigned_to OR sales_manager+). |
| `factory_inventory_items`, `factory_stock_movements` | `factory_incharge` should see only own factory | Needs `factory_id ↔ user` mapping table — **deferred to Batch 2/3**. |
| `work_orders` | Same factory scoping | **Deferred to Batch 2/3**. |
| `chat_*` | Already scoped via `is_chat_channel_admin` / membership checks | OK. |

## 🟡 MEDIUM — Inconsistencies (deferred to Batch 2)

- Mixed admin role labels: `is_admin()` (admin OR super_admin) vs explicit `has_any_role(...,['admin','super_admin'])` vs `has_role(...,'super_admin')`. Consolidate to helper functions.
- `appraisal_*` tables — currently 1 policy each, mostly USING (true). Already restricted in Phase 7 B4 at the parent `appraisals` level, but child tables still need parent-scoped read. Deferred.
- `numbering_*`, `tax_slabs`, `pricelists` — admin-only writes OK; broad reads acceptable for ERP context.
- `app_audit_logs` SELECT policy not present in baseline scan — verify in Batch 2.

## 🟢 Already enforced (Phase 1–7 work)

- `payslips`, `payroll_periods`, `salary_components`, `appraisals` — super_admin only (Phase 7 B4).
- `attendance_sessions` — self-or-HR (Phase 7 B1).
- `employee_work_schedules`, `employee_monthly_leave_allotments`, `holidays` — admin/HR write (Phase 7 B1–3).
- Chat (`chat_channels`, `chat_messages`, `chat_channel_members`) — membership-scoped.
- `notifications`, `notification_preferences` — recipient-scoped (Phase 7 B5).

## Helper-function inventory

Present: `is_admin`, `is_super_admin(_uid)`, `is_admin_or_hr`, `has_role`, `has_any_role`, `get_current_employee_id`, `is_manager_of`, `is_app_admin`, `is_chat_channel_admin`.

Missing (added this batch): `is_admin_or_super()` (no-arg convenience), `is_sales_rep_for_record(p_salesperson_id uuid)`.

## Deferred to later batches

- **Batch 2**: UI gating, dead routes (`/sales/quotations/:id/edit`, PLM, FiscalPositions), button no-ops, `app_audit_logs` policy audit, factory scoping.
- **Batch 3**: hard-delete cascade fallout (employees → payslips), employee→auth.users onboarding, soft-delete columns, missing activity_log triggers on payroll/contracts/refunds/credit_notes.