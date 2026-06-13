
-- =========================================================
-- Phase 2 Batch 3 — Internal Transfer Orders (ITO)
-- =========================================================

-- 1) internal_transfer_orders
CREATE TABLE public.internal_transfer_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ito_number text NOT NULL UNIQUE,
  sales_order_id uuid NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','confirmed','partial','completed','cancelled')),
  confirmed_by uuid REFERENCES auth.users(id),
  confirmed_at timestamptz,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ito_sales_order ON public.internal_transfer_orders(sales_order_id);
CREATE INDEX idx_ito_status_created ON public.internal_transfer_orders(status, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.internal_transfer_orders TO authenticated;
GRANT ALL ON public.internal_transfer_orders TO service_role;

ALTER TABLE public.internal_transfer_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ITO select for sales_rep + warehouse + admin"
  ON public.internal_transfer_orders FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR public.has_role(auth.uid(), 'warehouse_operator'::app_role)
    OR public.has_role(auth.uid(), 'sales_manager'::app_role)
    OR public.has_role(auth.uid(), 'sales_rep'::app_role)
  );

CREATE POLICY "ITO insert for warehouse + admin + creator"
  ON public.internal_transfer_orders FOR INSERT TO authenticated
  WITH CHECK (public.can_write_inventory());

CREATE POLICY "ITO update for warehouse + admin"
  ON public.internal_transfer_orders FOR UPDATE TO authenticated
  USING (public.can_write_inventory())
  WITH CHECK (public.can_write_inventory());

CREATE POLICY "ITO delete for admin"
  ON public.internal_transfer_orders FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE TRIGGER trg_ito_updated_at
  BEFORE UPDATE ON public.internal_transfer_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) internal_transfer_order_lines
CREATE TABLE public.internal_transfer_order_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_transfer_order_id uuid NOT NULL REFERENCES public.internal_transfer_orders(id) ON DELETE CASCADE,
  sales_order_line_id uuid NOT NULL REFERENCES public.order_lines(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  product_source text NOT NULL CHECK (product_source IN ('display','warehouse','vendor','factory')),
  quantity_expected integer NOT NULL,
  quantity_scanned integer NOT NULL DEFAULT 0,
  line_status text NOT NULL DEFAULT 'pending' CHECK (line_status IN ('pending','scanning','completed','blocked')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ito_lines_ito ON public.internal_transfer_order_lines(internal_transfer_order_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.internal_transfer_order_lines TO authenticated;
GRANT ALL ON public.internal_transfer_order_lines TO service_role;

ALTER TABLE public.internal_transfer_order_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ITO lines select"
  ON public.internal_transfer_order_lines FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR public.has_role(auth.uid(), 'warehouse_operator'::app_role)
    OR public.has_role(auth.uid(), 'sales_manager'::app_role)
    OR public.has_role(auth.uid(), 'sales_rep'::app_role)
  );

CREATE POLICY "ITO lines insert"
  ON public.internal_transfer_order_lines FOR INSERT TO authenticated
  WITH CHECK (public.can_write_inventory());

CREATE POLICY "ITO lines update"
  ON public.internal_transfer_order_lines FOR UPDATE TO authenticated
  USING (public.can_write_inventory())
  WITH CHECK (public.can_write_inventory());

CREATE POLICY "ITO lines delete"
  ON public.internal_transfer_order_lines FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE TRIGGER trg_ito_lines_updated_at
  BEFORE UPDATE ON public.internal_transfer_order_lines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) suggest_ito_for_so
CREATE OR REPLACE FUNCTION public.suggest_ito_for_so(p_so_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'sales_order_line_id', ol.id,
    'product_id', ol.product_id,
    'product_name', ol.product_name,
    'product_source', COALESCE(ol.product_source, 'warehouse'),
    'quantity', ol.quantity,
    'blocked', COALESCE(ol.product_source, 'warehouse') IN ('vendor','factory')
  )), '[]'::jsonb)
  INTO v_result
  FROM public.order_lines ol
  WHERE ol.order_id = p_so_id;
  RETURN v_result;
END $$;

