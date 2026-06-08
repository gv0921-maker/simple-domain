
-- =========================================================
-- Sales module schema
-- =========================================================

-- Helper for updated_at already exists: public.update_updated_at_column()

-- =================== customers ===================
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  address text,
  gstin text,
  contact_person text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_select" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "customers_insert" ON public.customers FOR INSERT TO authenticated
  WITH CHECK (
    public.has_any_role(auth.uid(), ARRAY['admin','sales_manager','sales_rep']::app_role[])
    AND created_by = auth.uid()
  );
CREATE POLICY "customers_update" ON public.customers FOR UPDATE TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['admin','sales_manager']::app_role[])
    OR (public.has_role(auth.uid(),'sales_rep'::app_role) AND created_by = auth.uid())
  );
CREATE POLICY "customers_delete" ON public.customers FOR DELETE TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['admin','sales_manager']::app_role[])
    OR (public.has_role(auth.uid(),'sales_rep'::app_role) AND created_by = auth.uid())
  );

CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =================== quotations ===================
CREATE TABLE public.quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  expiry_date date,
  status text NOT NULL DEFAULT 'draft',
  notes text,
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  tax_amount numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotations TO authenticated;
GRANT ALL ON public.quotations TO service_role;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quotations_select" ON public.quotations FOR SELECT TO authenticated USING (true);
CREATE POLICY "quotations_insert" ON public.quotations FOR INSERT TO authenticated
  WITH CHECK (
    public.has_any_role(auth.uid(), ARRAY['admin','sales_manager','sales_rep']::app_role[])
    AND created_by = auth.uid()
  );
CREATE POLICY "quotations_update" ON public.quotations FOR UPDATE TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['admin','sales_manager']::app_role[])
    OR (public.has_role(auth.uid(),'sales_rep'::app_role) AND created_by = auth.uid())
  );
CREATE POLICY "quotations_delete" ON public.quotations FOR DELETE TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['admin','sales_manager']::app_role[])
    OR (public.has_role(auth.uid(),'sales_rep'::app_role) AND created_by = auth.uid())
  );

CREATE TRIGGER trg_quotations_updated_at BEFORE UPDATE ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =================== quotation_lines ===================
CREATE TABLE public.quotation_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  description text,
  quantity numeric(14,3) NOT NULL DEFAULT 1,
  unit_price numeric(14,2) NOT NULL DEFAULT 0,
  discount numeric(14,2) NOT NULL DEFAULT 0,
  tax_rate numeric(6,2) NOT NULL DEFAULT 0,
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_quotation_lines_quotation ON public.quotation_lines(quotation_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotation_lines TO authenticated;
GRANT ALL ON public.quotation_lines TO service_role;
ALTER TABLE public.quotation_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quotation_lines_select" ON public.quotation_lines FOR SELECT TO authenticated USING (true);
CREATE POLICY "quotation_lines_write" ON public.quotation_lines FOR ALL TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['admin','sales_manager']::app_role[])
    OR EXISTS (
      SELECT 1 FROM public.quotations q
      WHERE q.id = quotation_lines.quotation_id
        AND public.has_role(auth.uid(),'sales_rep'::app_role)
        AND q.created_by = auth.uid()
    )
  )
  WITH CHECK (
    public.has_any_role(auth.uid(), ARRAY['admin','sales_manager','sales_rep']::app_role[])
  );

CREATE TRIGGER trg_quotation_lines_updated_at BEFORE UPDATE ON public.quotation_lines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =================== sales_orders ===================
CREATE TABLE public.sales_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  quotation_id uuid REFERENCES public.quotations(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  delivery_date date,
  status text NOT NULL DEFAULT 'draft',
  notes text,
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  tax_amount numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_orders TO authenticated;
GRANT ALL ON public.sales_orders TO service_role;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sales_orders_select" ON public.sales_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "sales_orders_insert" ON public.sales_orders FOR INSERT TO authenticated
  WITH CHECK (
    public.has_any_role(auth.uid(), ARRAY['admin','sales_manager','sales_rep']::app_role[])
    AND created_by = auth.uid()
  );
CREATE POLICY "sales_orders_update" ON public.sales_orders FOR UPDATE TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['admin','sales_manager']::app_role[])
    OR (public.has_role(auth.uid(),'sales_rep'::app_role) AND created_by = auth.uid())
  );
CREATE POLICY "sales_orders_delete" ON public.sales_orders FOR DELETE TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['admin','sales_manager']::app_role[])
    OR (public.has_role(auth.uid(),'sales_rep'::app_role) AND created_by = auth.uid())
  );

