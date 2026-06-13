
-- Goods Receipts core table
CREATE TABLE IF NOT EXISTS public.goods_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gr_number text UNIQUE,
  source_type text NOT NULL DEFAULT 'manual' CHECK (source_type IN ('vendor_order','work_order','manual','return')),
  source_document_id uuid NULL,
  source_document_reference text NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','quantity_pending','labels_pending','qc_pending','completed','cancelled')),
  discrepancy_status text NOT NULL DEFAULT 'matched' CHECK (discrepancy_status IN ('matched','quantity_mismatch','product_mismatch','both_mismatch')),
  discrepancy_approved_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  discrepancy_approved_at timestamptz NULL,
  discrepancy_reason text NULL,
  labels_generated boolean NOT NULL DEFAULT false,
  labels_generated_at timestamptz NULL,
  warehouse_id uuid NULL REFERENCES public.warehouses(id) ON DELETE SET NULL,
  received_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  received_at timestamptz NULL,
  notes text NULL,
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add columns IF NOT EXISTS (idempotent)
ALTER TABLE public.goods_receipts ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'manual';
ALTER TABLE public.goods_receipts ADD COLUMN IF NOT EXISTS source_document_id uuid NULL;
ALTER TABLE public.goods_receipts ADD COLUMN IF NOT EXISTS source_document_reference text NULL;
ALTER TABLE public.goods_receipts ADD COLUMN IF NOT EXISTS discrepancy_status text NOT NULL DEFAULT 'matched';
ALTER TABLE public.goods_receipts ADD COLUMN IF NOT EXISTS discrepancy_approved_by uuid NULL;
ALTER TABLE public.goods_receipts ADD COLUMN IF NOT EXISTS discrepancy_approved_at timestamptz NULL;
ALTER TABLE public.goods_receipts ADD COLUMN IF NOT EXISTS discrepancy_reason text NULL;
ALTER TABLE public.goods_receipts ADD COLUMN IF NOT EXISTS labels_generated boolean NOT NULL DEFAULT false;
ALTER TABLE public.goods_receipts ADD COLUMN IF NOT EXISTS labels_generated_at timestamptz NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.goods_receipts TO authenticated;
GRANT ALL ON public.goods_receipts TO service_role;
ALTER TABLE public.goods_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gr_select_auth" ON public.goods_receipts FOR SELECT TO authenticated USING (true);
CREATE POLICY "gr_insert_warehouse" ON public.goods_receipts FOR INSERT TO authenticated WITH CHECK (public.can_write_inventory());
CREATE POLICY "gr_update_warehouse" ON public.goods_receipts FOR UPDATE TO authenticated USING (public.can_write_inventory()) WITH CHECK (public.can_write_inventory());
CREATE POLICY "gr_delete_admin" ON public.goods_receipts FOR DELETE TO authenticated USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_gr_source ON public.goods_receipts (source_type, source_document_id);
CREATE INDEX IF NOT EXISTS idx_gr_status ON public.goods_receipts (status);

