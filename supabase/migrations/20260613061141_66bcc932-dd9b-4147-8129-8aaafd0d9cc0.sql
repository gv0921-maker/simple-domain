
-- Phase 3 Batch 3: Internal Movements + ITO scan progress integration

-- 1) Extend numbering: add 'internal_movement' prefix
CREATE OR REPLACE FUNCTION public.generate_document_number(p_document_type text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_fy text;
  v_padding integer;
  v_sep text;
  v_next integer;
  v_prefix text;
BEGIN
  v_fy := public.get_current_fy_label();
  SELECT sequential_padding, prefix_separator INTO v_padding, v_sep FROM public.numbering_settings LIMIT 1;
  IF v_padding IS NULL THEN v_padding := 4; END IF;
  IF v_sep IS NULL THEN v_sep := '-'; END IF;

  v_prefix := CASE lower(p_document_type)
    WHEN 'sales_order' THEN 'SO'
    WHEN 'quotation' THEN 'QT'
    WHEN 'invoice' THEN 'INV'
    WHEN 'delivery_note' THEN 'DN'
    WHEN 'internal_transfer' THEN 'ITO'
    WHEN 'internal_movement' THEN 'IM'
    WHEN 'vendor_order' THEN 'VO'
    WHEN 'work_order' THEN 'WO'
    WHEN 'return_request' THEN 'RT'
    WHEN 'credit_note' THEN 'CN'
    WHEN 'goods_receipt' THEN 'GR'
    WHEN 'payment_receipt' THEN 'PR'
    WHEN 'correction_order' THEN 'CO'
    WHEN 'stock_count' THEN 'SC'
    WHEN 'write_off' THEN 'WF'
    ELSE upper(p_document_type)
  END;

  INSERT INTO public.numbering_sequences (document_type, fy_label, last_number)
  VALUES (p_document_type, v_fy, 1)
  ON CONFLICT (document_type, fy_label)
  DO UPDATE SET last_number = public.numbering_sequences.last_number + 1, updated_at = now()
  RETURNING last_number INTO v_next;

  RETURN v_prefix || v_sep || v_fy || v_sep || lpad(v_next::text, v_padding, '0');
END;
$function$;

CREATE OR REPLACE FUNCTION public.preview_next_document_number(p_document_type text)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_fy text;
  v_padding integer;
  v_sep text;
  v_next integer;
  v_prefix text;
BEGIN
  v_fy := public.get_current_fy_label();
  SELECT sequential_padding, prefix_separator INTO v_padding, v_sep FROM public.numbering_settings LIMIT 1;
  IF v_padding IS NULL THEN v_padding := 4; END IF;
  IF v_sep IS NULL THEN v_sep := '-'; END IF;

  SELECT COALESCE(last_number, 0) + 1 INTO v_next
  FROM public.numbering_sequences
  WHERE document_type = p_document_type AND fy_label = v_fy;
  IF v_next IS NULL THEN v_next := 1; END IF;

  v_prefix := CASE lower(p_document_type)
    WHEN 'sales_order' THEN 'SO'
    WHEN 'quotation' THEN 'QT'
    WHEN 'invoice' THEN 'INV'
    WHEN 'delivery_note' THEN 'DN'
    WHEN 'internal_transfer' THEN 'ITO'
    WHEN 'internal_movement' THEN 'IM'
    WHEN 'vendor_order' THEN 'VO'
    WHEN 'work_order' THEN 'WO'
    WHEN 'return_request' THEN 'RT'
    WHEN 'credit_note' THEN 'CN'
    WHEN 'goods_receipt' THEN 'GR'
    WHEN 'payment_receipt' THEN 'PR'
    WHEN 'correction_order' THEN 'CO'
    WHEN 'stock_count' THEN 'SC'
    WHEN 'write_off' THEN 'WF'
    ELSE upper(p_document_type)
  END;

  RETURN v_prefix || v_sep || v_fy || v_sep || lpad(v_next::text, v_padding, '0');
END;
$function$;

-- 2) Extend goods_receipt_serials stock_status to include 'returned_to_vendor' and 'reserved' + 'sold'
-- The column is text; update CHECK constraint if any. We'll drop any existing check on stock_status and recreate.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
     WHERE conrelid = 'public.goods_receipt_serials'::regclass
       AND contype = 'c'
       AND pg_get_constraintdef(oid) ILIKE '%stock_status%'
  LOOP
    EXECUTE format('ALTER TABLE public.goods_receipt_serials DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.goods_receipt_serials
  ADD CONSTRAINT goods_receipt_serials_stock_status_check
  CHECK (stock_status IN ('available','under_correction','reserved','sold','returned_to_vendor','scrapped'));

-- Add reserved_for_so_id column if not present
ALTER TABLE public.goods_receipt_serials
  ADD COLUMN IF NOT EXISTS reserved_for_so_id uuid REFERENCES public.sales_orders(id) ON DELETE SET NULL;

-- 3) Create internal_movements
CREATE TABLE IF NOT EXISTS public.internal_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_number text NOT NULL UNIQUE,
  movement_type text NOT NULL CHECK (movement_type IN ('rearrangement','display_sold','damage_quarantine','return_to_vendor','cycle_count_reconciliation','location_change')),
  from_location_type text CHECK (from_location_type IN ('warehouse','store_display','under_correction','packaging')),
  from_location_id uuid,
  to_location_type text CHECK (to_location_type IN ('warehouse','store_display','under_correction','packaging','vendor','scrap')),
  to_location_id uuid,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','in_progress','completed','cancelled')),
  reason text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  completed_by uuid REFERENCES auth.users(id),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_im_status_created ON public.internal_movements(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_im_type_created ON public.internal_movements(movement_type, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.internal_movements TO authenticated;
GRANT ALL ON public.internal_movements TO service_role;
ALTER TABLE public.internal_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "im_select" ON public.internal_movements FOR SELECT TO authenticated
  USING (public.is_admin() OR public.has_role(auth.uid(),'warehouse_operator') OR public.has_role(auth.uid(),'sales_rep') OR public.has_role(auth.uid(),'sales_manager'));
CREATE POLICY "im_insert" ON public.internal_movements FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR public.has_role(auth.uid(),'warehouse_operator'));
CREATE POLICY "im_update" ON public.internal_movements FOR UPDATE TO authenticated
  USING (public.is_admin() OR created_by = auth.uid());
CREATE POLICY "im_delete" ON public.internal_movements FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE TRIGGER trg_im_updated_at BEFORE UPDATE ON public.internal_movements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-generate movement number
CREATE OR REPLACE FUNCTION public.im_set_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.movement_number IS NULL OR NEW.movement_number = '' THEN
    NEW.movement_number := public.generate_document_number('internal_movement');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_im_set_number BEFORE INSERT ON public.internal_movements
  FOR EACH ROW EXECUTE FUNCTION public.im_set_number();

-- 4) Create internal_movement_items
CREATE TABLE IF NOT EXISTS public.internal_movement_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_movement_id uuid NOT NULL REFERENCES public.internal_movements(id) ON DELETE CASCADE,
  goods_receipt_serial_id uuid NOT NULL REFERENCES public.goods_receipt_serials(id) ON DELETE RESTRICT,
  product_id uuid NOT NULL REFERENCES public.products(id),
  serial_number text NOT NULL,
  scanned_at_source boolean NOT NULL DEFAULT false,
  scanned_at_destination boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_imi_movement ON public.internal_movement_items(internal_movement_id);
