-- =========================================
-- scan_queue
-- =========================================
CREATE TABLE public.scan_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type text NOT NULL CHECK (document_type IN (
    'goods_receipt','internal_transfer','pre_delivery_qc',
    'return_receipt','stock_count','correction_order','write_off'
  )),
  document_id uuid NOT NULL,
  document_reference text NOT NULL,
  expected_items_count integer NOT NULL DEFAULT 0,
  scanned_items_count integer NOT NULL DEFAULT 0,
  scan_status text NOT NULL DEFAULT 'pending' CHECK (scan_status IN ('pending','in_progress','completed')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('urgent','normal','low')),
  assigned_to uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_scan_queue_status_created ON public.scan_queue (scan_status, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.scan_queue TO authenticated;
GRANT ALL ON public.scan_queue TO service_role;

ALTER TABLE public.scan_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated can read scan_queue"
  ON public.scan_queue FOR SELECT TO authenticated USING (true);

CREATE POLICY "Warehouse+admins can insert scan_queue"
  ON public.scan_queue FOR INSERT TO authenticated
  WITH CHECK (public.can_write_inventory());

CREATE POLICY "Warehouse+admins can update scan_queue"
  ON public.scan_queue FOR UPDATE TO authenticated
  USING (public.can_write_inventory())
  WITH CHECK (public.can_write_inventory());

CREATE TRIGGER trg_scan_queue_updated_at
  BEFORE UPDATE ON public.scan_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- scan_records
-- =========================================
CREATE TABLE public.scan_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_queue_id uuid NOT NULL REFERENCES public.scan_queue(id) ON DELETE CASCADE,
  barcode text NOT NULL,
  serial_number text,
  product_id uuid REFERENCES public.products(id),
  scanned_by uuid REFERENCES auth.users(id),
  scanned_at timestamptz NOT NULL DEFAULT now(),
  scan_result text NOT NULL DEFAULT 'valid' CHECK (scan_result IN ('valid','invalid','duplicate','not_expected')),
  notes text
);
CREATE INDEX idx_scan_records_queue_time ON public.scan_records (scan_queue_id, scanned_at DESC);
CREATE INDEX idx_scan_records_serial ON public.scan_records (serial_number);
CREATE INDEX idx_scan_records_barcode ON public.scan_records (barcode);

GRANT SELECT, INSERT, UPDATE ON public.scan_records TO authenticated;
GRANT ALL ON public.scan_records TO service_role;

ALTER TABLE public.scan_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated can read scan_records"
  ON public.scan_records FOR SELECT TO authenticated USING (true);

CREATE POLICY "Warehouse+admins can insert scan_records"
  ON public.scan_records FOR INSERT TO authenticated
  WITH CHECK (public.can_write_inventory());

CREATE POLICY "Warehouse+admins can update scan_records"
  ON public.scan_records FOR UPDATE TO authenticated
  USING (public.can_write_inventory())
  WITH CHECK (public.can_write_inventory());

-- =========================================
-- label_prints
-- =========================================
CREATE TABLE public.label_prints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id),
  serial_number text NOT NULL,
  barcode_value text NOT NULL,
  label_format text NOT NULL DEFAULT 'standard' CHECK (label_format IN ('standard','thermal')),
  printed_by uuid REFERENCES auth.users(id),
  printed_at timestamptz NOT NULL DEFAULT now(),
  goods_receipt_id uuid,
  print_count integer NOT NULL DEFAULT 1
);
CREATE INDEX idx_label_prints_product ON public.label_prints (product_id, printed_at DESC);
CREATE INDEX idx_label_prints_serial ON public.label_prints (serial_number);

GRANT SELECT, INSERT, UPDATE ON public.label_prints TO authenticated;
GRANT ALL ON public.label_prints TO service_role;

ALTER TABLE public.label_prints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Warehouse+admins can read label_prints"
  ON public.label_prints FOR SELECT TO authenticated
  USING (public.can_write_inventory());

CREATE POLICY "Warehouse+admins can insert label_prints"
  ON public.label_prints FOR INSERT TO authenticated
  WITH CHECK (public.can_write_inventory());

CREATE POLICY "Warehouse+admins can update label_prints"
  ON public.label_prints FOR UPDATE TO authenticated
  USING (public.can_write_inventory())
  WITH CHECK (public.can_write_inventory());