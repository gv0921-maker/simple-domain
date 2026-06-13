
-- Phase 5 Batch 2: Part Delivery

-- 1) delivery_notes columns
ALTER TABLE public.delivery_notes
  ADD COLUMN IF NOT EXISTS is_partial boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dn_sequence_in_invoice integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS customer_signature_received boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS customer_signature_date date,
  ADD COLUMN IF NOT EXISTS delivered_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS dispatched_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

-- 2) delivery_note_lines table
CREATE TABLE IF NOT EXISTS public.delivery_note_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_note_id uuid NOT NULL REFERENCES public.delivery_notes(id) ON DELETE CASCADE,
  invoice_line_id uuid REFERENCES public.invoice_lines(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text,
  quantity_from_invoice_line numeric NOT NULL DEFAULT 0,
  serial_numbers jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.delivery_note_lines TO authenticated;
GRANT ALL ON public.delivery_note_lines TO service_role;
ALTER TABLE public.delivery_note_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dnl_select_auth" ON public.delivery_note_lines;
CREATE POLICY "dnl_select_auth" ON public.delivery_note_lines
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "dnl_write_warehouse" ON public.delivery_note_lines;
CREATE POLICY "dnl_write_warehouse" ON public.delivery_note_lines
  FOR INSERT TO authenticated WITH CHECK (public.can_write_inventory());

DROP POLICY IF EXISTS "dnl_update_warehouse" ON public.delivery_note_lines;
CREATE POLICY "dnl_update_warehouse" ON public.delivery_note_lines
  FOR UPDATE TO authenticated USING (public.can_write_inventory()) WITH CHECK (public.can_write_inventory());

DROP POLICY IF EXISTS "dnl_delete_admin" ON public.delivery_note_lines;
CREATE POLICY "dnl_delete_admin" ON public.delivery_note_lines
  FOR DELETE TO authenticated USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_dnl_dn ON public.delivery_note_lines(delivery_note_id);
CREATE INDEX IF NOT EXISTS idx_dnl_invoice_line ON public.delivery_note_lines(invoice_line_id);

DROP TRIGGER IF EXISTS trg_dnl_updated_at ON public.delivery_note_lines;
CREATE TRIGGER trg_dnl_updated_at BEFORE UPDATE ON public.delivery_note_lines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) invoice_lines delivery columns
ALTER TABLE public.invoice_lines
  ADD COLUMN IF NOT EXISTS quantity_delivered numeric NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='invoice_lines' AND column_name='quantity_remaining_to_deliver'
  ) THEN
    EXECUTE 'ALTER TABLE public.invoice_lines ADD COLUMN quantity_remaining_to_deliver numeric GENERATED ALWAYS AS (quantity - COALESCE(quantity_delivered,0)) STORED';
  END IF;
END $$;

-- 4) Extend scan_queue document_type to include delivery_note
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT conname FROM pg_constraint
            WHERE conrelid='public.scan_queue'::regclass
              AND pg_get_constraintdef(oid) ILIKE '%document_type%'
  LOOP
    EXECUTE 'ALTER TABLE public.scan_queue DROP CONSTRAINT ' || quote_ident(r.conname);
  END LOOP;
END $$;
ALTER TABLE public.scan_queue
  ADD CONSTRAINT scan_queue_document_type_check
  CHECK (document_type IN (
    'goods_receipt','internal_transfer','pre_delivery_qc',
    'return_receipt','stock_count','correction_order','write_off',
    'delivery_note'
  ));

