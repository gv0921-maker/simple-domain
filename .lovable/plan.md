# OrderLinesTable Redesign — Odoo-Style Clean Layout

UI-only rewrite of `src/components/sales/OrderLinesTable.tsx`. All calculation logic (`recomputeLine`, `calculateLineTax`, `calculateOrderTotals`, discount/loyalty/seasonal flows) is preserved verbatim. Both `QuotationForm` and `SalesOrderForm` consume this single component, so the redesign covers both.

## Implementation Order

1. Read the current `OrderLinesTable.tsx` end-to-end and map out which helpers and computed values must remain (`recomputeLine`, `productMap`/`barcodeMap`, `applySeasonalForLine`, `totals`, `grandAfterPoints`, `useMemoNotify`).
2. Build the new layout as a separate render section inside the file. Keep the old JSX untouched while wiring the new markup to the existing handlers.
3. Run TypeScript check on the dual-render version.
4. Swap out the old JSX in one edit — no mixed markup left behind.
5. Final TypeScript check — zero errors.
6. Verify in preview at 1280px on both `/sales/quotations/new` and `/sales/orders/new`: no horizontal scroll inside the Order Lines card.

## New Table Structure

```text
⠿ | Product                | Qty   | Unit Price | Disc.% | Amount  | 🗑
──┼────────────────────────┼───────┼────────────┼────────┼─────────┼──
⠿ | Product name ▾         | 1.00  | ₹2,000.00  | 0.00   | ₹2,000  | 🗑
  | [GST 18%]              |       |            |        |         |
  | [barcode] (hover/val)  |       |            |        |         |
  | customization (hover)  |       |            |        |         |
```

`table-fixed`, widths chosen so the whole table fits a card at 1280px viewport:

| Col | Width |
|---|---|
| Drag handle | 24px |
| Product | flex (auto) |
| Qty | 80px |
| Unit Price | 110px |
| Disc.% | 80px |
| Amount | 100px |
| Delete | 32px |

## Row Reveal — State Driven

Use a `useState<string | null>(hoveredRowId)` plus a `focusedRowId` state. Barcode + customization rows render when:
- the row id matches `hoveredRowId` or `focusedRowId`, OR
- the corresponding field already has a value.

Pure CSS `:hover` is not enough because the input must stay visible after the mouse leaves while the field is focused. Handlers: `onMouseEnter`/`onMouseLeave` on the `<tr>`, `onFocusCapture`/`onBlurCapture` to track focus inside the row.

Active row gets `bg-muted/30`; delete button and drag handle render only in the revealed state.

## GST Rate — Inline Popover

GST% column is removed. Each product cell shows a small badge `GST 18%` (10px, `bg-muted`, rounded). Click opens the existing `@/components/ui/popover`:

```text
GST Rate
[ 18 ] %
Common: [0] [5] [12] [18] [28]
```

- Quick-select buttons set the rate directly.
- Enter or outside-click closes.
- Writes via existing `updateLine(line.id, { gstRate })`.

No new packages.

## Discount — Inline Type Selector

The per-line discount-type column is removed. The Disc.% cell shows only the percentage input. When focused or when the row has a non-default `perLineDiscountType`, a small segmented control renders below the input: `[Item %] [Loyalty] [Seasonal]` (Flat Order remains order-level only).

- Loyalty / Seasonal → input becomes read-only and reflects the auto-resolved rate; tiny caption shows promo name (via `applySeasonalForLine`).
- Respects existing `allowedLineDiscountTypes`. When the user has no discount permission, the input is replaced by a lock icon.

## Amount Column

Read-only `finalAmount`. Wrapped in `Tooltip` from `@/components/ui/tooltip` with the breakdown, all in en-IN `₹`:

```text
Net:        ₹2,000.00
GST (18%):  ₹360.00
Discount:  -₹0.00
Total:      ₹2,360.00
```

All numbers reused from the per-line computed fields; nothing recalculated.

## Summary Panel

Below the table, right-aligned, `max-w-sm ml-auto`:

```text
Total Untaxed Amount      ₹2,000.00
──────────────────────────────────
CGST (9%)                   ₹180.00     (or IGST when inter-state)
SGST (9%)                   ₹180.00
Total GST                   ₹360.00
──────────────────────────────────
Order Discount  [%|₹] [__]  -₹0.00      (manager/admin only)
Loyalty Points  …                       (only when points available)
──────────────────────────────────
Grand Total                 ₹2,360.00   (bold, text-primary)
```

Same data the current summary emits; only spacing and dividers change.

## Card Wrapper

```tsx
<Card>
  <CardHeader className="pb-3">
    <CardTitle className="text-base flex items-center gap-2">
      <ShoppingCart className="h-4 w-4" /> Order Lines
    </CardTitle>
  </CardHeader>
  <CardContent className="p-0">…table + add link + summary…</CardContent>
</Card>
```

## Add Line

Replaces the outlined button:

```tsx
<button className="text-primary text-sm font-medium hover:underline inline-flex items-center gap-1">
  <Plus className="h-3.5 w-3.5" /> Add a product
</button>
```

## Removed From Current UI

- `overflow-x-auto` wrapper and horizontal scroll
- CGST / SGST / IGST table columns (summary only)
- GST% table column (moved to badge + popover)
- Discount type table column (moved to inline selector)
- Net Amount column (folded into Amount tooltip)
- Always-visible drag handle (hover/focus only)

## Preserved (no logic changes)

- `recomputeLine`, `calculateLineTax`, `calculateOrderTotals`
- `gstType` switching (intra vs inter state)
- Discount types, role gating via `canApplyOrderDiscount` / `allowedLineDiscountTypes`
- Product and barcode lookup via `productMap` / `barcodeMap`
- Customization text, line reorder, `onTotalsChange` microtask emit
- Loyalty redemption controls and the 20% cap
- The generic `Props<L>` API — Quotation and Sales Order line types keep compiling

## Files

- Edit only: `src/components/sales/OrderLinesTable.tsx`
- No changes to `QuotationForm.tsx`, `SalesOrderForm.tsx`, types, or data layer.

## Verification Gates

- `tsc` shows zero errors after the swap.
- Preview at 1280px on `/sales/quotations/new` and `/sales/orders/new`: Order Lines card has no horizontal scrollbar; columns line up; barcode and customization stay hidden until row hover/focus or value present.
