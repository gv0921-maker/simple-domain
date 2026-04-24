

# Service Layer Introduction (Pre-Migration Refactor)

A pure structural refactor. No data sources change, no logic changes, no behavior changes. Every component will route through a thin service layer so a future Supabase swap touches only the service files.

## What Will Be Built

### 1. New `src/lib/services/` directory

Thin re-export modules — one per data domain. Each file mirrors the public API of its corresponding `@/lib/data/*` module without adding logic.

| File | Re-exports from | Notes |
|---|---|---|
| `services/crm.ts` | `@/lib/data/crm` | Excludes any leads exports; excludes email-send helpers (none currently exist there). Email *fields* on Contact/Opportunity stay as-is. |
| `services/sales.ts` | `@/lib/data/sales`, `@/lib/data/sales/storage`, `@/lib/data/sales/types` | Covers quotations, orders, pricelists, subscriptions, customers. `LeadDetail.tsx`/`SalesPipeline.tsx` still import legacy `Lead` from `data/sales` — those exports are preserved here for compatibility (sales-side leads, not the deleted CRM leads module). |
| `services/inventory.ts` | `@/lib/data/inventory`, `@/lib/data/inventory/storage`, `@/lib/data/inventory/types` | Products, warehouses, stock moves, transfers, locations, barcode lookups. |
| `services/accounting.ts` | `@/lib/data/accounting` | Accounts, invoices, bills, payments, journal entries. |
| `services/hr.ts` | `@/lib/data/hr` | Employees, departments, attendance, leaves, contracts. (No HR pages exist yet — file created for future use & registry symmetry.) |
| `services/manufacturing.ts` | `@/lib/data/manufacturing` | Work orders, work centers, BOMs. |
| `services/settings.ts` | `@/lib/data/rbac`, `@/lib/data/moduleTabs` | RBAC, audit logs, tab access, module tabs. Auth files NOT touched. |
| `services/index.ts` | All of the above | Namespaced re-exports (`crmService`, `salesService`, …). |
| `services/types.ts` | — | TypeScript interfaces describing each service contract (`CRMService`, `SalesService`, etc.) using `Promise<T> \| T` return shapes so a future async Supabase impl satisfies the same interface. |
| `services/registry.ts` | All services | `DB_PROVIDER` flag (default `'localStorage'`) and a `services` map. Single switch point for future DB swap. |

### 2. Component import rewrites

Every component / page file currently importing from `@/lib/data/*` is updated to import the same symbols from `@/lib/services/*`. Function signatures are unchanged because services are pure re-exports — zero logic edits.

**89 files affected**, grouped by module:

- **CRM** (8 files): `CRMKanbanBoard`, `CRMDashboard`, `CRMPipelineListView`, `CRMSearchDropdown`, `CRMActivityTimeline`, `CRMImportExport`, `CRMFormDialogs`, `ContactForm`, `CRMContactDetail`, `CRMContactsList`, `OpportunityForm`, `OpportunityDetail`, `CRMPipelinesSettings`.
- **Sales** (18 files): all of `src/pages/sales/*` and `src/components/sales/*`.
- **Inventory** (18 files): all of `src/pages/inventory/*` and `src/components/inventory/*`.
- **Accounting** (8 files): all of `src/pages/accounting/*`.
- **Manufacturing** (8 files): all of `src/pages/manufacturing/*` + `PLMOverview`.
- **Settings/RBAC** (4 files): `AuditLogs`, `CRMPipelinesSettings`, `RolesManagement`, `UsersManagement`.
- **Layout / shared** (6 files): `GlobalSearch`, `TopNav`, `ProtectedRoute`, `HomePage`, `NotFound`.
- **Hooks** (4 files): `useCRMQueries`, `useCRMPermissions`, `useInventoryPermissions`, `useTabPermissions`.
- **Internal libs** (7 files): `lib/crm/*`, `lib/sales/*` — these are sibling utility libs and will also be redirected to the service layer for consistency.

### 3. What stays untouched

- Every file under `src/lib/data/` (still the live implementation).
- Auth: `src/contexts/AuthContext.tsx`, `src/pages/auth/*`, password flows.
- Tests under `src/test/` (they test the data layer directly — left as-is).
- The Supabase scaffolding from previous turns (`crm-supabase.ts`, `useCRMQueries.ts`) — kept dormant, not wired in by this change.

## Important Notes / Deviations From Spec

1. **No HR or Manufacturing component folders exist.** `services/hr.ts` and `services/manufacturing.ts` are still created (manufacturing has pages; HR has none yet but the service is created for registry symmetry).
2. **`src/lib/data/sales` still exports `Lead`/`getLeads`/`updateLeadStatus`** consumed by `SalesPipeline.tsx` and `LeadDetail.tsx`. These are *sales pipeline* leads, distinct from the deleted CRM Leads module. Per the rule "do not change behavior", these exports are preserved through `services/sales.ts`. If you want them removed, that's a separate cleanup task.
3. **No email-send functions exist in `@/lib/data/crm`** today, so nothing needs excluding there. Email *fields* on records pass through normally.
4. **`src/lib/crm/*` and `src/lib/sales/*` helper libs** (audit, notifications, automation, pdf) also import from `@/lib/data/*`. They'll be redirected too so the rule "zero `@/lib/data/` imports outside the data and services folders" holds cleanly.
5. **Registry shape**: matches the spec — `DB_PROVIDER` env-driven, `services` object pointing to local impls today, ready to point at Supabase impls later by changing one line.

## Verification Steps After Refactor

1. `grep -r "from '@/lib/data/" src/components src/pages src/hooks src/lib/crm src/lib/sales` → must return zero matches.
2. `grep -r "from '@/lib/data/" src/lib/services` → expected matches (services re-export from data).
3. `grep -r "from '@/lib/data/" src/lib/data src/test` → expected matches (internal + tests).
4. TypeScript build passes with zero errors.
5. Manual smoke: open CRM Pipeline, Contacts, Opportunity Detail, Sales Orders, Inventory Overview, Accounting Chart of Accounts, Manufacturing Work Orders, Settings Users — all render and behave identically.

## Out of Scope (explicit)

- No data source changes.
- No Supabase wiring.
- No removal of `crm-supabase.ts` / `useCRMQueries.ts` (left in place for the next phase).
- No edits to data-layer files.
- No edits to auth, tests, or migrations.

