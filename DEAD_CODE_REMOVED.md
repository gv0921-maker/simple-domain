# Dead Code Removed — Phase 8 Batch 2

Tracking removals during the UI gating / dead-route cleanup pass.

## Deleted files

| File | Reason |
| --- | --- |
| `src/pages/plm/PLMOverview.tsx` | Unrouted and unlinked; PLM module never wired up. |
| `src/pages/sales/FiscalPositionsPage.tsx` | Unrouted page; fiscal positions are managed inline on the sales order form via `useFiscalPositions`. |

The `src/pages/plm/` directory was removed (empty after deletion).

## Navigation entries removed

| Entry | File |
| --- | --- |
| `PLM_NAV` export (Overview / Products / ECOs / Versions) | `src/lib/navigation/manufacturing.ts` |
| `Fiscal Positions` link → `/sales/fiscal-positions` | `src/lib/navigation/sales.ts` |

## Routes added (previously referenced but unregistered)

| Route | Notes |
| --- | --- |
| `/sales/quotations/:id/edit` | Linked from `QuotationsList` Edit action — now resolves to `QuotationForm`. |
| `/audit-logs` | Alias of `/settings/audit`; both wrapped in `RouteGuard superAdmin`. |

## Route guards tightened (was `ProtectedRoute`, now `RouteGuard`)

Super Admin only:
- `/settings/company`, `/settings/numbering`, `/settings/payment-accounts`,
  `/settings/work-schedules`, `/settings/holidays`, `/settings/audit`,
  `/audit-logs`
- `/leave/admin/requests`, `/approvals`, `/balances`, `/entitlements`,
  `/types`, `/comp-off`

Admin or HR Manager:
- `/settings/vendors` (admin+)
- `/attendance/admin`, `/attendance/admin/import`

Factory Incharge or Admin:
- `/shop-floor`, `/shop-floor/work-orders/:id`, `/shop-floor/factory-inventory`

Already restricted via `SuperAdminRoute` (unchanged this batch):
- `/payroll/*`, `/appraisals/*`, `/settings/payroll`

## Buttons / no-op handlers

No `() => {}` or `Coming Soon` toast handlers were found on the audited
pages after Batches 1–4 of Phase 7. The earlier "Inter-warehouse Transfer
Validate" issue was already addressed when transfers were rewritten on top
of `stock_moves`; the button is wired through `useValidateTransfer`.

## Consolidated patterns

Introduced `src/hooks/auth/useRoleCheck.ts` as the canonical role hook and
`src/components/auth/{RoleGate,RouteGuard}.tsx` as the canonical gating
primitives. Existing `useIsSuperAdmin` callers remain functional and will
be migrated incrementally in Phase 8 Batch 3 alongside the cascade /
onboarding work.