-- 4) create_ito_from_so
CREATE OR REPLACE FUNCTION public.create_ito_from_so(p_so_id uuid, p_confirmed_by uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ito_id uuid;
  v_number text;
BEGIN
  v_number := public.generate_document_number('internal_transfer');
  INSERT INTO public.internal_transfer_orders (ito_number, sales_order_id, status, confirmed_by, confirmed_at, created_by)
  VALUES (v_number, p_so_id, 'confirmed', p_confirmed_by, now(), p_confirmed_by)
  RETURNING id INTO v_ito_id;

  INSERT INTO public.internal_transfer_order_lines (
    internal_transfer_order_id, sales_order_line_id, product_id, product_source, quantity_expected, line_status
  )
  SELECT v_ito_id, ol.id, ol.product_id,
         COALESCE(ol.product_source, 'warehouse'),
         GREATEST(COALESCE(ol.quantity, 0)::int, 0),
         CASE WHEN COALESCE(ol.product_source,'warehouse') IN ('vendor','factory') THEN 'blocked' ELSE 'pending' END
  FROM public.order_lines ol
  WHERE ol.order_id = p_so_id;

  UPDATE public.sales_orders
     SET status = 'fulfilling', updated_at = now()
   WHERE id = p_so_id;

  RETURN v_ito_id;
END $$;

-- 5) check_so_ready_to_invoice
CREATE OR REPLACE FUNCTION public.check_so_ready_to_invoice(p_so_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pct numeric;
  v_total numeric;
  v_paid numeric;
  v_pending_lines int;
BEGIN
  SELECT COALESCE(total,0) INTO v_total FROM public.sales_orders WHERE id = p_so_id;
  IF v_total IS NULL OR v_total = 0 THEN RETURN false; END IF;
  SELECT COALESCE(SUM(amount),0) INTO v_paid FROM public.sales_order_payments
    WHERE sales_order_id = p_so_id AND is_voided = false;
  v_pct := (v_paid / v_total) * 100;
  IF v_pct < 100 THEN RETURN false; END IF;

  SELECT COUNT(*) INTO v_pending_lines
  FROM public.internal_transfer_order_lines l
  JOIN public.internal_transfer_orders i ON i.id = l.internal_transfer_order_id
  WHERE i.sales_order_id = p_so_id
    AND i.status <> 'cancelled'
    AND l.line_status <> 'completed';
  IF v_pending_lines > 0 THEN RETURN false; END IF;

  RETURN EXISTS (SELECT 1 FROM public.internal_transfer_orders WHERE sales_order_id = p_so_id AND status <> 'cancelled');
END $$;

-- 6) Trigger: ITO line update cascade
CREATE OR REPLACE FUNCTION public.ito_line_cascade_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_so_id uuid;
  v_total int;
  v_done int;
  v_ito_status text;
BEGIN
  -- auto-complete this line if scanned >= expected
  IF NEW.quantity_scanned >= NEW.quantity_expected AND NEW.line_status NOT IN ('completed','blocked') THEN
    NEW.line_status := 'completed';
  ELSIF NEW.quantity_scanned > 0 AND NEW.line_status = 'pending' THEN
    NEW.line_status := 'scanning';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_ito_line_before_update
  BEFORE UPDATE OF quantity_scanned ON public.internal_transfer_order_lines
  FOR EACH ROW EXECUTE FUNCTION public.ito_line_cascade_status();

CREATE OR REPLACE FUNCTION public.ito_after_line_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ito_id uuid := NEW.internal_transfer_order_id;
  v_so_id uuid;
  v_total int;
  v_done int;
  v_new_ito_status text;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE line_status='completed')
    INTO v_total, v_done
    FROM public.internal_transfer_order_lines
    WHERE internal_transfer_order_id = v_ito_id;

  IF v_total > 0 AND v_done = v_total THEN
    v_new_ito_status := 'completed';
  ELSIF v_done > 0 THEN
    v_new_ito_status := 'partial';
  ELSE
    v_new_ito_status := 'confirmed';
  END IF;

  UPDATE public.internal_transfer_orders
     SET status = v_new_ito_status, updated_at = now()
   WHERE id = v_ito_id
   RETURNING sales_order_id INTO v_so_id;

  IF v_so_id IS NOT NULL AND public.check_so_ready_to_invoice(v_so_id) THEN
    UPDATE public.sales_orders SET status='ready_to_invoice', updated_at=now()
     WHERE id = v_so_id AND status IN ('fulfilling','confirmed');
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER trg_ito_after_line_update
  AFTER UPDATE OF quantity_scanned, line_status ON public.internal_transfer_order_lines
  FOR EACH ROW EXECUTE FUNCTION public.ito_after_line_update();

-- 7) Trigger on payments: if fully paid + ITO complete -> ready_to_invoice
CREATE OR REPLACE FUNCTION public.so_payment_check_ready_to_invoice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.check_so_ready_to_invoice(NEW.sales_order_id) THEN
    UPDATE public.sales_orders SET status='ready_to_invoice', updated_at=now()
     WHERE id = NEW.sales_order_id AND status IN ('fulfilling','confirmed');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_so_payment_ready_to_invoice
  AFTER INSERT ON public.sales_order_payments
  FOR EACH ROW EXECUTE FUNCTION public.so_payment_check_ready_to_invoice();

-- 8) Trigger on scan_records: increment ITO line quantity_scanned for ITO scans
CREATE OR REPLACE FUNCTION public.scan_record_update_ito_line()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc_type text;
  v_doc_id uuid;
  v_line_id uuid;
BEGIN
  IF NEW.scan_result <> 'valid' THEN RETURN NEW; END IF;
  SELECT document_type, document_id INTO v_doc_type, v_doc_id
    FROM public.scan_queue WHERE id = NEW.scan_queue_id;
  IF v_doc_type <> 'internal_transfer' OR v_doc_id IS NULL THEN RETURN NEW; END IF;

  -- match by product_id and not-yet-completed
  SELECT id INTO v_line_id
    FROM public.internal_transfer_order_lines
   WHERE internal_transfer_order_id = v_doc_id
     AND (NEW.product_id IS NULL OR product_id = NEW.product_id)
     AND line_status <> 'completed'
   ORDER BY (line_status='blocked') ASC, created_at ASC
   LIMIT 1;

  IF v_line_id IS NOT NULL THEN
    UPDATE public.internal_transfer_order_lines
       SET quantity_scanned = quantity_scanned + 1, updated_at = now()
     WHERE id = v_line_id;
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER trg_scan_record_to_ito_line
  AFTER INSERT ON public.scan_records
  FOR EACH ROW EXECUTE FUNCTION public.scan_record_update_ito_line();