-- 5) Helper: invoice delivery summary
CREATE OR REPLACE FUNCTION public.get_invoice_delivery_summary(p_invoice_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_total numeric := 0;
  v_delivered numeric := 0;
  v_dn_count int := 0;
  v_lines jsonb;
BEGIN
  SELECT COALESCE(SUM(quantity),0), COALESCE(SUM(COALESCE(quantity_delivered,0)),0)
    INTO v_total, v_delivered
    FROM public.invoice_lines WHERE invoice_id = p_invoice_id;

  SELECT COUNT(*) INTO v_dn_count FROM public.delivery_notes WHERE invoice_id = p_invoice_id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'line_id', il.id,
    'product_id', il.product_id,
    'product', COALESCE(il.description, 'Item'),
    'qty_invoiced', il.quantity,
    'qty_delivered', COALESCE(il.quantity_delivered,0),
    'qty_remaining', GREATEST(il.quantity - COALESCE(il.quantity_delivered,0), 0),
    'fully_delivered', COALESCE(il.quantity_delivered,0) >= il.quantity,
    'serial_numbers_delivered', COALESCE((
      SELECT jsonb_agg(s) FROM public.delivery_note_lines dnl,
             LATERAL jsonb_array_elements_text(dnl.serial_numbers) s
       WHERE dnl.invoice_line_id = il.id
    ), '[]'::jsonb)
  ) ORDER BY il.created_at), '[]'::jsonb)
  INTO v_lines
  FROM public.invoice_lines il WHERE il.invoice_id = p_invoice_id;

  RETURN jsonb_build_object(
    'total_invoiced_qty', v_total,
    'total_delivered_qty', v_delivered,
    'balance_to_deliver', GREATEST(v_total - v_delivered, 0),
    'dn_count', v_dn_count,
    'line_summary', v_lines
  );
END $$;

-- 6) Helper: check SO closure readiness
CREATE OR REPLACE FUNCTION public.check_so_closure_ready(p_so_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.invoice_lines il
      JOIN public.invoices i ON i.id = il.invoice_id
     WHERE i.sales_order_id = p_so_id
       AND COALESCE(i.status,'') <> 'cancelled'
       AND COALESCE(il.quantity_delivered,0) < il.quantity
  ) AND EXISTS (
    SELECT 1 FROM public.invoices WHERE sales_order_id = p_so_id AND COALESCE(status,'') <> 'cancelled'
  );
$$;