-- GR Lines
CREATE TABLE IF NOT EXISTS public.goods_receipt_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goods_receipt_id uuid NOT NULL REFERENCES public.goods_receipts(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name_cached text NULL,
  product_sku_cached text NULL,
  expected_quantity integer NOT NULL DEFAULT 0,
  received_quantity integer NOT NULL DEFAULT 0,
  accepted_quantity integer NOT NULL DEFAULT 0,
  under_correction_quantity integer NOT NULL DEFAULT 0,
  rejected_quantity integer NOT NULL DEFAULT 0,
  source_line_id uuid NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.goods_receipt_lines ADD COLUMN IF NOT EXISTS expected_quantity integer NOT NULL DEFAULT 0;
ALTER TABLE public.goods_receipt_lines ADD COLUMN IF NOT EXISTS received_quantity integer NOT NULL DEFAULT 0;
ALTER TABLE public.goods_receipt_lines ADD COLUMN IF NOT EXISTS accepted_quantity integer NOT NULL DEFAULT 0;
ALTER TABLE public.goods_receipt_lines ADD COLUMN IF NOT EXISTS under_correction_quantity integer NOT NULL DEFAULT 0;
ALTER TABLE public.goods_receipt_lines ADD COLUMN IF NOT EXISTS rejected_quantity integer NOT NULL DEFAULT 0;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.goods_receipt_lines TO authenticated;
GRANT ALL ON public.goods_receipt_lines TO service_role;
ALTER TABLE public.goods_receipt_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "grl_select_auth" ON public.goods_receipt_lines FOR SELECT TO authenticated USING (true);
CREATE POLICY "grl_write_warehouse" ON public.goods_receipt_lines FOR ALL TO authenticated USING (public.can_write_inventory()) WITH CHECK (public.can_write_inventory());

CREATE INDEX IF NOT EXISTS idx_grl_gr ON public.goods_receipt_lines (goods_receipt_id);
CREATE INDEX IF NOT EXISTS idx_grl_product ON public.goods_receipt_lines (product_id);

-- GR Serials (per-unit)
CREATE TABLE IF NOT EXISTS public.goods_receipt_serials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goods_receipt_id uuid NOT NULL REFERENCES public.goods_receipts(id) ON DELETE CASCADE,
  goods_receipt_line_id uuid NOT NULL REFERENCES public.goods_receipt_lines(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  serial_number text NOT NULL UNIQUE,
  barcode_value text NOT NULL UNIQUE,
  qc_status text NOT NULL DEFAULT 'pending' CHECK (qc_status IN ('pending','passed','failed')),
  qc_notes text NULL,
  qc_images jsonb NOT NULL DEFAULT '[]'::jsonb,
  qc_checked_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  qc_checked_at timestamptz NULL,
  stock_status text NOT NULL DEFAULT 'pending' CHECK (stock_status IN ('pending','available','under_correction','rejected','reserved','sold')),
  current_warehouse_id uuid NULL REFERENCES public.warehouses(id) ON DELETE SET NULL,
  current_location text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.goods_receipt_serials TO authenticated;
GRANT ALL ON public.goods_receipt_serials TO service_role;
ALTER TABLE public.goods_receipt_serials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "grs_select_auth" ON public.goods_receipt_serials FOR SELECT TO authenticated USING (true);
CREATE POLICY "grs_write_warehouse" ON public.goods_receipt_serials FOR ALL TO authenticated USING (public.can_write_inventory()) WITH CHECK (public.can_write_inventory());

CREATE INDEX IF NOT EXISTS idx_grs_gr ON public.goods_receipt_serials (goods_receipt_id);
CREATE INDEX IF NOT EXISTS idx_grs_product_status ON public.goods_receipt_serials (product_id, stock_status);
CREATE INDEX IF NOT EXISTS idx_grs_serial ON public.goods_receipt_serials (serial_number);
CREATE INDEX IF NOT EXISTS idx_grs_barcode ON public.goods_receipt_serials (barcode_value);

-- updated_at triggers
DROP TRIGGER IF EXISTS trg_gr_updated_at ON public.goods_receipts;
CREATE TRIGGER trg_gr_updated_at BEFORE UPDATE ON public.goods_receipts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_grl_updated_at ON public.goods_receipt_lines;
CREATE TRIGGER trg_grl_updated_at BEFORE UPDATE ON public.goods_receipt_lines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_grs_updated_at ON public.goods_receipt_serials;
CREATE TRIGGER trg_grs_updated_at BEFORE UPDATE ON public.goods_receipt_serials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- GR number trigger
CREATE OR REPLACE FUNCTION public.gr_set_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.gr_number IS NULL OR NEW.gr_number = '' THEN
    NEW.gr_number := public.generate_document_number('goods_receipt');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_gr_set_number ON public.goods_receipts;
CREATE TRIGGER trg_gr_set_number BEFORE INSERT ON public.goods_receipts FOR EACH ROW EXECUTE FUNCTION public.gr_set_number();

-- Helper: generate serials for a GR line
CREATE OR REPLACE FUNCTION public.generate_serials_for_gr_line(p_gr_line_id uuid)
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_line public.goods_receipt_lines%ROWTYPE;
  v_sku text;
  v_yymm text;
  v_existing int;
  v_to_create int;
  v_i int;
  v_serial text;
  v_barcode text;
  v_id uuid;
  v_out uuid[] := ARRAY[]::uuid[];
  v_qty int;
BEGIN
  SELECT * INTO v_line FROM public.goods_receipt_lines WHERE id = p_gr_line_id;
  IF v_line.id IS NULL THEN RAISE EXCEPTION 'GR line % not found', p_gr_line_id; END IF;

  SELECT COALESCE(sku, 'SKU') INTO v_sku FROM public.products WHERE id = v_line.product_id;
  v_yymm := to_char((now() AT TIME ZONE 'Asia/Kolkata')::date, 'YYMM');

  -- target qty is received_quantity (we generate labels once goods arrive)
  v_qty := GREATEST(COALESCE(v_line.received_quantity, 0), 0);

  SELECT COUNT(*) INTO v_existing FROM public.goods_receipt_serials WHERE goods_receipt_line_id = p_gr_line_id;
  v_to_create := v_qty - v_existing;
  IF v_to_create <= 0 THEN RETURN v_out; END IF;

  FOR v_i IN 1..v_to_create LOOP
    LOOP
      -- next sequence for this product+yymm
      SELECT v_sku || '-' || v_yymm || '-' || lpad(
        (COALESCE((
          SELECT MAX(CAST(split_part(serial_number, '-', array_length(string_to_array(serial_number, '-'),1)) AS integer))
          FROM public.goods_receipt_serials
          WHERE serial_number LIKE v_sku || '-' || v_yymm || '-%'
        ), 0) + 1)::text, 4, '0')
      INTO v_serial;
      v_barcode := 'GLF-' || v_serial;
      BEGIN
        INSERT INTO public.goods_receipt_serials (
          goods_receipt_id, goods_receipt_line_id, product_id, serial_number, barcode_value
        ) VALUES (v_line.goods_receipt_id, p_gr_line_id, v_line.product_id, v_serial, v_barcode)
        RETURNING id INTO v_id;
        v_out := array_append(v_out, v_id);
        EXIT;
      EXCEPTION WHEN unique_violation THEN
        -- collision (rare with concurrent inserts), retry
        CONTINUE;
      END;
    END LOOP;
  END LOOP;

  RETURN v_out;
END $$;

-- Helper: complete QC for a GR line
CREATE OR REPLACE FUNCTION public.complete_gr_line_qc(
  p_gr_line_id uuid,
  p_passed_serial_ids uuid[],
  p_failed_serial_ids uuid[],
  p_failed_notes text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_gr_id uuid;
  v_pass_cnt int := 0;
  v_fail_cnt int := 0;
  v_pending_lines int;
BEGIN
  SELECT goods_receipt_id INTO v_gr_id FROM public.goods_receipt_lines WHERE id = p_gr_line_id;
  IF v_gr_id IS NULL THEN RAISE EXCEPTION 'GR line % not found', p_gr_line_id; END IF;

  IF p_passed_serial_ids IS NOT NULL AND array_length(p_passed_serial_ids, 1) > 0 THEN
    UPDATE public.goods_receipt_serials
       SET qc_status = 'passed',
           stock_status = 'available',
           qc_checked_by = v_uid,
           qc_checked_at = now(),
           updated_at = now()
     WHERE id = ANY(p_passed_serial_ids) AND goods_receipt_line_id = p_gr_line_id;
    GET DIAGNOSTICS v_pass_cnt = ROW_COUNT;
  END IF;

  IF p_failed_serial_ids IS NOT NULL AND array_length(p_failed_serial_ids, 1) > 0 THEN
    UPDATE public.goods_receipt_serials
       SET qc_status = 'failed',
           stock_status = 'under_correction',
           qc_notes = COALESCE(p_failed_notes, qc_notes),
           qc_checked_by = v_uid,
           qc_checked_at = now(),
           updated_at = now()
     WHERE id = ANY(p_failed_serial_ids) AND goods_receipt_line_id = p_gr_line_id;
    GET DIAGNOSTICS v_fail_cnt = ROW_COUNT;
  END IF;

  UPDATE public.goods_receipt_lines
     SET accepted_quantity = COALESCE(accepted_quantity,0) + v_pass_cnt,
         under_correction_quantity = COALESCE(under_correction_quantity,0) + v_fail_cnt,
         updated_at = now()
   WHERE id = p_gr_line_id;

  -- If all lines for this GR have no pending serials, mark GR completed
  SELECT COUNT(*) INTO v_pending_lines
  FROM public.goods_receipt_serials
  WHERE goods_receipt_id = v_gr_id AND qc_status = 'pending';

  IF v_pending_lines = 0 THEN
    UPDATE public.goods_receipts
       SET status = 'completed', received_at = COALESCE(received_at, now()),
           received_by = COALESCE(received_by, v_uid), updated_at = now()
     WHERE id = v_gr_id;
  END IF;
END $$;