CREATE TRIGGER trg_sales_orders_updated_at BEFORE UPDATE ON public.sales_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =================== order_lines ===================
CREATE TABLE public.order_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  description text,
  quantity numeric(14,3) NOT NULL DEFAULT 1,
  unit_price numeric(14,2) NOT NULL DEFAULT 0,
  discount numeric(14,2) NOT NULL DEFAULT 0,
  tax_rate numeric(6,2) NOT NULL DEFAULT 0,
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  delivered_qty numeric(14,3) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_lines_order ON public.order_lines(order_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_lines TO authenticated;
GRANT ALL ON public.order_lines TO service_role;
ALTER TABLE public.order_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_lines_select" ON public.order_lines FOR SELECT TO authenticated USING (true);
CREATE POLICY "order_lines_write" ON public.order_lines FOR ALL TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['admin','sales_manager']::app_role[])
    OR EXISTS (
      SELECT 1 FROM public.sales_orders o
      WHERE o.id = order_lines.order_id
        AND public.has_role(auth.uid(),'sales_rep'::app_role)
        AND o.created_by = auth.uid()
    )
  )
  WITH CHECK (
    public.has_any_role(auth.uid(), ARRAY['admin','sales_manager','sales_rep']::app_role[])
  );

CREATE TRIGGER trg_order_lines_updated_at BEFORE UPDATE ON public.order_lines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =================== pricelists ===================
CREATE TABLE public.pricelists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  start_date date,
  end_date date,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pricelists TO authenticated;
GRANT ALL ON public.pricelists TO service_role;
ALTER TABLE public.pricelists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pricelists_select" ON public.pricelists FOR SELECT TO authenticated USING (true);
CREATE POLICY "pricelists_insert" ON public.pricelists FOR INSERT TO authenticated
  WITH CHECK (
    public.has_any_role(auth.uid(), ARRAY['admin','sales_manager','sales_rep']::app_role[])
    AND created_by = auth.uid()
  );
CREATE POLICY "pricelists_update" ON public.pricelists FOR UPDATE TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['admin','sales_manager']::app_role[])
    OR (public.has_role(auth.uid(),'sales_rep'::app_role) AND created_by = auth.uid())
  );
CREATE POLICY "pricelists_delete" ON public.pricelists FOR DELETE TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['admin','sales_manager']::app_role[])
    OR (public.has_role(auth.uid(),'sales_rep'::app_role) AND created_by = auth.uid())
  );

CREATE TRIGGER trg_pricelists_updated_at BEFORE UPDATE ON public.pricelists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =================== pricelist_items ===================
CREATE TABLE public.pricelist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pricelist_id uuid NOT NULL REFERENCES public.pricelists(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  price numeric(14,2) NOT NULL DEFAULT 0,
  min_qty numeric(14,3) NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pricelist_items_pricelist ON public.pricelist_items(pricelist_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pricelist_items TO authenticated;
GRANT ALL ON public.pricelist_items TO service_role;
ALTER TABLE public.pricelist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pricelist_items_select" ON public.pricelist_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "pricelist_items_write" ON public.pricelist_items FOR ALL TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['admin','sales_manager']::app_role[])
    OR EXISTS (
      SELECT 1 FROM public.pricelists p
      WHERE p.id = pricelist_items.pricelist_id
        AND public.has_role(auth.uid(),'sales_rep'::app_role)
        AND p.created_by = auth.uid()
    )
  )
  WITH CHECK (
    public.has_any_role(auth.uid(), ARRAY['admin','sales_manager','sales_rep']::app_role[])
  );

CREATE TRIGGER trg_pricelist_items_updated_at BEFORE UPDATE ON public.pricelist_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =================== subscriptions ===================
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  next_billing_date date,
  status text NOT NULL DEFAULT 'active',
  price numeric(14,2) NOT NULL DEFAULT 0,
  billing_period text NOT NULL DEFAULT 'monthly',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select" ON public.subscriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "subscriptions_insert" ON public.subscriptions FOR INSERT TO authenticated
  WITH CHECK (
    public.has_any_role(auth.uid(), ARRAY['admin','sales_manager','sales_rep']::app_role[])
    AND created_by = auth.uid()
  );
CREATE POLICY "subscriptions_update" ON public.subscriptions FOR UPDATE TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['admin','sales_manager']::app_role[])
    OR (public.has_role(auth.uid(),'sales_rep'::app_role) AND created_by = auth.uid())
  );
CREATE POLICY "subscriptions_delete" ON public.subscriptions FOR DELETE TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['admin','sales_manager']::app_role[])
    OR (public.has_role(auth.uid(),'sales_rep'::app_role) AND created_by = auth.uid())
  );

CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
