
-- 1. vendors
CREATE TABLE public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text,
  phone text,
  email text,
  address text,
  gstin text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);
CREATE UNIQUE INDEX vendors_name_lower_idx ON public.vendors (LOWER(name));
CREATE INDEX vendors_active_idx ON public.vendors (is_active);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendors TO authenticated;
GRANT ALL ON public.vendors TO service_role;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendors_select" ON public.vendors FOR SELECT TO authenticated
USING (
  public.has_any_role(auth.uid(), ARRAY['sales_rep','sales_manager','warehouse_operator','admin','super_admin']::app_role[])
);
CREATE POLICY "vendors_insert" ON public.vendors FOR INSERT TO authenticated
WITH CHECK (
  public.has_any_role(auth.uid(), ARRAY['warehouse_operator','admin','super_admin']::app_role[])
);
CREATE POLICY "vendors_update" ON public.vendors FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "vendors_delete" ON public.vendors FOR DELETE TO authenticated
USING (public.is_admin());

CREATE TRIGGER vendors_updated_at BEFORE UPDATE ON public.vendors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. vendor_orders
CREATE TABLE public.vendor_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vo_number text NOT NULL,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id),
  order_mode text NOT NULL CHECK (order_mode IN ('individual','bulk')),
  linked_sales_order_id uuid REFERENCES public.sales_orders(id),
  linked_sales_order_line_id uuid REFERENCES public.order_lines(id),
  eta_date date NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_approval','approved','placed','partial','received','cancelled')),
  notes text,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  placed_at timestamptz,
  received_at timestamptz,
  cancelled_by uuid REFERENCES auth.users(id),
  cancelled_at timestamptz,
  cancellation_reason text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX vendor_orders_status_eta_idx ON public.vendor_orders (status, eta_date);
CREATE INDEX vendor_orders_vendor_status_idx ON public.vendor_orders (vendor_id, status);
CREATE INDEX vendor_orders_linked_so_idx ON public.vendor_orders (linked_sales_order_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_orders TO authenticated;
GRANT ALL ON public.vendor_orders TO service_role;
ALTER TABLE public.vendor_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vo_select" ON public.vendor_orders FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['sales_rep','sales_manager','warehouse_operator','admin','super_admin']::app_role[]));
CREATE POLICY "vo_insert" ON public.vendor_orders FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['sales_rep','sales_manager','warehouse_operator','admin','super_admin']::app_role[]));
CREATE POLICY "vo_update" ON public.vendor_orders FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['sales_rep','sales_manager','warehouse_operator','admin','super_admin']::app_role[]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['sales_rep','sales_manager','warehouse_operator','admin','super_admin']::app_role[]));
CREATE POLICY "vo_delete" ON public.vendor_orders FOR DELETE TO authenticated
USING (public.is_admin());

CREATE TRIGGER vendor_orders_updated_at BEFORE UPDATE ON public.vendor_orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-number trigger
CREATE OR REPLACE FUNCTION public.vo_set_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.vo_number IS NULL OR NEW.vo_number = '' THEN
    NEW.vo_number := public.generate_document_number('vendor_order');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER vendor_orders_set_number BEFORE INSERT ON public.vendor_orders
FOR EACH ROW EXECUTE FUNCTION public.vo_set_number();

-- 3. vendor_order_lines
CREATE TABLE public.vendor_order_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_order_id uuid NOT NULL REFERENCES public.vendor_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  quantity_ordered integer NOT NULL CHECK (quantity_ordered > 0),
  quantity_received integer NOT NULL DEFAULT 0,
  size_spec text,
  colour_polish_spec text,
  fabric_spec text,
  customization_notes text,
  reference_images jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX vendor_order_lines_vo_idx ON public.vendor_order_lines (vendor_order_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_order_lines TO authenticated;
GRANT ALL ON public.vendor_order_lines TO service_role;
ALTER TABLE public.vendor_order_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vol_select" ON public.vendor_order_lines FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['sales_rep','sales_manager','warehouse_operator','admin','super_admin']::app_role[]));
CREATE POLICY "vol_insert" ON public.vendor_order_lines FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['sales_rep','sales_manager','warehouse_operator','admin','super_admin']::app_role[]));
CREATE POLICY "vol_update" ON public.vendor_order_lines FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['sales_rep','sales_manager','warehouse_operator','admin','super_admin']::app_role[]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['sales_rep','sales_manager','warehouse_operator','admin','super_admin']::app_role[]));
CREATE POLICY "vol_delete" ON public.vendor_order_lines FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['warehouse_operator','admin','super_admin']::app_role[]));

