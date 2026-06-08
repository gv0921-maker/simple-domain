
-- ============================================================
-- Sales schema expansion (Phase 2)
-- ============================================================

-- ---------- customers ----------
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS company text,
  ADD COLUMN IF NOT EXISTS default_billing_address text,
  ADD COLUMN IF NOT EXISTS default_delivery_address text,
  ADD COLUMN IF NOT EXISTS default_pricelist_id uuid REFERENCES public.pricelists(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS default_payment_terms text,
  ADD COLUMN IF NOT EXISTS fiscal_position_id uuid REFERENCES public.sales_fiscal_positions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS salesperson_id text,
  ADD COLUMN IF NOT EXISTS credit_limit numeric(14,2),
  ADD COLUMN IF NOT EXISTS portal_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS portal_token text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS notes text;

-- ---------- pricelists ----------
ALTER TABLE public.pricelists
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS parent_pricelist_id uuid REFERENCES public.pricelists(id) ON DELETE SET NULL;

-- ---------- pricelist_items ----------
ALTER TABLE public.pricelist_items
  ADD COLUMN IF NOT EXISTS category_id uuid,
  ADD COLUMN IF NOT EXISTS discount_percentage numeric(6,2),
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date;

-- ---------- quotations ----------
ALTER TABLE public.quotations
  -- workflow
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS contact_id uuid,
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS opportunity_id uuid,
  ADD COLUMN IF NOT EXISTS valid_until date,
  ADD COLUMN IF NOT EXISTS salesperson_id text,
  ADD COLUMN IF NOT EXISTS salesperson_name text,
  ADD COLUMN IF NOT EXISTS sales_team text,
  ADD COLUMN IF NOT EXISTS pricelist_id uuid REFERENCES public.pricelists(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_terms text,
  ADD COLUMN IF NOT EXISTS global_discount numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS global_discount_type text NOT NULL DEFAULT 'percentage',
  ADD COLUMN IF NOT EXISTS discount_amount numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS terms_and_conditions text,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS converted_to_order_id uuid,
  ADD COLUMN IF NOT EXISTS current_version int NOT NULL DEFAULT 1,
  -- B2C billing address
  ADD COLUMN IF NOT EXISTS billing_customer_name text,
  ADD COLUMN IF NOT EXISTS billing_phone_1 text,
  ADD COLUMN IF NOT EXISTS billing_phone_2 text,
  ADD COLUMN IF NOT EXISTS billing_name text,
  ADD COLUMN IF NOT EXISTS billing_address_line_1 text,
  ADD COLUMN IF NOT EXISTS billing_address_line_2 text,
  ADD COLUMN IF NOT EXISTS billing_city text,
  ADD COLUMN IF NOT EXISTS billing_state text,
  ADD COLUMN IF NOT EXISTS billing_zip text,
  ADD COLUMN IF NOT EXISTS billing_location_type text,
  ADD COLUMN IF NOT EXISTS billing_road_available_for_tempo boolean,
  ADD COLUMN IF NOT EXISTS billing_floor_number int,
  ADD COLUMN IF NOT EXISTS billing_cargo_elevator boolean,
  ADD COLUMN IF NOT EXISTS billing_staircase_width int,
  ADD COLUMN IF NOT EXISTS billing_staircase_height int,
  ADD COLUMN IF NOT EXISTS billing_gstin text,
  ADD COLUMN IF NOT EXISTS billing_office_floor_number int,
  ADD COLUMN IF NOT EXISTS billing_office_cargo_elevator boolean,
  ADD COLUMN IF NOT EXISTS billing_office_staircase_width int,
  ADD COLUMN IF NOT EXISTS billing_office_staircase_height int,
  -- B2C delivery address
  ADD COLUMN IF NOT EXISTS delivery_same_as_billing boolean,
  ADD COLUMN IF NOT EXISTS delivery_name text,
  ADD COLUMN IF NOT EXISTS delivery_address_line_1 text,
  ADD COLUMN IF NOT EXISTS delivery_address_line_2 text,
  ADD COLUMN IF NOT EXISTS delivery_city text,
  ADD COLUMN IF NOT EXISTS delivery_state text,
  ADD COLUMN IF NOT EXISTS delivery_zip text,
  ADD COLUMN IF NOT EXISTS delivery_location_type text,
  ADD COLUMN IF NOT EXISTS delivery_road_available_for_tempo boolean,
  ADD COLUMN IF NOT EXISTS delivery_floor_number int,
  ADD COLUMN IF NOT EXISTS delivery_cargo_elevator boolean,
  ADD COLUMN IF NOT EXISTS delivery_staircase_width int,
  ADD COLUMN IF NOT EXISTS delivery_staircase_height int,
  ADD COLUMN IF NOT EXISTS delivery_gstin text,
  ADD COLUMN IF NOT EXISTS delivery_office_floor_number int,
  ADD COLUMN IF NOT EXISTS delivery_office_cargo_elevator boolean,
  ADD COLUMN IF NOT EXISTS delivery_office_staircase_width int,
  ADD COLUMN IF NOT EXISTS delivery_office_staircase_height int,
  -- B2C summary
  ADD COLUMN IF NOT EXISTS total_untaxed numeric(14,2),
  ADD COLUMN IF NOT EXISTS total_cgst numeric(14,2),
  ADD COLUMN IF NOT EXISTS total_sgst numeric(14,2),
  ADD COLUMN IF NOT EXISTS total_igst numeric(14,2),
  ADD COLUMN IF NOT EXISTS total_gst numeric(14,2),
  ADD COLUMN IF NOT EXISTS grand_total numeric(14,2),
  ADD COLUMN IF NOT EXISTS gst_type text,
  ADD COLUMN IF NOT EXISTS order_discount_type text,
  ADD COLUMN IF NOT EXISTS order_discount_value numeric(14,2),
  ADD COLUMN IF NOT EXISTS order_discount_amount numeric(14,2),
  ADD COLUMN IF NOT EXISTS points_redeemed int,
  ADD COLUMN IF NOT EXISTS points_earned int,
  ADD COLUMN IF NOT EXISTS redemption_amount numeric(14,2);

-- ---------- quotation_lines ----------
ALTER TABLE public.quotation_lines
  ADD COLUMN IF NOT EXISTS product_name text,
  ADD COLUMN IF NOT EXISTS discount_type text NOT NULL DEFAULT 'percentage',
  ADD COLUMN IF NOT EXISTS tax_ids text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tax_amount numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stock_available numeric(14,3),
  ADD COLUMN IF NOT EXISTS barcode text,
  ADD COLUMN IF NOT EXISTS customization text,
  ADD COLUMN IF NOT EXISTS units numeric(14,3),
  ADD COLUMN IF NOT EXISTS net_amount numeric(14,2),
  ADD COLUMN IF NOT EXISTS gst_rate numeric(6,2),
  ADD COLUMN IF NOT EXISTS cgst_amount numeric(14,2),
  ADD COLUMN IF NOT EXISTS sgst_amount numeric(14,2),
  ADD COLUMN IF NOT EXISTS igst_amount numeric(14,2),
  ADD COLUMN IF NOT EXISTS per_line_discount_type text,
  ADD COLUMN IF NOT EXISTS discount_value numeric(14,2),
  ADD COLUMN IF NOT EXISTS discount_amount numeric(14,2),
  ADD COLUMN IF NOT EXISTS final_amount numeric(14,2);

-- ---------- sales_orders ----------
ALTER TABLE public.sales_orders
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS contact_id uuid,
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS commitment_date date,
  ADD COLUMN IF NOT EXISTS salesperson_id text,
  ADD COLUMN IF NOT EXISTS salesperson_name text,
  ADD COLUMN IF NOT EXISTS sales_team text,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS pricelist_id uuid REFERENCES public.pricelists(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_terms text,
  ADD COLUMN IF NOT EXISTS fiscal_position_id uuid REFERENCES public.sales_fiscal_positions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS discount_amount numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_at timestamptz,
  ADD COLUMN IF NOT EXISTS locked_by text,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_by text,
  ADD COLUMN IF NOT EXISTS delivery_status text,
  ADD COLUMN IF NOT EXISTS invoice_status text,
  ADD COLUMN IF NOT EXISTS invoice_ids text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS delivery_address text,
  ADD COLUMN IF NOT EXISTS billing_address text,
  -- B2C billing
  ADD COLUMN IF NOT EXISTS billing_customer_name text,
  ADD COLUMN IF NOT EXISTS billing_phone_1 text,
  ADD COLUMN IF NOT EXISTS billing_phone_2 text,
  ADD COLUMN IF NOT EXISTS billing_name text,
  ADD COLUMN IF NOT EXISTS billing_address_line_1 text,
  ADD COLUMN IF NOT EXISTS billing_address_line_2 text,
  ADD COLUMN IF NOT EXISTS billing_city text,
  ADD COLUMN IF NOT EXISTS billing_state text,
  ADD COLUMN IF NOT EXISTS billing_zip text,
  ADD COLUMN IF NOT EXISTS billing_location_type text,
  ADD COLUMN IF NOT EXISTS billing_road_available_for_tempo boolean,
  ADD COLUMN IF NOT EXISTS billing_floor_number int,
  ADD COLUMN IF NOT EXISTS billing_cargo_elevator boolean,
  ADD COLUMN IF NOT EXISTS billing_staircase_width int,
  ADD COLUMN IF NOT EXISTS billing_staircase_height int,
  ADD COLUMN IF NOT EXISTS billing_gstin text,
  ADD COLUMN IF NOT EXISTS billing_office_floor_number int,
  ADD COLUMN IF NOT EXISTS billing_office_cargo_elevator boolean,
  ADD COLUMN IF NOT EXISTS billing_office_staircase_width int,
  ADD COLUMN IF NOT EXISTS billing_office_staircase_height int,
  -- B2C delivery
  ADD COLUMN IF NOT EXISTS delivery_same_as_billing boolean,
  ADD COLUMN IF NOT EXISTS delivery_name text,
  ADD COLUMN IF NOT EXISTS delivery_address_line_1 text,
  ADD COLUMN IF NOT EXISTS delivery_address_line_2 text,
  ADD COLUMN IF NOT EXISTS delivery_city text,
  ADD COLUMN IF NOT EXISTS delivery_state text,
  ADD COLUMN IF NOT EXISTS delivery_zip text,
  ADD COLUMN IF NOT EXISTS delivery_location_type text,
  ADD COLUMN IF NOT EXISTS delivery_road_available_for_tempo boolean,
  ADD COLUMN IF NOT EXISTS delivery_floor_number int,
  ADD COLUMN IF NOT EXISTS delivery_cargo_elevator boolean,
  ADD COLUMN IF NOT EXISTS delivery_staircase_width int,
  ADD COLUMN IF NOT EXISTS delivery_staircase_height int,
  ADD COLUMN IF NOT EXISTS delivery_gstin text,
  ADD COLUMN IF NOT EXISTS delivery_office_floor_number int,
  ADD COLUMN IF NOT EXISTS delivery_office_cargo_elevator boolean,
  ADD COLUMN IF NOT EXISTS delivery_office_staircase_width int,
  ADD COLUMN IF NOT EXISTS delivery_office_staircase_height int,
  -- B2C summary
  ADD COLUMN IF NOT EXISTS total_untaxed numeric(14,2),
  ADD COLUMN IF NOT EXISTS total_cgst numeric(14,2),
  ADD COLUMN IF NOT EXISTS total_sgst numeric(14,2),
  ADD COLUMN IF NOT EXISTS total_igst numeric(14,2),
  ADD COLUMN IF NOT EXISTS total_gst numeric(14,2),
  ADD COLUMN IF NOT EXISTS grand_total numeric(14,2),
  ADD COLUMN IF NOT EXISTS gst_type text,
  ADD COLUMN IF NOT EXISTS order_discount_type text,
  ADD COLUMN IF NOT EXISTS order_discount_value numeric(14,2),
  ADD COLUMN IF NOT EXISTS order_discount_amount numeric(14,2),
  ADD COLUMN IF NOT EXISTS points_redeemed int,
  ADD COLUMN IF NOT EXISTS points_earned int,
  ADD COLUMN IF NOT EXISTS redemption_amount numeric(14,2);

-- ---------- order_lines ----------
ALTER TABLE public.order_lines
  ADD COLUMN IF NOT EXISTS product_name text,
  ADD COLUMN IF NOT EXISTS discount_type text NOT NULL DEFAULT 'percentage',
  ADD COLUMN IF NOT EXISTS tax_ids text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tax_amount numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invoiced_qty numeric(14,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reserved_stock boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS barcode text,
  ADD COLUMN IF NOT EXISTS customization text,
  ADD COLUMN IF NOT EXISTS units numeric(14,3),
  ADD COLUMN IF NOT EXISTS net_amount numeric(14,2),
  ADD COLUMN IF NOT EXISTS gst_rate numeric(6,2),
  ADD COLUMN IF NOT EXISTS cgst_amount numeric(14,2),
  ADD COLUMN IF NOT EXISTS sgst_amount numeric(14,2),
  ADD COLUMN IF NOT EXISTS igst_amount numeric(14,2),
  ADD COLUMN IF NOT EXISTS per_line_discount_type text,
  ADD COLUMN IF NOT EXISTS discount_value numeric(14,2),
  ADD COLUMN IF NOT EXISTS discount_amount numeric(14,2),
  ADD COLUMN IF NOT EXISTS final_amount numeric(14,2);

-- ---------- subscriptions ----------
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS reference text,
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS billing_cycle text NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS subtotal numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS payment_terms text,
  ADD COLUMN IF NOT EXISTS last_order_id uuid,
  ADD COLUMN IF NOT EXISTS order_history text[] NOT NULL DEFAULT '{}';

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_reference_key ON public.subscriptions(reference) WHERE reference IS NOT NULL;

-- =================== quotation_versions (new) ===================
CREATE TABLE IF NOT EXISTS public.quotation_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  version int NOT NULL,
  data jsonb NOT NULL,
  change_notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_quotation_versions_quotation ON public.quotation_versions(quotation_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotation_versions TO authenticated;
GRANT ALL ON public.quotation_versions TO service_role;
ALTER TABLE public.quotation_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quotation_versions_select" ON public.quotation_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "quotation_versions_write" ON public.quotation_versions FOR ALL TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['admin','sales_manager']::app_role[])
    OR EXISTS (
      SELECT 1 FROM public.quotations q
      WHERE q.id = quotation_versions.quotation_id
        AND public.has_role(auth.uid(),'sales_rep'::app_role)
        AND q.created_by = auth.uid()
    )
  )
  WITH CHECK (
    public.has_any_role(auth.uid(), ARRAY['admin','sales_manager','sales_rep']::app_role[])
  );

-- =================== order_activities (new) ===================
CREATE TABLE IF NOT EXISTS public.order_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  user_id text,
  user_name text,
  action text NOT NULL,
  details text,
  "timestamp" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_order_activities_order ON public.order_activities(order_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_activities TO authenticated;
GRANT ALL ON public.order_activities TO service_role;
ALTER TABLE public.order_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_activities_select" ON public.order_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "order_activities_insert" ON public.order_activities FOR INSERT TO authenticated
  WITH CHECK (
    public.has_any_role(auth.uid(), ARRAY['admin','sales_manager','sales_rep']::app_role[])
  );
CREATE POLICY "order_activities_update" ON public.order_activities FOR UPDATE TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['admin','sales_manager']::app_role[])
  );
CREATE POLICY "order_activities_delete" ON public.order_activities FOR DELETE TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['admin','sales_manager']::app_role[])
  );

-- =================== subscription_lines (new) ===================
CREATE TABLE IF NOT EXISTS public.subscription_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text,
  quantity numeric(14,3) NOT NULL DEFAULT 1,
  unit_price numeric(14,2) NOT NULL DEFAULT 0,
  discount numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subscription_lines_subscription ON public.subscription_lines(subscription_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscription_lines TO authenticated;
GRANT ALL ON public.subscription_lines TO service_role;
ALTER TABLE public.subscription_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscription_lines_select" ON public.subscription_lines FOR SELECT TO authenticated USING (true);
CREATE POLICY "subscription_lines_write" ON public.subscription_lines FOR ALL TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['admin','sales_manager']::app_role[])
    OR EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.id = subscription_lines.subscription_id
        AND public.has_role(auth.uid(),'sales_rep'::app_role)
        AND s.created_by = auth.uid()
    )
  )
  WITH CHECK (
    public.has_any_role(auth.uid(), ARRAY['admin','sales_manager','sales_rep']::app_role[])
  );

CREATE TRIGGER trg_subscription_lines_updated_at BEFORE UPDATE ON public.subscription_lines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