-- 7) create_partial_delivery_note
CREATE OR REPLACE FUNCTION public.create_partial_delivery_note(
  p_invoice_id uuid,
  p_line_items jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_invoice RECORD;
  v_so RECORD;
  v_reference text;
  v_dn_id uuid;
  v_seq int;
  v_item jsonb;
  v_line RECORD;
  v_qty numeric;
  v_serials jsonb;
  v_sn text;
  v_serial_row RECORD;
  v_products jsonb := '[]'::jsonb;
  v_total_items int := 0;
  v_is_partial boolean;
  v_uid uuid := auth.uid();
BEGIN
  SELECT * INTO v_invoice FROM public.invoices WHERE id = p_invoice_id FOR UPDATE;
  IF v_invoice.id IS NULL THEN RAISE EXCEPTION 'Invoice not found'; END IF;
  IF COALESCE(v_invoice.status,'') = 'cancelled' THEN
    RAISE EXCEPTION 'Invoice is cancelled and cannot be delivered';
  END IF;

  SELECT * INTO v_so FROM public.sales_orders WHERE id = v_invoice.sales_order_id;

  v_seq := (SELECT COUNT(*)+1 FROM public.delivery_notes WHERE invoice_id = p_invoice_id);
  v_reference := public.generate_document_number('delivery_note');

  INSERT INTO public.delivery_notes (
    reference, sales_order_id, invoice_id, customer_id,
    status, created_by, products_json,
    customer_delivery_name, customer_delivery_address, customer_delivery_phone,
    dn_sequence_in_invoice
  ) VALUES (
    v_reference, v_invoice.sales_order_id, p_invoice_id, v_invoice.customer_id,
    'draft', v_uid, '[]'::jsonb,
    COALESCE(v_so.delivery_name, v_so.billing_name, v_so.customer_name),
    CONCAT_WS(', ',
      COALESCE(v_so.delivery_address_line_1, v_so.billing_address_line_1),
      COALESCE(v_so.delivery_address_line_2, v_so.billing_address_line_2),
      COALESCE(v_so.delivery_city, v_so.billing_city),
      COALESCE(v_so.delivery_state, v_so.billing_state),
      COALESCE(v_so.delivery_zip, v_so.billing_zip)
    ),
    COALESCE(v_so.delivery_phone_1, v_so.billing_phone_1),
    v_seq
  ) RETURNING id INTO v_dn_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_line_items) LOOP
    v_qty := COALESCE((v_item->>'quantity_to_deliver')::numeric, 0);
    IF v_qty <= 0 THEN CONTINUE; END IF;

    SELECT * INTO v_line FROM public.invoice_lines
     WHERE id = (v_item->>'invoice_line_id')::uuid AND invoice_id = p_invoice_id FOR UPDATE;
    IF v_line.id IS NULL THEN RAISE EXCEPTION 'Invoice line % not found on invoice', v_item->>'invoice_line_id'; END IF;

    IF v_qty > (v_line.quantity - COALESCE(v_line.quantity_delivered,0)) THEN
      RAISE EXCEPTION 'Qty % exceeds remaining-to-deliver for line %', v_qty, v_line.id;
    END IF;

    v_serials := COALESCE(v_item->'serial_numbers', '[]'::jsonb);

    -- validate each serial reserved to SO and not already delivered
    FOR v_sn IN SELECT jsonb_array_elements_text(v_serials) LOOP
      SELECT * INTO v_serial_row FROM public.goods_receipt_serials
        WHERE serial_number = v_sn LIMIT 1;
      IF v_serial_row.id IS NULL THEN
        RAISE EXCEPTION 'Serial % not found', v_sn;
      END IF;
      IF v_serial_row.reserved_for_so_id IS DISTINCT FROM v_invoice.sales_order_id
         AND v_serial_row.stock_status <> 'sold' THEN
        RAISE EXCEPTION 'Serial % is not reserved to this sales order', v_sn;
      END IF;
      IF EXISTS (
        SELECT 1 FROM public.delivery_note_lines dnl,
               LATERAL jsonb_array_elements_text(dnl.serial_numbers) s
         WHERE s = v_sn
      ) THEN
        RAISE EXCEPTION 'Serial % is already on another delivery note', v_sn;
      END IF;
    END LOOP;

    INSERT INTO public.delivery_note_lines (
      delivery_note_id, invoice_line_id, product_id, product_name,
      quantity_from_invoice_line, serial_numbers
    ) VALUES (
      v_dn_id, v_line.id, v_line.product_id, v_line.description,
      v_qty, v_serials
    );

    UPDATE public.invoice_lines
       SET quantity_delivered = COALESCE(quantity_delivered,0) + v_qty,
           updated_at = now()
     WHERE id = v_line.id;

    v_total_items := v_total_items + v_qty::int;
    v_products := v_products || jsonb_build_array(jsonb_build_object(
      'product_id', v_line.product_id,
      'product_name', COALESCE(v_line.description,'Item'),
      'quantity', v_qty,
      'unit', 'Unit',
      'serial_numbers', v_serials,
      'warehouse_location', ''
    ));
  END LOOP;

  -- is_partial?
  SELECT EXISTS (
    SELECT 1 FROM public.invoice_lines
     WHERE invoice_id = p_invoice_id AND COALESCE(quantity_delivered,0) < quantity
  ) INTO v_is_partial;

  UPDATE public.delivery_notes
     SET products_json = v_products, is_partial = v_is_partial
   WHERE id = v_dn_id;

  -- Add to scan queue (pre-delivery scan verification)
  INSERT INTO public.scan_queue (
    document_type, document_id, document_reference,
    expected_items_count, scan_status, priority
  ) VALUES (
    'delivery_note', v_dn_id, v_reference, v_total_items, 'pending', 'normal'
  );

  -- Update SO status to 'delivering' (will go to 'delivered' on confirm)
  IF v_invoice.sales_order_id IS NOT NULL THEN
    UPDATE public.sales_orders
       SET status = CASE WHEN status IN ('cancelled','closed') THEN status
                         ELSE 'delivering' END
     WHERE id = v_invoice.sales_order_id;
  END IF;

  -- Activity logs (best effort)
  BEGIN
    INSERT INTO public.activity_log (entity_type, entity_id, action, details, performed_by)
    VALUES
      ('invoice', p_invoice_id, 'delivery_note_created',
       jsonb_build_object('dn_id', v_dn_id, 'dn_reference', v_reference, 'is_partial', v_is_partial), v_uid),
      ('delivery_note', v_dn_id, 'created',
       jsonb_build_object('invoice_id', p_invoice_id, 'items', v_total_items), v_uid);
    IF v_invoice.sales_order_id IS NOT NULL THEN
      INSERT INTO public.activity_log (entity_type, entity_id, action, details, performed_by)
      VALUES ('sales_order', v_invoice.sales_order_id, 'delivery_note_created',
        jsonb_build_object('dn_id', v_dn_id, 'dn_reference', v_reference), v_uid);
    END IF;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN v_dn_id;