CREATE INDEX IF NOT EXISTS idx_imi_serial ON public.internal_movement_items(goods_receipt_serial_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.internal_movement_items TO authenticated;
GRANT ALL ON public.internal_movement_items TO service_role;
ALTER TABLE public.internal_movement_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "imi_select" ON public.internal_movement_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.internal_movements m WHERE m.id = internal_movement_id));
CREATE POLICY "imi_insert" ON public.internal_movement_items FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR public.has_role(auth.uid(),'warehouse_operator'));
CREATE POLICY "imi_update" ON public.internal_movement_items FOR UPDATE TO authenticated
  USING (public.is_admin() OR public.has_role(auth.uid(),'warehouse_operator'));
CREATE POLICY "imi_delete" ON public.internal_movement_items FOR DELETE TO authenticated
  USING (public.is_admin() OR public.has_role(auth.uid(),'warehouse_operator'));

CREATE TRIGGER trg_imi_updated_at BEFORE UPDATE ON public.internal_movement_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) complete_internal_movement RPC
CREATE OR REPLACE FUNCTION public.complete_internal_movement(p_movement_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_type text;
  v_status text;
  v_pending int;
  v_to_warehouse uuid;
  v_uid uuid := auth.uid();
  v_item RECORD;
BEGIN
  SELECT movement_type, status, to_location_id INTO v_type, v_status, v_to_warehouse
    FROM public.internal_movements WHERE id = p_movement_id FOR UPDATE;
  IF v_type IS NULL THEN RAISE EXCEPTION 'Movement not found'; END IF;
  IF v_status NOT IN ('draft','in_progress') THEN
    RAISE EXCEPTION 'Movement cannot be completed in status %', v_status;
  END IF;

  SELECT COUNT(*) INTO v_pending FROM public.internal_movement_items
   WHERE internal_movement_id = p_movement_id
     AND (scanned_at_source = false OR scanned_at_destination = false);
  IF v_pending > 0 THEN
    RAISE EXCEPTION '% item(s) not fully scanned at source and destination', v_pending;
  END IF;

  FOR v_item IN
    SELECT goods_receipt_serial_id FROM public.internal_movement_items
     WHERE internal_movement_id = p_movement_id
  LOOP
    IF v_type = 'display_sold' THEN
      UPDATE public.goods_receipt_serials
         SET stock_status = 'sold', updated_at = now()
       WHERE id = v_item.goods_receipt_serial_id;
    ELSIF v_type = 'damage_quarantine' THEN
      UPDATE public.goods_receipt_serials
         SET stock_status = 'under_correction', updated_at = now()
       WHERE id = v_item.goods_receipt_serial_id;
    ELSIF v_type = 'return_to_vendor' THEN
      UPDATE public.goods_receipt_serials
         SET stock_status = 'returned_to_vendor', updated_at = now()
       WHERE id = v_item.goods_receipt_serial_id;
    ELSIF v_type IN ('rearrangement','location_change','cycle_count_reconciliation') THEN
      UPDATE public.goods_receipt_serials
         SET updated_at = now()
       WHERE id = v_item.goods_receipt_serial_id;
    END IF;
  END LOOP;

  UPDATE public.internal_movements
     SET status = 'completed', completed_by = v_uid, completed_at = now(), updated_at = now()
   WHERE id = p_movement_id;

  RETURN true;
END $$;

-- 6) Enhance scan trigger to handle internal_movement and ITO serial reservation
CREATE OR REPLACE FUNCTION public.scan_record_update_ito_line()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_doc_type text;
  v_doc_id uuid;
  v_line_id uuid;
  v_so_id uuid;
  v_serial_id uuid;
  v_imi RECORD;
