
-- =========================================
-- Phase 6 Batch 1 — Returns Module (Part 1)
-- =========================================

-- 1. return_requests
CREATE TABLE IF NOT EXISTS public.return_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rt_number text NOT NULL UNIQUE,
  source_invoice_id uuid NOT NULL REFERENCES public.invoices(id),
  source_sales_order_id uuid NOT NULL REFERENCES public.sales_orders(id),
  customer_id uuid REFERENCES public.customers(id),
  customer_name_snapshot text,
  request_status text NOT NULL DEFAULT 'draft'
    CHECK (request_status IN ('draft','pending_approval','approved','rejected','awaiting_receipt','received','resolved','closed','cancelled')),
  customer_reported_reason text NOT NULL,
  customer_reported_issue_description text,
  customer_photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  requested_by uuid NOT NULL REFERENCES auth.users(id),
  requested_at timestamptz NOT NULL DEFAULT now(),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  rejected_by uuid REFERENCES auth.users(id),
  rejected_at timestamptz,
  rejection_reason text,
  received_by uuid REFERENCES auth.users(id),
  received_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_return_requests_status_time ON public.return_requests (request_status, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_return_requests_invoice ON public.return_requests (source_invoice_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_customer ON public.return_requests (customer_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.return_requests TO authenticated;
GRANT ALL ON public.return_requests TO service_role;

ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Returns visible to sales+warehouse+admins"
  ON public.return_requests FOR SELECT TO authenticated
  USING (
    public.has_any_role(auth.uid(),
      ARRAY['sales_rep','sales_manager','warehouse_operator','admin','super_admin']::app_role[])
  );

CREATE POLICY "Returns insert by sales+admins"
  ON public.return_requests FOR INSERT TO authenticated
  WITH CHECK (
    public.has_any_role(auth.uid(),
      ARRAY['sales_rep','sales_manager','admin','super_admin']::app_role[])
  );

CREATE POLICY "Returns update by sales+warehouse+admins"
  ON public.return_requests FOR UPDATE TO authenticated
  USING (
    public.has_any_role(auth.uid(),
      ARRAY['sales_rep','sales_manager','warehouse_operator','admin','super_admin']::app_role[])
  )
  WITH CHECK (
    public.has_any_role(auth.uid(),
      ARRAY['sales_rep','sales_manager','warehouse_operator','admin','super_admin']::app_role[])
  );

CREATE POLICY "Returns delete by admins"
  ON public.return_requests FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE TRIGGER trg_return_requests_updated_at
  BEFORE UPDATE ON public.return_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-generate rt_number
CREATE OR REPLACE FUNCTION public.return_requests_set_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.rt_number IS NULL OR NEW.rt_number = '' THEN
    NEW.rt_number := public.generate_document_number('return_request');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_return_requests_set_number
  BEFORE INSERT ON public.return_requests
  FOR EACH ROW EXECUTE FUNCTION public.return_requests_set_number();

-- 2. return_request_items
CREATE TABLE IF NOT EXISTS public.return_request_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_request_id uuid NOT NULL REFERENCES public.return_requests(id) ON DELETE CASCADE,
  goods_receipt_serial_id uuid NOT NULL REFERENCES public.goods_receipt_serials(id),
  delivery_note_id uuid REFERENCES public.delivery_notes(id),
  delivery_note_line_id uuid REFERENCES public.delivery_note_lines(id),
  invoice_line_id uuid NOT NULL REFERENCES public.invoice_lines(id),
  product_id uuid NOT NULL REFERENCES public.products(id),
  serial_number text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  original_unit_price numeric NOT NULL DEFAULT 0,
  is_customized boolean NOT NULL DEFAULT false,
  customization_details jsonb,
  condition_grade text CHECK (condition_grade IS NULL OR condition_grade IN ('like_new','minor_damage','unsalvageable')),
  qc_status text NOT NULL DEFAULT 'pending' CHECK (qc_status IN ('pending','completed')),
  qc_notes text,
  qc_images jsonb NOT NULL DEFAULT '[]'::jsonb,
  qc_checked_by uuid REFERENCES auth.users(id),
  qc_checked_at timestamptz,
  resolution_type text CHECK (resolution_type IS NULL OR resolution_type IN ('exchange','credit_note','refund','pending')),
  resolution_status text NOT NULL DEFAULT 'pending' CHECK (resolution_status IN ('pending','in_progress','completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rri_request ON public.return_request_items (return_request_id);
CREATE INDEX IF NOT EXISTS idx_rri_serial ON public.return_request_items (goods_receipt_serial_id);
CREATE INDEX IF NOT EXISTS idx_rri_resolution ON public.return_request_items (resolution_type, resolution_status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.return_request_items TO authenticated;
GRANT ALL ON public.return_request_items TO service_role;

ALTER TABLE public.return_request_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Return items follow parent"
  ON public.return_request_items FOR ALL TO authenticated
  USING (
    public.has_any_role(auth.uid(),
      ARRAY['sales_rep','sales_manager','warehouse_operator','admin','super_admin']::app_role[])
  )
  WITH CHECK (
    public.has_any_role(auth.uid(),
      ARRAY['sales_rep','sales_manager','warehouse_operator','admin','super_admin']::app_role[])
  );

CREATE TRIGGER trg_rri_updated_at
  BEFORE UPDATE ON public.return_request_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. validate_return_eligibility
CREATE OR REPLACE FUNCTION public.validate_return_eligibility(p_serial_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_serial public.goods_receipt_serials%ROWTYPE;
  v_dnl public.delivery_note_lines%ROWTYPE;
  v_invoice_id uuid;
  v_invoice_line public.invoice_lines%ROWTYPE;
  v_so_line public.order_lines%ROWTYPE;
  v_delivered_at timestamptz;
  v_has_custom boolean := false;
BEGIN
  SELECT * INTO v_serial FROM public.goods_receipt_serials WHERE id = p_serial_id;
  IF v_serial.id IS NULL THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'Serial not found');
  END IF;
  IF v_serial.stock_status <> 'sold' THEN
    RETURN jsonb_build_object('eligible', false, 'reason',
      'Item is not in sold status (current: ' || v_serial.stock_status || ')');
  END IF;

  -- Find the delivery note line that delivered this serial
  SELECT dnl.* INTO v_dnl
  FROM public.delivery_note_lines dnl
  WHERE dnl.serial_numbers ? v_serial.serial_number
  ORDER BY dnl.created_at DESC
  LIMIT 1;

  IF v_dnl.id IS NOT NULL THEN
    SELECT delivered_at INTO v_delivered_at
      FROM public.delivery_notes WHERE id = v_dnl.delivery_note_id;
  END IF;

  -- Try to find related invoice line (via DN line if available, else through SO product match)
  IF v_dnl.invoice_line_id IS NOT NULL THEN
    SELECT * INTO v_invoice_line FROM public.invoice_lines WHERE id = v_dnl.invoice_line_id;
    v_invoice_id := v_invoice_line.invoice_id;
  END IF;

  -- Detect customization from SO line if available
  IF v_invoice_line.sales_order_line_id IS NOT NULL THEN
    SELECT * INTO v_so_line FROM public.order_lines WHERE id = v_invoice_line.sales_order_line_id;
    v_has_custom := COALESCE(
      NULLIF(v_so_line.customization_size, '') IS NOT NULL
      OR NULLIF(v_so_line.customization_colour, '') IS NOT NULL
      OR NULLIF(v_so_line.customization_fabric, '') IS NOT NULL
      OR NULLIF(v_so_line.customization_polish, '') IS NOT NULL
      OR NULLIF(v_so_line.customization_notes, '') IS NOT NULL,
      false);
  END IF;

  IF v_has_custom THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'Customized products cannot be returned',
      'has_customization', true,
      'original_invoice_id', v_invoice_id,
      'delivered_at', v_delivered_at,
      'days_since_delivery',
        CASE WHEN v_delivered_at IS NOT NULL
             THEN EXTRACT(EPOCH FROM (now() - v_delivered_at))::int / 86400
             ELSE NULL END
    );
  END IF;

  RETURN jsonb_build_object(
    'eligible', true,
    'reason', NULL,
    'has_customization', false,
    'original_invoice_id', v_invoice_id,
    'delivered_at', v_delivered_at,
    'days_since_delivery',
      CASE WHEN v_delivered_at IS NOT NULL
           THEN EXTRACT(EPOCH FROM (now() - v_delivered_at))::int / 86400
           ELSE NULL END
  );
END $$;

-- 4. create_return_request
CREATE OR REPLACE FUNCTION public.create_return_request(
  p_invoice_id uuid,
  p_items jsonb,
  p_reason text,
  p_issue_description text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_invoice public.invoices%ROWTYPE;
  v_so_id uuid;
  v_customer_id uuid;
  v_customer_name text;
  v_rt_id uuid;
  v_item jsonb;
  v_serial_id uuid;
  v_qty int;
  v_eligibility jsonb;
  v_serial public.goods_receipt_serials%ROWTYPE;
  v_dnl public.delivery_note_lines%ROWTYPE;
  v_dn_id uuid;
  v_invoice_line public.invoice_lines%ROWTYPE;
  v_so_line public.order_lines%ROWTYPE;
  v_unit_price numeric;
  v_is_custom boolean;
  v_custom_details jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_invoice FROM public.invoices WHERE id = p_invoice_id;
  IF v_invoice.id IS NULL THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  v_so_id := v_invoice.sales_order_id;
  IF v_so_id IS NULL THEN
    RAISE EXCEPTION 'Invoice has no linked sales order';
  END IF;

  SELECT customer_id, COALESCE(billing_customer_name,'')
    INTO v_customer_id, v_customer_name
    FROM public.sales_orders WHERE id = v_so_id;
  IF v_customer_name = '' OR v_customer_name IS NULL THEN
    SELECT name INTO v_customer_name FROM public.customers WHERE id = v_customer_id;
  END IF;

  -- Validate each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_serial_id := (v_item->>'serial_id')::uuid;
    v_eligibility := public.validate_return_eligibility(v_serial_id);
    IF NOT (v_eligibility->>'eligible')::boolean THEN
      RAISE EXCEPTION 'Item %: %', v_serial_id, v_eligibility->>'reason';
    END IF;
  END LOOP;

  INSERT INTO public.return_requests (
    source_invoice_id, source_sales_order_id, customer_id, customer_name_snapshot,
    request_status, customer_reported_reason, customer_reported_issue_description,
    requested_by, requested_at
  ) VALUES (
    p_invoice_id, v_so_id, v_customer_id, v_customer_name,
    'draft', p_reason, p_issue_description,
    v_uid, now()
  ) RETURNING id INTO v_rt_id;

  -- Insert items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_serial_id := (v_item->>'serial_id')::uuid;
    v_qty := COALESCE((v_item->>'qty')::int, 1);

    SELECT * INTO v_serial FROM public.goods_receipt_serials WHERE id = v_serial_id;

    SELECT dnl.* INTO v_dnl
    FROM public.delivery_note_lines dnl
    WHERE dnl.serial_numbers ? v_serial.serial_number
    ORDER BY dnl.created_at DESC
    LIMIT 1;
    v_dn_id := v_dnl.delivery_note_id;

    v_invoice_line := NULL;
    IF v_dnl.invoice_line_id IS NOT NULL THEN
      SELECT * INTO v_invoice_line FROM public.invoice_lines WHERE id = v_dnl.invoice_line_id;
    END IF;
    IF v_invoice_line.id IS NULL THEN
      SELECT * INTO v_invoice_line
      FROM public.invoice_lines
      WHERE invoice_id = p_invoice_id AND product_id = v_serial.product_id
      LIMIT 1;
    END IF;
    IF v_invoice_line.id IS NULL THEN
      RAISE EXCEPTION 'Could not locate invoice line for serial %', v_serial.serial_number;
    END IF;

    v_unit_price := COALESCE(v_invoice_line.unit_price, 0);
    v_is_custom := false;
    v_custom_details := NULL;

    IF v_invoice_line.sales_order_line_id IS NOT NULL THEN
      SELECT * INTO v_so_line FROM public.order_lines WHERE id = v_invoice_line.sales_order_line_id;
      v_is_custom := COALESCE(
        NULLIF(v_so_line.customization_size, '') IS NOT NULL
        OR NULLIF(v_so_line.customization_colour, '') IS NOT NULL
        OR NULLIF(v_so_line.customization_fabric, '') IS NOT NULL
        OR NULLIF(v_so_line.customization_polish, '') IS NOT NULL
        OR NULLIF(v_so_line.customization_notes, '') IS NOT NULL,
        false);
      IF v_is_custom THEN
        v_custom_details := jsonb_build_object(
          'size', v_so_line.customization_size,
          'colour', v_so_line.customization_colour,
          'fabric', v_so_line.customization_fabric,
          'polish', v_so_line.customization_polish,
          'notes', v_so_line.customization_notes
        );
      END IF;
    END IF;

    INSERT INTO public.return_request_items (
      return_request_id, goods_receipt_serial_id,
      delivery_note_id, delivery_note_line_id,
      invoice_line_id, product_id, serial_number, quantity,
      original_unit_price, is_customized, customization_details
    ) VALUES (
      v_rt_id, v_serial_id,
      v_dn_id, v_dnl.id,
      v_invoice_line.id, v_serial.product_id, v_serial.serial_number, v_qty,
      v_unit_price, v_is_custom, v_custom_details
    );
  END LOOP;

  RETURN v_rt_id;
END $$;

-- 5. approve_return_request
CREATE OR REPLACE FUNCTION public.approve_return_request(p_rt_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_status text;
  v_rt public.return_requests%ROWTYPE;
  v_item_count int;
BEGIN
  IF NOT public.has_role(v_uid, 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Only super_admin can approve returns';
  END IF;

  SELECT * INTO v_rt FROM public.return_requests WHERE id = p_rt_id FOR UPDATE;
  IF v_rt.id IS NULL THEN
    RAISE EXCEPTION 'Return request not found';
  END IF;
  IF v_rt.request_status <> 'pending_approval' THEN
    RAISE EXCEPTION 'Return request is in % and cannot be approved', v_rt.request_status;
  END IF;

  UPDATE public.return_requests
     SET request_status = 'awaiting_receipt',
         approved_by = v_uid,
         approved_at = now()
   WHERE id = p_rt_id;

  SELECT COUNT(*) INTO v_item_count FROM public.return_request_items WHERE return_request_id = p_rt_id;

  -- Add to scan queue (return_receipt)
  INSERT INTO public.scan_queue (document_type, document_id, document_reference, expected_items_count)
  VALUES ('return_receipt', p_rt_id, v_rt.rt_number, v_item_count)
  ON CONFLICT DO NOTHING;
END $$;

-- 6. reject_return_request
CREATE OR REPLACE FUNCTION public.reject_return_request(p_rt_id uuid, p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_status text;
BEGIN
  IF NOT public.has_role(v_uid, 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Only super_admin can reject returns';
  END IF;
  SELECT request_status INTO v_status FROM public.return_requests WHERE id = p_rt_id FOR UPDATE;
  IF v_status IS NULL THEN RAISE EXCEPTION 'Return request not found'; END IF;
  IF v_status <> 'pending_approval' THEN
    RAISE EXCEPTION 'Return request is in % and cannot be rejected', v_status;
  END IF;

  UPDATE public.return_requests
     SET request_status = 'rejected',
         rejected_by = v_uid,
         rejected_at = now(),
         rejection_reason = p_reason
   WHERE id = p_rt_id;
END $$;

-- 7. record_return_qc
CREATE OR REPLACE FUNCTION public.record_return_qc(
  p_item_id uuid,
  p_condition_grade text,
  p_notes text,
  p_images jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_rt_id uuid;
  v_pending int;
BEGIN
  IF NOT (public.is_admin() OR public.has_role(v_uid, 'warehouse_operator'::app_role)) THEN
    RAISE EXCEPTION 'Only warehouse operators or admins can record return QC';
  END IF;
  IF p_condition_grade NOT IN ('like_new','minor_damage','unsalvageable') THEN
    RAISE EXCEPTION 'Invalid condition grade %', p_condition_grade;
  END IF;

  UPDATE public.return_request_items
     SET condition_grade = p_condition_grade,
         qc_status = 'completed',
         qc_notes = p_notes,
         qc_images = COALESCE(p_images, '[]'::jsonb),
         qc_checked_by = v_uid,
         qc_checked_at = now()
   WHERE id = p_item_id
   RETURNING return_request_id INTO v_rt_id;

  IF v_rt_id IS NULL THEN
    RAISE EXCEPTION 'Return item not found';
  END IF;

  SELECT COUNT(*) INTO v_pending
    FROM public.return_request_items
   WHERE return_request_id = v_rt_id AND qc_status <> 'completed';

  IF v_pending = 0 THEN
    UPDATE public.return_requests
       SET request_status = 'received',
           received_by = COALESCE(received_by, v_uid),
           received_at = COALESCE(received_at, now())
     WHERE id = v_rt_id;
  END IF;
END $$;
