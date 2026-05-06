# Sales Module — Production Completion Plan

Phased build of all gaps from the verification report plus the new B2C custom fields, GST engine, loyalty system, and workflow. Work proceeds in 6 phases with a TypeScript clean check after each.

## Constraints (apply to every phase)

- Do not touch CRM module files, auth files, or `src/lib/data/` files (write new logic in `src/lib/sales/*` and update `src/lib/data/sales/types.ts` + `storage.ts` only where the spec explicitly requires it — type additions are unavoidable, so types.ts is the one allowed data-layer file to extend).
- All component/page/hook imports must go through `@/lib/services/sales`, never `@/lib/data/sales`.
- Semantic design tokens only. No hard-coded colors in components.
- Indian Rupee (₹) and en-IN locale everywhere.
- Full-page routes for new forms (Promotions). No modal dialogs for primary forms.

## Phase 1 — Types, GST engine, validators

1. Extend `Quotation`, `SalesOrder`, `OrderLine` (and the modern `QuotationLine` / `SalesOrderLine`) interfaces in `src/lib/data/sales/types.ts` with all billing/delivery/line/summary/loyalty fields and the new 5-stage `SalesOrderStatus`.
2. Add `src/lib/sales/gstCalculator.ts` (`determineGSTType`, `calculateLineTax`, `calculateOrderTotals`).
3. Add `src/lib/sales/phoneValidation.ts` (prefix-aware validator + formatter).
4. Add `src/lib/sales/gstinValidation.ts` (15-char GSTIN regex).
5. Add company `state` to settings schema (`getCompanySettings`) so GST type can be determined.
6. TS check.

## Phase 2 — Quotation & Order forms

1. `src/components/sales/BillingSection.tsx` — customer auto-fetch, dual phone w/ prefix dropdown, address, segmented `House | Flat | Office` selector, conditional fields per type, GSTIN live validation.
2. `src/components/sales/DeliverySection.tsx` — "Same as Billing" toggle with mirror/prefill behavior; identical conditional fields.
3. `src/components/sales/OrderLinesTable.tsx` — product+barcode+customization cell, units, computed net/tax/discount/final, per-line discount dropdown gated by role, drag-reorder, delete; right-aligned summary block with conditional CGST/SGST vs IGST rows, manager-only Order Discount, loyalty redemption row.
4. Wire components into `QuotationForm.tsx` and `SalesOrderForm.tsx`; auto-populate on contact select; recalc taxes on city/state change; submit-time validation with scroll-to-first-error.
5. New 5-stage chevron progress bar in `SalesOrderDetail` using existing `WorkflowStatus` pattern; role-gated transitions; auto-log into the order activity timeline.
6. TS check.

## Phase 3 — Pricing & loyalty

1. `src/lib/sales/loyaltyEngine.ts` — tiers (Bronze 0–25k, Silver 25k–1L, Gold 1L+), points rates (1/2/3 %), tier-based unit-price discount (2/5/10 %), 1:1 redemption value.
2. Extend Contact type (in `src/lib/data/sales/types.ts` SalesCustomer + a CRM-side mirror via service layer extension — no edits to `src/lib/data/crm.ts`; instead store loyalty fields in a sidecar `sales_loyalty_state` keyed by contactId managed through `@/lib/services/sales`).
3. On `delivered` status transition: update lifetime spend, recompute tier, award points, append system note to chatter.
4. Loyalty redemption row in OrderLinesTable: validates ≤ available points and ≤ 20 % of grand total; deducts on save; persists `pointsEarned`, `pointsRedeemed`, `redemptionAmount` on order.
5. `src/lib/sales/seasonalPricing.ts` + `src/pages/sales/PromotionsList.tsx` + `src/pages/sales/PromotionForm.tsx`; route `/sales/promotions`; add to `SALES_NAV`; manager/admin gated.
6. Per-role discount enforcement in OrderLinesTable (flat order discount → manager/admin only; toast + revert otherwise).
7. TS check.

## Phase 4 — Verification-report gaps

1. Fiscal Position dropdown in both forms; remap GST rates per line; tooltip in summary.
2. Stock reservation hook on `estimate → confirmed`; partial-fulfillment warning toast and red flag on under-reserved lines (no block).
3. Quotation version history panel in `QuotationForm`/detail view: version badge, history drawer, view snapshot, restore (manager/admin) — snapshot current before restore.
4. `checkExpiringQuotations()` in `src/lib/sales/automation.ts`; bootstrap from `AppLayout` with 4 h interval; routes notifications through existing notifications utility.
5. CRM ↔ Sales display: enhance existing Sales History block in `CRMContactDetail` (loyalty badge, lifetime spend, points, recent orders, "Create Quotation" prefill); add "Linked Quotations" block in `OpportunityDetail` LINKED ACTIONS area. (Read-only enhancements that consume sales services — does not modify CRM data layer.)
6. `processSubscriptionRenewals()` in automation.ts; create order from subscription template, advance `nextBillingDate`, notify salesperson; bootstrap on same interval.
7. TS check.

## Phase 5 — Supabase schema

Single migration adds:

- `sales_loyalty_tiers` (reference)
- `sales_seasonal_promotions`
- `sales_loyalty_transactions`
- New columns on `sales_quotations` and `sales_orders` matching Phase 1 types (billing/delivery JSONB block + loyalty fields + new status enum)

RLS disabled per spec. Then add new TanStack hooks under `src/hooks/sales/`: `useSeasonalPromotions`, `useSavePromotion`, `useDeletePromotion`, `useActivePromotionsForProduct`, `useLoyaltyTransactions`, `useAddLoyaltyTransaction`, `useContactLoyalty`.

## Phase 6 — Verification

- `tsc --noEmit` clean.
- `rg "@/lib/data/sales" src/{components,pages,hooks}` returns zero matches.
- Manual smoke test of the full workflow listed in the spec (quote → convert → status advance → loyalty award → tier upgrade → redemption → promotion → version history → expiry notification).

## Technical notes

- Status enum change is breaking for existing orders; migration includes a default mapping (`draft→estimate`, `confirmed→confirmed`, `locked→ready_to_pick`, `cancelled→cancelled`).
- Loyalty state is stored sales-side (sidecar table + localStorage cache) to avoid editing CRM data files; CRM views read it through `@/lib/services/sales/loyalty`.
- GST rate per line stays on the line; fiscal position remapping is applied at calculation time, not stored.
- Promotion auto-application happens when a product is selected in OrderLinesTable; the user can override via the per-line discount dropdown.
- All new components use existing shadcn primitives (Input, Select, Switch, Toggle, Table) and the WorkflowStatus pattern for the chevron bar.

```text
QuotationForm / SalesOrderForm
  ├─ BillingSection            (customer + billing + conditional)
  ├─ DeliverySection           (same-as-billing toggle + mirror)
  ├─ OrderLinesTable
  │    ├─ line rows            (product/barcode/customization + tax/discount)
  │    └─ summary              (untaxed → CGST/SGST|IGST → order disc → loyalty → grand total)
  └─ FiscalPosition select     (remaps line GST)
```
