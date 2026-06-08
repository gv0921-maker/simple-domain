-- ============ Manufacturing module ============

CREATE TABLE public.bom (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  reference text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bom TO authenticated;
GRANT ALL ON public.bom TO service_role;
ALTER TABLE public.bom ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bom select" ON public.bom FOR SELECT TO authenticated USING (true);
CREATE POLICY "bom insert" ON public.bom FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['warehouse_operator','sales_manager','admin','super_admin']::app_role[]));
CREATE POLICY "bom update" ON public.bom FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['warehouse_operator','sales_manager','admin','super_admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['warehouse_operator','sales_manager','admin','super_admin']::app_role[]));
CREATE POLICY "bom delete" ON public.bom FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));

CREATE TABLE public.bom_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_id uuid NOT NULL REFERENCES public.bom(id) ON DELETE CASCADE,
  component_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity numeric NOT NULL DEFAULT 1,
  unit_of_measure text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bom_lines TO authenticated;
GRANT ALL ON public.bom_lines TO service_role;
ALTER TABLE public.bom_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bom_lines select" ON public.bom_lines FOR SELECT TO authenticated USING (true);
CREATE POLICY "bom_lines insert" ON public.bom_lines FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['warehouse_operator','sales_manager','admin','super_admin']::app_role[]));
CREATE POLICY "bom_lines update" ON public.bom_lines FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['warehouse_operator','sales_manager','admin','super_admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['warehouse_operator','sales_manager','admin','super_admin']::app_role[]));
CREATE POLICY "bom_lines delete" ON public.bom_lines FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));

CREATE TABLE public.work_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  capacity numeric NOT NULL DEFAULT 1,
  efficiency_percentage numeric NOT NULL DEFAULT 100,
  cost_per_hour numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_centers TO authenticated;
GRANT ALL ON public.work_centers TO service_role;
ALTER TABLE public.work_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "work_centers select" ON public.work_centers FOR SELECT TO authenticated USING (true);
CREATE POLICY "work_centers insert" ON public.work_centers FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['warehouse_operator','sales_manager','admin','super_admin']::app_role[]));
CREATE POLICY "work_centers update" ON public.work_centers FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['warehouse_operator','sales_manager','admin','super_admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['warehouse_operator','sales_manager','admin','super_admin']::app_role[]));
CREATE POLICY "work_centers delete" ON public.work_centers FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));

CREATE TABLE public.work_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  bom_id uuid REFERENCES public.bom(id) ON DELETE SET NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  planned_qty numeric NOT NULL DEFAULT 0,
  produced_qty numeric NOT NULL DEFAULT 0,
  state text NOT NULL DEFAULT 'draft',
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  actual_start timestamptz,
  actual_end timestamptz,
  work_center_id uuid REFERENCES public.work_centers(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_orders TO authenticated;
GRANT ALL ON public.work_orders TO service_role;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "work_orders select" ON public.work_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "work_orders insert" ON public.work_orders FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['warehouse_operator','sales_manager','admin','super_admin']::app_role[]));
CREATE POLICY "work_orders update" ON public.work_orders FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['warehouse_operator','sales_manager','admin','super_admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['warehouse_operator','sales_manager','admin','super_admin']::app_role[]));
CREATE POLICY "work_orders delete" ON public.work_orders FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));

CREATE TABLE public.work_order_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  required_qty numeric NOT NULL DEFAULT 0,
  consumed_qty numeric NOT NULL DEFAULT 0,
  lot_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_order_components TO authenticated;
GRANT ALL ON public.work_order_components TO service_role;
ALTER TABLE public.work_order_components ENABLE ROW LEVEL SECURITY;
CREATE POLICY "woc select" ON public.work_order_components FOR SELECT TO authenticated USING (true);
CREATE POLICY "woc insert" ON public.work_order_components FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['warehouse_operator','sales_manager','admin','super_admin']::app_role[]));
CREATE POLICY "woc update" ON public.work_order_components FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['warehouse_operator','sales_manager','admin','super_admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['warehouse_operator','sales_manager','admin','super_admin']::app_role[]));
CREATE POLICY "woc delete" ON public.work_order_components FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));

CREATE TRIGGER trg_bom_updated_at BEFORE UPDATE ON public.bom
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_bom_lines_updated_at BEFORE UPDATE ON public.bom_lines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_work_centers_updated_at BEFORE UPDATE ON public.work_centers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_work_orders_updated_at BEFORE UPDATE ON public.work_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_woc_updated_at BEFORE UPDATE ON public.work_order_components
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_bom_product ON public.bom(product_id);
CREATE INDEX idx_bom_lines_bom ON public.bom_lines(bom_id);
CREATE INDEX idx_wo_product ON public.work_orders(product_id);
CREATE INDEX idx_wo_state ON public.work_orders(state);
CREATE INDEX idx_woc_wo ON public.work_order_components(work_order_id);
