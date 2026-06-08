
## Sales module — Supabase migration (Phase 1)

- Added 8 Sales tables (customers, quotations, quotation_lines, sales_orders, order_lines, pricelists, pricelist_items, subscriptions) with RLS: authenticated read all; sales_rep can write own rows; sales_manager / admin can write all.
- New async API at `src/lib/services/sales/api.ts` (mappers + CRUD + nested lines/items).
- New TanStack Query hooks at `src/hooks/sales/` (use{Customers,Quotations,SalesOrders,Pricelists,Subscriptions} + save/delete mutations).
- Legacy localStorage exports under `@/lib/services/sales` and `@/lib/data/sales/storage` are kept intact so existing pages keep compiling. Pages will be migrated in a follow-up step (similar to inventory).
# Inventory → Supabase Migration

## Important constraint you should know about

Your request says "keep the same function signatures so no page components need to change." That isn't physically possible: the current functions are **synchronous** (`getProducts(): Product[]` reads localStorage), and Supabase queries are **asynchronous** (return Promises). Every call site has to either become `await`-ed or move to a TanStack Query hook.

The plan below takes the same approach already used for CRM: introduce async services + `@/hooks/inventory/*` query hooks, then update pages to consume those hooks. This is more work than your message implied — please confirm you want me to proceed on that basis before I start, or pick a smaller scope.

## Database schema (single migration)

12 tables (you listed 7; lots/serials/adjustments/barcode/valuation are required for "everything inventory-related"):

```text
products              warehouses           warehouse_locations
stock_moves           stock_move_lines     transfers
transfer_lines        reorder_rules        lots
serial_numbers        inventory_adjustments   adjustment_lines
```

Highlights:
- `id uuid pk default gen_random_uuid()`, `created_at`/`updated_at timestamptz` everywhere with the existing `update_updated_at_column` trigger.
- Snake_case columns (matches Supabase types generator); service layer maps to/from the camelCase TS types.
- `products.barcode` unique-when-not-null; secondary barcodes kept as `text[]`.
- `warehouse_locations.parent_location_id` self-FK; `warehouse_locations.warehouse_id → warehouses` cascade.
- `stock_move_lines.stock_move_id → stock_moves` cascade; `transfer_lines.transfer_id → transfers` cascade; `adjustment_lines.adjustment_id → inventory_adjustments` cascade.
- All FKs to `products` are `on delete restrict` so we don't silently break history.
- Enums implemented as `text` + `CHECK` constraints (matches the rest of your DB style; safer than pg enums to evolve).

### RLS (admin-only mutations)

For every table:
```sql
ALTER TABLE ... ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_all_authenticated" ON ... FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_insert" ON ... FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "admin_update" ON ... FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_delete" ON ... FOR DELETE TO authenticated USING (public.is_admin());
```
Reuses the `public.is_admin()` helper added in the CRM RLS migration. Per your answer "Admin only", `sales_manager` etc. cannot mutate inventory.

Grants in the same migration:
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.<table> TO authenticated;
GRANT ALL ON public.<table> TO service_role;
```

## Service layer rewrite (`src/lib/services/inventory/`)

- Delete the legacy re-export shims; put real async implementations here. `src/lib/data/inventory/` keeps the type file only (`types.ts`) so existing imports of types continue to work; `storage.ts` is removed.
- Every function becomes `async` and returns a Promise. Function names are preserved (`getProducts`, `saveProduct`, `validateStockMove`, …) so search-and-replace is mechanical.
- A `mapRow*` helper per table converts snake_case rows ↔ camelCase TS types.
- `validateStockMove`, `approveAdjustment`, and `updateProductStock` execute their multi-row writes as RPC calls to new SECURITY DEFINER functions (`inv_validate_stock_move`, `inv_approve_adjustment`) so stock math is atomic instead of two round-trips.
- `getUserInventoryPermissions` / `hasInventoryPermission` become thin wrappers around `is_admin()` (everyone else is read-only) and keep the localStorage role-config (`DEFAULT_INVENTORY_ROLES`) only for the Settings UI display.

## Hooks layer (new) — `src/hooks/inventory/`

Same pattern as `src/hooks/crm`:
- Query hooks: `useProducts`, `useProduct(id)`, `useWarehouses`, `useLocations(warehouseId?)`, `useStockMoves(filters)`, `useTransfers`, `useReorderRules`, `useLots(productId?)`, `useSerials(productId?)`, `useAdjustments`, `useStockValuation`.
- Mutation hooks: `useSaveProduct`, `useDeleteProduct`, `useValidateStockMove`, `useApproveAdjustment`, etc. — each invalidates the relevant query keys.
- Centralised query key factory in `src/hooks/inventory/keys.ts`.

## Page updates

Inventory pages currently call sync storage functions directly. They will be switched to the hooks above. Affected files (already mapped):

```
src/pages/inventory/InventoryOverview.tsx
src/pages/inventory/ProductsList.tsx
src/pages/inventory/ProductDetail.tsx
src/pages/inventory/ProductScanLookup.tsx
src/pages/inventory/OperationsList.tsx
src/pages/inventory/StockMoves.tsx
src/pages/inventory/StockDashboard.tsx
src/pages/inventory/TransferForm.tsx
src/pages/inventory/TransferDetail.tsx
src/pages/inventory/WarehousesList.tsx
src/pages/inventory/WarehouseLocations.tsx
src/pages/inventory/InventoryAdjustments.tsx
src/pages/inventory/InventoryConfiguration.tsx
src/pages/inventory/InventoryReporting.tsx
src/pages/inventory/ReorderRules.tsx
src/pages/inventory/ReorderRuleForm.tsx
src/pages/inventory/BarcodeOperations.tsx
src/pages/inventory/BarcodeLabels.tsx
src/components/inventory/MobilePickingScreen.tsx
src/components/inventory/MobileCountScreen.tsx
src/components/inventory/BarcodeScanner.tsx
```

Each page gets: loading state via the hook's `isLoading`, error toast on mutation failure, and `useAuth()` to disable mutation UI when not admin.

## Out of scope (call out, don't do)

- No data migration from localStorage (you chose "start empty"). I'll leave the old `erp_inventory_*` keys untouched in the browser; nothing reads them after this change.
- Reorder rules will only flag low stock at read time; auto-creating purchase orders stays manual.
- Lot/serial expiry alerts and stock-valuation FIFO/LIFO layers stay computed client-side (no `valuation_layers` table) since you didn't list it. Easy to add later.

## Deliverables order

1. Migration (tables + RLS + grants + 2 RPCs) — surfaced for your approval.
2. After approval: rewrite `src/lib/services/inventory/`, add `src/hooks/inventory/`, then update each page.
3. Sanity-check build, fix any type fallout from the snake/camel mapping.

Reply **proceed** and I'll start with the migration. If you'd rather keep this smaller (e.g. only the 7 tables you originally named, no lots/serials/adjustments), say so and I'll trim it.
