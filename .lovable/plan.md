## Build Polish Batch 3 — Reports & Exports Module

This is a large, multi-module addition (~40+ report pages, framework, migration, hub, exports). Before I start writing code, I want to confirm scope and sequencing so we don't end up with a half-built framework.

### What I'll build

**1. Database (1 migration)**
- `saved_reports` (user_id, report_key, name, description, filters_json, columns_json, sort_by, sort_dir, is_shared, shared_with_role)
- `scheduled_reports` (saved_report_id, schedule, schedule_day, schedule_date, delivery_email, last_run_at, next_run_at, is_active, created_by)
- RLS: users manage their own; shared reports visible by matching role; GRANTs to authenticated + service_role.

**2. Framework (shared)**
- `src/lib/reports/exporters.ts` — CSV (no dep), Excel (`xlsx`), PDF (`jspdf` + `jspdf-autotable`) with GLF letterhead.
- `src/components/reports/ReportShell.tsx` — title, filter chips, expandable filter panel, desktop table + mobile cards, sticky export toolbar, Save Filter / Schedule dialogs, drill-down via `onRowClick`.
- `src/hooks/reports/useSavedReports.ts`, `useScheduledReports.ts` (TanStack Query).
- Filter primitives: date range, select, multi-select, text.

**3. Reports Hub**
- `/reports` — grouped by module, search, favorites (localStorage), recent (localStorage), saved reports section.
- Avatar menu entry "Reports".

**4. Per-module Reports** (each is a route + page using ReportShell, plus a "Reports" landing page per module that lists its reports)
- Sales (6), Inventory (5), Manufacturing (3), Invoicing (5), Employees (3), Attendance (3), Leave (2), Payroll (3), Appraisals (2), CRM (2). **34 report pages + 10 module-reports landing pages**.
- Add "Reports" link to each `*_NAV` array.

**5. RBAC gating**
- Use existing `has_any_role` / `RoleGate`. Sales reports → sales_rep+; financial (aging, GST, payment, price approvals) → accountant/admin+; HR/Payroll/Leave/Attendance/Appraisal → hr_manager/admin+; Inventory → warehouse_operator+; Manufacturing → admin+; CRM → sales_rep+.

**6. Mobile**
- Collapsed filter bar with Expand button, cards on mobile (`md:hidden`/`hidden md:block`), sticky bottom export toolbar on mobile.

### What I want to confirm before starting

This batch will touch ~60 new files and edit ~12 navigation/app files. To keep it shippable and reviewable I'd like to confirm two things:

**A. Data depth per report.** Many of these (GST summary, PF/ESI, TDS, aging buckets, pipeline conversion, BOM material consumption) require non-trivial aggregations against existing tables. Two options:

1. **Real aggregations now** — write the SQL/JS aggregation logic for every report against existing schema. Higher value, but some reports (PF/ESI, TDS, GSTR-1 style) need fields we may not have and will end up partially empty. ~2× the work.
2. **Framework + working reports for what the schema already supports cleanly, stubs for the rest** — every report page exists, uses ReportShell, has filters/exports wired up, but data-thin reports show an "Insufficient data" empty state with a note about which fields are missing. Then we iterate. *Recommended* — gets the framework + exports + hub shipped cleanly without faking numbers.

**B. Saved/Scheduled reports execution.** Per spec, actual email delivery is out of scope — we just store the schedule and expose "Send Now" (which triggers a client-side export download). Confirming that's what you want, vs. wiring an edge function now.

**C. Excel/PDF deps.** `xlsx`, `jspdf`, `jspdf-autotable` — I'll add these. `xlsx` from npm has a known CVE for old versions; I'll install the latest. OK?

If you say "go with A2, B as stated, C yes" I'll execute end-to-end in one pass.
