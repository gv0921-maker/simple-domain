# GLF ERP — Build Complete

End-to-end rebuild finished across 7 phases, ending with the Phase 8 RBAC audit + enforcement work. This document is the canonical "what shipped, what didn't" summary.

## Phases delivered

1. **Phase 1 — Foundations**: Supabase migration baseline, activity log + `trackChanges` helper, design system, navigation shell.
2. **Phase 2 — Sales lifecycle**: Quotations → Sales Orders → Delivery Notes → Invoices → Payments with pricelists, promotions, GST, advance-gate, multi-currency in INR.
3. **Phase 3 — Inventory**: Unified stock-move model, warehouses, lots/serials, internal transfers, goods receipts, stock counts, write-offs, correction orders, barcode workspace.
4. **Phase 4 — Manufacturing + Shop Floor + Vendor Orders**: BOMs, work orders, work centers, factory-side shop-floor app, vendor orders w/ receipts.
5. **Phase 5 — Invoicing + Delivery + Returns + Credit Notes + Refunds**: Full reverse-logistics chain with audit trails.
6. **Phase 6 — HR**: Employees, departments, contracts, attendance + rosters, leave (types/balances/entitlements/comp-off/approvals), org chart, holidays, payroll (periods, payslips, settings), appraisals.
7. **Phase 7 — Workflows + Notifications**: Unified calendar, payroll lockdown, conditional ESI/PT logic, in-app + browser notifications with quiet hours and per-category sounds.
8. **Phase 8 — RBAC Audit & Enforcement** (this batch):
   - **Batch 1** (audit + RLS): RBAC_AUDIT.md, RBAC_MATRIX.md, helper SQL functions, RLS hardening, hard-delete blocks on 16 tables.
   - **Batch 2** (UI gating + dead code): `useRoleCheck` + `RoleGate` + `RouteGuard` primitives, route-level guards, removal of dead pages.
   - **Batch 3** (data integrity + onboarding): see below.

## Phase 8 Batch 3 — what shipped

### Data integrity
- Replaced `ON DELETE CASCADE` with `ON DELETE RESTRICT` on 21 sensitive child→parent FKs (employees, customers, products, warehouses, sales_orders). Combined with the DELETE-deny RLS policies from Batch 1, accidental cascades can no longer wipe payslips, contracts, invoices, etc.
- Added soft-delete columns: `employees.is_active / terminated_at / termination_reason`, `customers.is_active / archived_at / archive_reason`, `products.is_active / discontinued_at / discontinuation_reason`. `vendors.is_active` already existed.
- Added `employees.auth_user_id uuid UNIQUE → auth.users(id)` for auth linkage.

### Audit triggers
Generic `log_row_change()` trigger attached to: `payslips`, `salary_components`, `contracts`, `refunds`, `credit_notes`, `app_user_role_assignments`, `crm_leads`, `crm_opportunities`, `holidays`, `payroll_settings`, `company_settings`. Inserts a `created` / `field_change` / `deleted` row into `activity_log` with per-field diffs.

### Employee → auth onboarding
- Edge function `create-employee-with-login` (in `supabase/functions/create-employee-with-login/index.ts`):
  - Verifies caller is `super_admin` or `hr_manager`.
  - Calls `auth.admin.createUser` (service role) with `user_metadata.password_must_change = true`.
  - Inserts the `employees` row with `auth_user_id` set.
  - Assigns the chosen role via `user_roles`.
  - Returns `{ employee_id, auth_user_id, login_email, temporary_password }` for one-time display in the UI.
  - Best-effort rollback of the auth user if the employee insert fails.
- UI integration: the existing Employee form keeps working; product owners can wire a "Create with login" button that calls `supabase.functions.invoke('create-employee-with-login', { body: { employee_data, role } })`.

### Factory_incharge scoping
- New table `factory_user_assignments(user_id, factory_id, is_active, …)` mapping users to factory warehouses.
- Helper `public.is_factory_user_for(p_factory_id uuid)`.
- `work_orders` RLS now restricts factory_incharge users to records where `assigned_factory_incharge_id = auth.uid()`.
- Settings → Users page needs a small "Factory Assignment" UI hook-up (rows-table CRUD against `factory_user_assignments`); the data plumbing is in place.

### Call-site consolidation
- `useIsSuperAdmin` is now a thin deprecated wrapper around `useRoleCheck` (returns `{ isAdmin: isAdminOrSuper, loading }`). All 25 existing call sites keep working; future code should use `useRoleCheck()` directly.
- Fixed a latent bug in `CorrectionOrderDetail.tsx` that destructured `useIsSuperAdmin` incorrectly.

### Search-path hardening
- `has_role`, `is_admin_or_super`, `_can_see_all_sales` now have `SET search_path = public`.

## Known limitations / future work

- **POS module**: not built (per product decision).
- **Accounting/GL module**: not built (per product decision).
- **Docker self-hosting**: packaging still pending; codebase is self-host-ready (Supabase + Vite static), but no `docker-compose.yml` shipped.
- **eSSL biometric sync**: out of scope; attendance import accepts CSV today.
- **Inline `<RoleGate>` wrapping** of every individual action button (Cancel Order, Void Invoice, Approve Return, etc.) is partially in place via the capability flags on `useRoleCheck`. Pages that still rely on `useIsSuperAdmin().isAdmin` are correctly gated (admin OR super_admin); migrating each to the precise capability flag (e.g. `canVoidInvoice`, `canApproveReturn`) is a per-page cleanup that can be done incrementally without functional impact.
- **RLS linter**: ~310 pre-existing linter warnings (mostly older `USING (true)` policies on non-sensitive lookup tables and function-search-path warnings on legacy functions). Critical tables were hardened in Batch 1; the remainder is tracked in `RBAC_AUDIT.md`.
- **Cascade hardening**: applied to the 21 highest-risk FKs. Other CASCADEs on truly child-owned rows (e.g. `order_lines → sales_orders`, `quotation_lines → quotations`) were intentionally kept because the child row has no independent meaning without its parent.
- **`factory_inventory_items` scoping**: the table has no `factory_warehouse_id` column today, so per-factory RLS was deferred. Items are still gated by the existing admin-or-super read policy.

## Supabase Storage buckets (manual creation required)

Create these in Supabase Dashboard → Storage:

- `employee-documents` (private) — profile photos, ID copies, contracts.
- `product-images` (public) — product catalog imagery.
- `chat-attachments` (private) — chat upload payloads.
- `print-templates` (private) — letterhead/logo assets for PDF generation.
- `backups` (private) — AES-256 backup archives.

## Edge functions deployed

- `crm-api` — REST proxy for the CRM module.
- `crm-openapi` — OpenAPI spec for the CRM module.
- `create-employee-with-login` — onboarding (this batch).

## Reference documents

- `RBAC_AUDIT.md` — table-by-table audit, severity levels, remaining risks.
- `docs/RBAC_MATRIX.md` — canonical role-to-capability matrix.
- `DEAD_CODE_REMOVED.md` — log of removed pages/routes/buttons.
- `WORKFLOW_AUDIT.md` — workflow inventory from Phase 7.

GLF ERP rebuild complete. 🎯