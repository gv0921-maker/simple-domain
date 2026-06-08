# Sales Module — Supabase Migration (Phase 2)

## Goal
Re-point all sales pages from legacy `localStorage` storage to the Supabase-backed `@/hooks/sales` layer with **zero feature loss**. Skip CRM-backed and already-Supabase pages. Delete legacy storage once the build is clean.

## Scope

### Pages to migrate (14)
SalesOverview, CustomersList, CustomerForm, QuotationsList, QuotationForm, SalesOrdersList, SalesOrderForm, SubscriptionsList, SubscriptionForm, PricelistsPage, PricelistForm, SalesReports, CustomerPortal, CustomerPortalQuotation.

### Skipped (already correct)
- `OpportunitiesList`, `SalesPipeline`, `LeadDetail` — already on `@/hooks/crm`.
- `FiscalPositionsPage`, `PromotionsPage` — already on their own Supabase tables (`sales_fiscal_positions`, `sales_seasonal_promotions`).

## Step 1 — Schema expansion (migration)

Add the missing columns so no rich field is dropped. Pure `ALTER TABLE ADD COLUMN` (nullable / sensible defaults) — no data loss, no policy changes.

### `customers`
- `type text default 'individual'` (individual | company)
- `company text`, `default_billing_address text`, `default_delivery_address text`
- `default_pricelist_id uuid`, `default_payment_terms text`, `fiscal_position_id uuid references sales_fiscal_positions(id)`
- `salesperson_id text`, `credit_limit numeric(14,2)`
- `portal_enabled boolean default false`, `portal_token text`
- `tags text[] default '{}'`, `notes text`

### `quotations`
- B2C address fields: all 40+ billing/delivery columns (`billing_customer_name`, `billing_phone_1/2`, `billing_address_line_1/2`, `billing_city/state/zip`, `billing_location_type`, `billing_road_available_for_tempo bool`, `billing_floor_number int`, `billing_cargo_elevator bool`, `billing_staircase_width/height int`, `billing_gstin`, `billing_office_*` variants; same for delivery; `delivery_same_as_billing bool`)
- B2C summary: `total_untaxed`, `total_cgst`, `total_sgst`, `total_igst`, `total_gst`, `grand_total`, `gst_type text`, `order_discount_type text`, `order_discount_value numeric`, `order_discount_amount numeric`, `points_redeemed int`, `points_earned int`, `redemption_amount numeric`
- Workflow: `customer_name text`, `contact_id uuid`, `contact_name text`, `opportunity_id uuid`, `valid_until date`, `salesperson_id text`, `salesperson_name text`, `sales_team text`, `pricelist_id uuid references pricelists(id)`, `payment_terms text`, `global_discount numeric default 0`, `global_discount_type text default 'percentage'`, `discount_amount numeric default 0`, `terms_and_conditions text`, `sent_at timestamptz`, `accepted_at timestamptz`, `converted_to_order_id uuid`, `current_version int default 1`

### `quotation_lines`
- `product_name text`, `discount_type text default 'percentage'`, `tax_ids text[] default '{}'` (replaces single `tax_rate` for multi-tax workflows; keep `tax_rate` for back-compat), `tax_amount numeric default 0`, `total numeric default 0`, `stock_available numeric`
- B2C line fields: `barcode`, `customization`, `units numeric`, `net_amount numeric`, `gst_rate numeric`, `cgst_amount numeric`, `sgst_amount numeric`, `igst_amount numeric`, `per_line_discount_type text`, `discount_value numeric`, `discount_amount numeric`, `final_amount numeric`

### `quotation_versions` (new table)
- `id`, `quotation_id uuid references quotations(id) on delete cascade`, `version int`, `data jsonb`, `created_at`, `created_by uuid`, `change_notes text`
- RLS mirrors `quotations` (read-all authenticated, write follows parent ownership).

### `sales_orders`
- Same B2C address + summary columns as `quotations`.
- `customer_name`, `contact_id`, `contact_name`, `commitment_date date`, `salesperson_id/name`, `sales_team`, `currency text default 'INR'`, `pricelist_id`, `payment_terms`, `fiscal_position_id uuid references sales_fiscal_positions(id)`, `discount_amount numeric default 0`
- Workflow: `locked_at timestamptz`, `locked_by text`, `confirmed_at timestamptz`, `confirmed_by text`, `delivery_status text`, `invoice_status text`, `invoice_ids text[] default '{}'`, `delivery_address text`, `billing_address text`

### `order_lines`
- Mirror new `quotation_lines` columns: `product_name`, `discount_type`, `tax_ids text[]`, `tax_amount`, `total`, `invoiced_qty numeric default 0`, `reserved_stock bool default false`, plus all B2C line fields.