BEGIN
  IF NEW.scan_result <> 'valid' THEN RETURN NEW; END IF;
  SELECT document_type, document_id INTO v_doc_type, v_doc_id
    FROM public.scan_queue WHERE id = NEW.scan_queue_id;
  IF v_doc_id IS NULL THEN RETURN NEW; END IF;

  IF v_doc_type = 'internal_transfer' THEN
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
    -- reserve serial to the SO if scan matches a serial
    SELECT sales_order_id INTO v_so_id FROM public.internal_transfer_orders WHERE id = v_doc_id;
    IF v_so_id IS NOT NULL AND NEW.barcode_value IS NOT NULL THEN
      SELECT id INTO v_serial_id FROM public.goods_receipt_serials
       WHERE barcode_value = NEW.barcode_value
          OR serial_number = NEW.barcode_value
       LIMIT 1;
      IF v_serial_id IS NOT NULL THEN
        UPDATE public.goods_receipt_serials
           SET stock_status = 'reserved', reserved_for_so_id = v_so_id, updated_at = now()
         WHERE id = v_serial_id AND stock_status = 'available';
      END IF;
    END IF;
  ELSIF v_doc_type = 'internal_movement' THEN
    -- find matching item by serial; first scan -> source, second -> destination
    SELECT * INTO v_imi FROM public.internal_movement_items
     WHERE internal_movement_id = v_doc_id
       AND (serial_number = NEW.barcode_value OR serial_number = NEW.serial_number
            OR EXISTS (SELECT 1 FROM public.goods_receipt_serials s
                        WHERE s.id = internal_movement_items.goods_receipt_serial_id
                          AND (s.barcode_value = NEW.barcode_value OR s.serial_number = NEW.barcode_value)))
     ORDER BY scanned_at_source ASC, created_at ASC
     LIMIT 1;
    IF v_imi.id IS NOT NULL THEN
      IF v_imi.scanned_at_source = false THEN
        UPDATE public.internal_movement_items
           SET scanned_at_source = true, updated_at = now()
         WHERE id = v_imi.id;
        UPDATE public.internal_movements
           SET status = 'in_progress', updated_at = now()
         WHERE id = v_doc_id AND status = 'draft';
      ELSIF v_imi.scanned_at_destination = false THEN
        UPDATE public.internal_movement_items
           SET scanned_at_destination = true, updated_at = now()
         WHERE id = v_imi.id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END $function$;