END $$;

-- 8) confirm_delivery
CREATE OR REPLACE FUNCTION public.confirm_delivery(
  p_dn_id uuid,
  p_signature_received boolean DEFAULT true
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_dn RECORD;
  v_sn text;
  v_so_closed boolean := false;
  v_uid uuid := auth.uid();
BEGIN
  SELECT * INTO v_dn FROM public.delivery_notes WHERE id = p_dn_id FOR UPDATE;
  IF v_dn.id IS NULL THEN RAISE EXCEPTION 'Delivery note not found'; END IF;

  UPDATE public.delivery_notes
     SET customer_signature_received = COALESCE(p_signature_received, false),
         customer_signature_date = CASE WHEN p_signature_received THEN CURRENT_DATE ELSE NULL END,
         delivered_at = now(),
         delivered_by_user_id = COALESCE(delivered_by_user_id, v_uid),
         status = 'delivered',
         signature_collected = COALESCE(p_signature_received, false)
   WHERE id = p_dn_id;

  -- Mark serials as sold
  FOR v_sn IN
    SELECT jsonb_array_elements_text(serial_numbers)
      FROM public.delivery_note_lines WHERE delivery_note_id = p_dn_id
  LOOP
    UPDATE public.goods_receipt_serials
       SET stock_status = 'sold', updated_at = now()
     WHERE serial_number = v_sn;
  END LOOP;

  -- SO closure cascade
  IF v_dn.sales_order_id IS NOT NULL THEN
    IF public.check_so_closure_ready(v_dn.sales_order_id) THEN
      UPDATE public.sales_orders SET status = 'closed' WHERE id = v_dn.sales_order_id;
      v_so_closed := true;
      BEGIN
        INSERT INTO public.activity_log (entity_type, entity_id, action, details, performed_by)
        VALUES ('sales_order', v_dn.sales_order_id, 'order_closed',
          jsonb_build_object('reason','all items delivered','triggered_by_dn', p_dn_id), v_uid);
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    ELSE
      UPDATE public.sales_orders SET status = 'delivering'
       WHERE id = v_dn.sales_order_id AND status NOT IN ('cancelled','closed');
    END IF;
  END IF;

  BEGIN
    INSERT INTO public.activity_log (entity_type, entity_id, action, details, performed_by)
    VALUES ('delivery_note', p_dn_id, 'delivery_confirmed',
      jsonb_build_object('signature_received', p_signature_received), v_uid);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN jsonb_build_object('dn_id', p_dn_id, 'so_closed', v_so_closed);
END $$;