### `order_activities` (new table)
- `id`, `order_id uuid references sales_orders(id) on delete cascade`, `user_id text`, `user_name text`, `action text`, `details text`, `timestamp timestamptz default now()`
- RLS: read-all authenticated, insert allowed for any authenticated user with `sales_rep`/`sales_manager`/`admin`.

### `pricelists`
- `code text`, `is_default bool default false`, `parent_pricelist_id uuid references pricelists(id)`

### `pricelist_items`
- `category_id uuid`, `discount_percentage numeric`, `start_date date`, `end_date date`
- Rename concept: `pricelist_items` already stores `price`+`min_qty` — keep that, add optional discount/date for rules-style use.

### `subscriptions`
- `reference text unique`, `customer_name text`, `billing_cycle text default 'monthly'` (replaces simple `billing_period`, keep both), `end_date date`, `subtotal numeric default 0`, `tax_amount numeric default 0`, `total numeric default 0`, `currency text default 'INR'`, `payment_terms text`, `last_order_id uuid`, `order_history text[] default '{}'`

### `subscription_lines` (new table)
- `id`, `subscription_id uuid references subscriptions(id) on delete cascade`, `product_id uuid`, `product_name text`, `quantity numeric`, `unit_price numeric`, `discount numeric default 0`
- RLS mirrors `subscriptions`.

### Grants
Every new table gets `GRANT SELECT, INSERT, UPDATE, DELETE ... TO authenticated; GRANT ALL ... TO service_role;` followed by `ALTER TABLE ... ENABLE RLS` and policies (same role pattern as Phase 1).

## Step 2 — API + hooks expansion

Extend `src/lib/services/sales/api.ts`:
- Update `SbQuotation`, `SbSalesOrder`, `SbSubscription` interfaces and mappers to include every new field.
- Add nested fetch for `quotation_versions`, `order_activities`, `subscription_lines`.
- Add new mutations: `addOrderActivity`, `addQuotationVersion`, `saveSubscriptionLines`.

Extend `src/hooks/sales/index.ts`:
- Add `useAddOrderActivity`, `useAddQuotationVersion`, `useTaxRules` (keep static defaults until tax_rules table exists).

## Step 3 — Page migration (14 pages)

For each page: replace `getX()/saveX()/deleteX()` calls with `useX()/useSaveX()/useDeleteX()`. Pattern (mirrors inventory):
- List pages: `const { data = [], isLoading } = useX()` + `useDeleteX()` mutation.
- Form pages: `useX(id)` for load + `useSaveX()` for create/update; show toast on `onSuccess`/`onError`.
- Detail pages: same pattern as form pages.

Order of migration (least → most coupled):
1. `CustomersList`, `CustomerForm`
2. `PricelistsPage`, `PricelistForm`
3. `SubscriptionsList`, `SubscriptionForm`
4. `QuotationsList`, `QuotationForm`
5. `SalesOrdersList`, `SalesOrderForm`
6. `SalesOverview`, `SalesReports` (aggregates from the lists above)
7. `CustomerPortal`, `CustomerPortalQuotation` (public-facing — must keep auth flow as-is; if portal is anonymous, may need a public RPC; flag if blocked).

## Step 4 — Delete legacy

After build is clean and grep confirms no remaining imports:
- `rm src/lib/services/sales/storage.ts`
- `rm src/lib/data/sales.ts`
- `rm src/lib/data/sales/storage.ts` and `src/lib/data/sales/index.ts` if unreferenced
- Audit `src/lib/sales/*` for direct localStorage reads; convert `promotionStorage.ts` and `companySettings.ts` to Supabase-backed if they're imported by surviving code, or delete if not.
- Update `src/lib/services/sales/index.ts` to re-export only from `./api` and validators.

## Step 5 — Verify
- `tsc --noEmit` clean.
- `rg "getQuotations\\(|getSalesOrders\\(|getCustomers\\(|getPricelists\\(|getSubscriptions\\(" src/` returns zero hits.
- Manually sanity-check `CustomerPortal` flow since it may be anonymous.

## Risks / Open items
- **Customer portal**: if it serves anonymous users, RLS will block reads. May need a dedicated public RPC or a `portal_token` lookup edge function — will surface as a blocker during Step 3.7 rather than guess now.
- **TaxRules**: not part of this migration's table set. Will keep using the existing static defaults from `companySettings`/legacy storage in `salesApi` until a future migration adds a `tax_rules` table.
- This will take several turns; I'll work through it sequentially and report at each major checkpoint (schema migration, hooks ready, each batch of pages, deletes).
