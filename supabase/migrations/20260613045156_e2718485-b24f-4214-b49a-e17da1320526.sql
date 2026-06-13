-- Phase 2 Batch 1: Enhanced Sales Order schema

-- 1) sales_orders new columns
ALTER TABLE public.sales_orders
  ADD COLUMN IF NOT EXISTS no_quote_flag boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS advance_percent_required numeric DEFAULT 40,
  ADD COLUMN IF NOT EXISTS advance_percent_received numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS advance_override_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS advance_override_reason text,
  ADD COLUMN IF NOT EXISTS advance_override_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_and_conditions text,
  ADD COLUMN IF NOT EXISTS customer_signature_received boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS customer_signature_date date,
  ADD COLUMN IF NOT EXISTS eta_overall date;

-- 2) order_lines new columns
ALTER TABLE public.order_lines
  ADD COLUMN IF NOT EXISTS product_source text DEFAULT 'warehouse',
  ADD COLUMN IF NOT EXISTS customization_size text,
  ADD COLUMN IF NOT EXISTS customization_colour text,
  ADD COLUMN IF NOT EXISTS customization_fabric text,
  ADD COLUMN IF NOT EXISTS customization_polish text,
  ADD COLUMN IF NOT EXISTS customization_notes text,
  ADD COLUMN IF NOT EXISTS customization_reference_images jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS line_eta date,
  ADD COLUMN IF NOT EXISTS vendor_id uuid,
  ADD COLUMN IF NOT EXISTS factory_work_order_id uuid;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='order_lines_product_source_chk') THEN
    ALTER TABLE public.order_lines
      ADD CONSTRAINT order_lines_product_source_chk
      CHECK (product_source IN ('display','warehouse','vendor','factory'));
  END IF;
END $$;

-- Sales orders status enrichment via check constraint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sales_orders_status_chk') THEN
    ALTER TABLE public.sales_orders
      ADD CONSTRAINT sales_orders_status_chk
      CHECK (status IN (
        'draft','awaiting_advance','confirmed','fulfilling','ready_to_invoice',
        'invoicing','invoiced','delivering','delivered','closed','cancelled',
        -- legacy values kept for back-compat
        'estimate','paid','ready_to_pick','dispatched','locked'
      ));
  END IF;
END $$;

-- 3) product_customization_options
CREATE TABLE IF NOT EXISTS public.product_customization_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  option_type text NOT NULL CHECK (option_type IN ('size','colour','fabric','polish')),
  option_value text NOT NULL,
  additional_price numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS product_customization_options_uniq
  ON public.product_customization_options(product_id, option_type, option_value);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_customization_options TO authenticated;
GRANT ALL ON public.product_customization_options TO service_role;

ALTER TABLE public.product_customization_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pco_select_authenticated"
  ON public.product_customization_options FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "pco_admin_insert"
  ON public.product_customization_options FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "pco_admin_update"
  ON public.product_customization_options FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "pco_admin_delete"
  ON public.product_customization_options FOR DELETE
  TO authenticated USING (public.is_admin());

CREATE TRIGGER trg_pco_updated_at
  BEFORE UPDATE ON public.product_customization_options
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) company_settings — default advance %
ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS default_advance_percent numeric DEFAULT 40;

-- 5) Helper: calculate_so_advance_percent
CREATE OR REPLACE FUNCTION public.calculate_so_advance_percent(p_so_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total numeric;
  v_paid numeric;
BEGIN
  SELECT COALESCE(total, 0) INTO v_total FROM public.sales_orders WHERE id = p_so_id;
  IF v_total IS NULL OR v_total = 0 THEN RETURN 0; END IF;
  SELECT COALESCE(SUM(amount), 0) INTO v_paid
    FROM public.payments
    WHERE sales_order_id = p_so_id;
  RETURN ROUND((v_paid / v_total) * 100, 2);
END;
$$;

-- 6) Helper: check_advance_gate
CREATE OR REPLACE FUNCTION public.check_advance_gate(p_so_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_required numeric;
  v_received numeric;
  v_override uuid;
BEGIN
  SELECT advance_percent_required, advance_override_by INTO v_required, v_override
    FROM public.sales_orders WHERE id = p_so_id;
  IF v_override IS NOT NULL THEN RETURN true; END IF;
  v_received := public.calculate_so_advance_percent(p_so_id);
  RETURN COALESCE(v_received, 0) >= COALESCE(v_required, 40);
END;
$$;