CREATE TRIGGER vendor_order_lines_updated_at BEFORE UPDATE ON public.vendor_order_lines
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. RPCs
CREATE OR REPLACE FUNCTION public.approve_vendor_order(p_vo_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_status text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can approve vendor orders';
  END IF;
  SELECT status INTO v_status FROM public.vendor_orders WHERE id = p_vo_id FOR UPDATE;
  IF v_status IS NULL THEN RAISE EXCEPTION 'Vendor order not found'; END IF;
  IF v_status <> 'pending_approval' THEN
    RAISE EXCEPTION 'Vendor order in status % cannot be approved', v_status;
  END IF;
  UPDATE public.vendor_orders
     SET status='approved', approved_by=auth.uid(), approved_at=now(), updated_at=now()
   WHERE id = p_vo_id;
END $$;

CREATE OR REPLACE FUNCTION public.place_vendor_order(p_vo_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_status text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can place vendor orders';
  END IF;
  SELECT status INTO v_status FROM public.vendor_orders WHERE id = p_vo_id FOR UPDATE;
  IF v_status IS NULL THEN RAISE EXCEPTION 'Vendor order not found'; END IF;
  IF v_status <> 'approved' THEN
    RAISE EXCEPTION 'Vendor order in status % cannot be placed', v_status;
  END IF;
  UPDATE public.vendor_orders
     SET status='placed', placed_at=now(), updated_at=now()
   WHERE id = p_vo_id;
END $$;

CREATE OR REPLACE FUNCTION public.cancel_vendor_order(p_vo_id uuid, p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_status text;
BEGIN
  SELECT status INTO v_status FROM public.vendor_orders WHERE id = p_vo_id FOR UPDATE;
  IF v_status IS NULL THEN RAISE EXCEPTION 'Vendor order not found'; END IF;
  IF v_status = 'cancelled' THEN RAISE EXCEPTION 'Already cancelled'; END IF;

  IF v_status IN ('placed','partial','received') THEN
    IF NOT public.has_role(auth.uid(), 'super_admin'::app_role) THEN
      RAISE EXCEPTION 'Only super admin can cancel a placed vendor order';
    END IF;
  ELSE
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Only admins can cancel vendor orders';
    END IF;
  END IF;

  UPDATE public.vendor_orders
     SET status='cancelled', cancelled_by=auth.uid(), cancelled_at=now(),
         cancellation_reason=p_reason, updated_at=now()
   WHERE id = p_vo_id;
END $$;

CREATE OR REPLACE FUNCTION public.validate_so_linked_eta(p_so_id uuid, p_proposed_eta date)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_so_eta date;
  v_recommended date;
  v_ok boolean;
BEGIN
  SELECT MIN(COALESCE(ol.eta_date, so.committed_delivery_date, so.expected_delivery_date))
    INTO v_so_eta
    FROM public.sales_orders so
    LEFT JOIN public.order_lines ol ON ol.order_id = so.id
   WHERE so.id = p_so_id;

  IF v_so_eta IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'so_eta', null, 'recommended_eta', null);
  END IF;

  v_recommended := v_so_eta - INTERVAL '2 days';
  v_ok := p_proposed_eta <= v_recommended;

  RETURN jsonb_build_object(
    'ok', v_ok,
    'so_eta', v_so_eta,
    'recommended_eta', v_recommended
  );
END $$;
