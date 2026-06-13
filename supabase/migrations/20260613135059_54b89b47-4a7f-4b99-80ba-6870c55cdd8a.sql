
-- ============================================================
-- Phase 6 Batch 2: Return Resolution + Stock Action
-- ============================================================

-- 1) Extend numbering prefixes (RF refund, EX exchange)
CREATE OR REPLACE FUNCTION public.generate_document_number(p_document_type text)
 RETURNS text
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_fy text; v_padding integer; v_sep text; v_next integer; v_prefix text;
BEGIN
  v_fy := public.get_current_fy_label();
  SELECT sequential_padding, prefix_separator INTO v_padding, v_sep FROM public.numbering_settings LIMIT 1;
  IF v_padding IS NULL THEN v_padding := 4; END IF;
  IF v_sep IS NULL THEN v_sep := '-'; END IF;

  v_prefix := CASE lower(p_document_type)
    WHEN 'sales_order' THEN 'SO' WHEN 'quotation' THEN 'QT' WHEN 'invoice' THEN 'INV'
    WHEN 'delivery_note' THEN 'DN' WHEN 'internal_transfer' THEN 'ITO' WHEN 'internal_movement' THEN 'IM'
    WHEN 'vendor_order' THEN 'VO' WHEN 'work_order' THEN 'WO' WHEN 'return_request' THEN 'RT'
    WHEN 'credit_note' THEN 'CN' WHEN 'goods_receipt' THEN 'GR' WHEN 'payment_receipt' THEN 'PR'
    WHEN 'correction_order' THEN 'CO' WHEN 'stock_count' THEN 'SC' WHEN 'write_off' THEN 'WF'
    WHEN 'refund' THEN 'RF' WHEN 'exchange' THEN 'EX'
    ELSE upper(p_document_type) END;

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
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_fy text; v_padding integer; v_sep text; v_next integer; v_prefix text;
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
    WHEN 'sales_order' THEN 'SO' WHEN 'quotation' THEN 'QT' WHEN 'invoice' THEN 'INV'
    WHEN 'delivery_note' THEN 'DN' WHEN 'internal_transfer' THEN 'ITO' WHEN 'internal_movement' THEN 'IM'
    WHEN 'vendor_order' THEN 'VO' WHEN 'work_order' THEN 'WO' WHEN 'return_request' THEN 'RT'
    WHEN 'credit_note' THEN 'CN' WHEN 'goods_receipt' THEN 'GR' WHEN 'payment_receipt' THEN 'PR'
    WHEN 'correction_order' THEN 'CO' WHEN 'stock_count' THEN 'SC' WHEN 'write_off' THEN 'WF'
    WHEN 'refund' THEN 'RF' WHEN 'exchange' THEN 'EX'
    ELSE upper(p_document_type) END;

  RETURN v_prefix || v_sep || v_fy || v_sep || lpad(v_next::text, v_padding, '0');
END;
$function$;

-- 2) Allow credit_note_redemption on sales_order_payments + nullable account
ALTER TABLE public.sales_order_payments DROP CONSTRAINT IF EXISTS sales_order_payments_payment_mode_check;
ALTER TABLE public.sales_order_payments
  ADD CONSTRAINT sales_order_payments_payment_mode_check
  CHECK (payment_mode IN ('cash','bank_transfer','cheque','card','upi','credit_note_redemption'));
ALTER TABLE public.sales_order_payments ALTER COLUMN payment_account_id DROP NOT NULL;
ALTER TABLE public.sales_order_payments DROP CONSTRAINT IF EXISTS sop_account_required_except_cn;
ALTER TABLE public.sales_order_payments
  ADD CONSTRAINT sop_account_required_except_cn
  CHECK (payment_mode = 'credit_note_redemption' OR payment_account_id IS NOT NULL);

-- 3) credit_notes
CREATE TABLE IF NOT EXISTS public.credit_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cn_number text NOT NULL UNIQUE,
  customer_id uuid REFERENCES public.customers(id),
  customer_name_snapshot text,
  source_return_request_id uuid NOT NULL REFERENCES public.return_requests(id) ON DELETE RESTRICT,
  source_invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
  amount numeric NOT NULL CHECK (amount > 0),
  issue_date date NOT NULL DEFAULT current_date,
  expiry_date date NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','partially_used','fully_used','expired','voided')),
  amount_used numeric NOT NULL DEFAULT 0 CHECK (amount_used >= 0),
  amount_remaining numeric NOT NULL DEFAULT 0,
  notes text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  voided_by uuid REFERENCES auth.users(id),
  voided_at timestamptz,
  void_reason text
);
CREATE INDEX IF NOT EXISTS idx_cn_customer_status ON public.credit_notes(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_cn_expiry ON public.credit_notes(expiry_date);

GRANT SELECT, INSERT, UPDATE ON public.credit_notes TO authenticated;
GRANT ALL ON public.credit_notes TO service_role;
ALTER TABLE public.credit_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cn_read_sales+" ON public.credit_notes FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['sales_rep','sales_manager','accountant','admin','super_admin']::app_role[]));
CREATE POLICY "cn_insert_sales+" ON public.credit_notes FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['sales_rep','sales_manager','accountant','admin','super_admin']::app_role[]));
CREATE POLICY "cn_update_sales+" ON public.credit_notes FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['sales_rep','sales_manager','accountant','admin','super_admin']::app_role[]));

CREATE OR REPLACE FUNCTION public.cn_set_defaults()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.cn_number IS NULL OR NEW.cn_number = '' THEN
    NEW.cn_number := public.generate_document_number('credit_note');
  END IF;
  IF NEW.expiry_date IS NULL THEN
    NEW.expiry_date := NEW.issue_date + INTERVAL '6 months';
  END IF;
  NEW.amount_remaining := COALESCE(NEW.amount,0) - COALESCE(NEW.amount_used,0);
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.cn_recalc_remaining()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.amount_remaining := COALESCE(NEW.amount,0) - COALESCE(NEW.amount_used,0);
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_cn_set_defaults ON public.credit_notes;
CREATE TRIGGER trg_cn_set_defaults BEFORE INSERT ON public.credit_notes
  FOR EACH ROW EXECUTE FUNCTION public.cn_set_defaults();
DROP TRIGGER IF EXISTS trg_cn_recalc_remaining ON public.credit_notes;
CREATE TRIGGER trg_cn_recalc_remaining BEFORE UPDATE ON public.credit_notes
  FOR EACH ROW EXECUTE FUNCTION public.cn_recalc_remaining();

-- 4) credit_note_redemptions
CREATE TABLE IF NOT EXISTS public.credit_note_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_note_id uuid NOT NULL REFERENCES public.credit_notes(id) ON DELETE CASCADE,
  applied_to_invoice_id uuid REFERENCES public.invoices(id),
  applied_to_sales_order_id uuid REFERENCES public.sales_orders(id),
  amount_applied numeric NOT NULL CHECK (amount_applied > 0),
  applied_at timestamptz NOT NULL DEFAULT now(),
  applied_by uuid NOT NULL REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS idx_cnr_cn ON public.credit_note_redemptions(credit_note_id);

GRANT SELECT, INSERT ON public.credit_note_redemptions TO authenticated;
GRANT ALL ON public.credit_note_redemptions TO service_role;
ALTER TABLE public.credit_note_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cnr_read_sales+" ON public.credit_note_redemptions FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['sales_rep','sales_manager','accountant','admin','super_admin']::app_role[]));
CREATE POLICY "cnr_insert_sales+" ON public.credit_note_redemptions FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['sales_rep','sales_manager','accountant','admin','super_admin']::app_role[]));

-- 5) refunds
CREATE TABLE IF NOT EXISTS public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_number text NOT NULL UNIQUE,
  source_return_request_id uuid NOT NULL REFERENCES public.return_requests(id) ON DELETE RESTRICT,
  source_invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
  customer_id uuid REFERENCES public.customers(id),
  customer_name_snapshot text,
  amount numeric NOT NULL CHECK (amount > 0),
  refund_mode text NOT NULL CHECK (refund_mode IN ('cash','bank_transfer','cheque','upi')),
  payment_account_id uuid NOT NULL REFERENCES public.payment_accounts(id),
  reference_number text,
  refund_date timestamptz NOT NULL DEFAULT now(),
  notes text,
  processed_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_refunds_rt ON public.refunds(source_return_request_id);
CREATE INDEX IF NOT EXISTS idx_refunds_customer_date ON public.refunds(customer_id, refund_date DESC);

GRANT SELECT, INSERT ON public.refunds TO authenticated;
GRANT ALL ON public.refunds TO service_role;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "refunds_read_sales+" ON public.refunds FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['sales_rep','sales_manager','accountant','admin','super_admin']::app_role[]));
CREATE POLICY "refunds_insert_super" ON public.refunds FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE OR REPLACE FUNCTION public.enforce_real_time_refund_date()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.refund_date := now();
  IF NEW.refund_number IS NULL OR NEW.refund_number = '' THEN
    NEW.refund_number := public.generate_document_number('refund');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_refunds_realtime_date ON public.refunds;
CREATE TRIGGER trg_refunds_realtime_date BEFORE INSERT ON public.refunds
  FOR EACH ROW EXECUTE FUNCTION public.enforce_real_time_refund_date();

-- 6) exchanges
CREATE TABLE IF NOT EXISTS public.exchanges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_number text NOT NULL UNIQUE,
  source_return_request_id uuid NOT NULL REFERENCES public.return_requests(id) ON DELETE RESTRICT,
  source_invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
  return_request_item_id uuid NOT NULL REFERENCES public.return_request_items(id) ON DELETE RESTRICT,
  customer_id uuid REFERENCES public.customers(id),
  original_serial_id uuid NOT NULL REFERENCES public.goods_receipt_serials(id),
  replacement_serial_id uuid REFERENCES public.goods_receipt_serials(id),
  replacement_product_id uuid NOT NULL REFERENCES public.products(id),
  original_unit_price numeric NOT NULL CHECK (original_unit_price >= 0),
  replacement_unit_price numeric NOT NULL CHECK (replacement_unit_price >= 0),
  price_difference numeric NOT NULL DEFAULT 0,
  price_difference_settled boolean NOT NULL DEFAULT false,
  payment_received_id uuid REFERENCES public.sales_order_payments(id),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','item_selected','price_settled','delivered','completed','cancelled')),
  notes text,
  processed_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_exch_rt ON public.exchanges(source_return_request_id);
CREATE INDEX IF NOT EXISTS idx_exch_replacement_serial ON public.exchanges(replacement_serial_id);

GRANT SELECT, INSERT, UPDATE ON public.exchanges TO authenticated;
GRANT ALL ON public.exchanges TO service_role;
ALTER TABLE public.exchanges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exch_read_sales+" ON public.exchanges FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['sales_rep','sales_manager','accountant','admin','super_admin']::app_role[]));
CREATE POLICY "exch_insert_sales+" ON public.exchanges FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['sales_rep','sales_manager','accountant','admin','super_admin']::app_role[]));
CREATE POLICY "exch_update_sales+" ON public.exchanges FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['sales_rep','sales_manager','accountant','admin','super_admin']::app_role[]));

CREATE OR REPLACE FUNCTION public.exch_set_defaults()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.exchange_number IS NULL OR NEW.exchange_number = '' THEN
    NEW.exchange_number := public.generate_document_number('exchange');
  END IF;
  NEW.price_difference := COALESCE(NEW.replacement_unit_price,0) - COALESCE(NEW.original_unit_price,0);
  NEW.updated_at := now();
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.exch_recalc()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.price_difference := COALESCE(NEW.replacement_unit_price,0) - COALESCE(NEW.original_unit_price,0);
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_exch_set_defaults ON public.exchanges;
CREATE TRIGGER trg_exch_set_defaults BEFORE INSERT ON public.exchanges
  FOR EACH ROW EXECUTE FUNCTION public.exch_set_defaults();
DROP TRIGGER IF EXISTS trg_exch_recalc ON public.exchanges;
CREATE TRIGGER trg_exch_recalc BEFORE UPDATE ON public.exchanges
  FOR EACH ROW EXECUTE FUNCTION public.exch_recalc();

-- 7) process_exchange_resolution
CREATE OR REPLACE FUNCTION public.process_exchange_resolution(
  p_item_id uuid,
  p_replacement_product_id uuid
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_item public.return_request_items%ROWTYPE;
  v_rt public.return_requests%ROWTYPE;
  v_replacement_price numeric;
  v_exch_id uuid;
BEGIN
  SELECT * INTO v_item FROM public.return_request_items WHERE id = p_item_id FOR UPDATE;
  IF v_item.id IS NULL THEN RAISE EXCEPTION 'Return item % not found', p_item_id; END IF;
  IF v_item.resolution_status = 'completed' THEN RAISE EXCEPTION 'Item already resolved'; END IF;

  SELECT * INTO v_rt FROM public.return_requests WHERE id = v_item.return_request_id;
  IF v_rt.id IS NULL THEN RAISE EXCEPTION 'Return request not found'; END IF;

  SELECT COALESCE(sale_price, list_price, 0) INTO v_replacement_price
    FROM public.products WHERE id = p_replacement_product_id;
  IF v_replacement_price IS NULL THEN RAISE EXCEPTION 'Replacement product not found'; END IF;
  IF v_replacement_price < v_item.original_unit_price THEN
    RAISE EXCEPTION 'Replacement price (₹%) must be >= original price (₹%)',
      v_replacement_price, v_item.original_unit_price;
  END IF;

  INSERT INTO public.exchanges (
    exchange_number, source_return_request_id, source_invoice_id, return_request_item_id,
    customer_id, original_serial_id, replacement_product_id,
    original_unit_price, replacement_unit_price, status, processed_by
  ) VALUES (
    '', v_rt.id, v_rt.source_invoice_id, v_item.id,
    v_rt.customer_id, v_item.goods_receipt_serial_id, p_replacement_product_id,
    v_item.original_unit_price, v_replacement_price, 'pending', auth.uid()
  ) RETURNING id INTO v_exch_id;

  UPDATE public.return_request_items
     SET resolution_type = 'exchange', resolution_status = 'in_progress', updated_at = now()
   WHERE id = p_item_id;

  RETURN v_exch_id;
END $$;

-- 8) process_credit_note_resolution
CREATE OR REPLACE FUNCTION public.process_credit_note_resolution(
  p_item_id uuid,
  p_notes text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_item public.return_request_items%ROWTYPE;
  v_rt public.return_requests%ROWTYPE;
  v_cn_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Only super admins can issue credit notes';
  END IF;

  SELECT * INTO v_item FROM public.return_request_items WHERE id = p_item_id FOR UPDATE;
  IF v_item.id IS NULL THEN RAISE EXCEPTION 'Return item % not found', p_item_id; END IF;
  IF v_item.resolution_status = 'completed' THEN RAISE EXCEPTION 'Item already resolved'; END IF;

  SELECT * INTO v_rt FROM public.return_requests WHERE id = v_item.return_request_id;

  INSERT INTO public.credit_notes (
    cn_number, customer_id, customer_name_snapshot,
    source_return_request_id, source_invoice_id, amount,
    issue_date, expiry_date, status, notes, created_by
  ) VALUES (
    '', v_rt.customer_id, v_rt.customer_name_snapshot,
    v_rt.id, v_rt.source_invoice_id, v_item.original_unit_price,
    current_date, current_date + INTERVAL '6 months', 'active', p_notes, auth.uid()
  ) RETURNING id INTO v_cn_id;

  UPDATE public.return_request_items
     SET resolution_type = 'credit_note', resolution_status = 'completed', updated_at = now()
   WHERE id = p_item_id;

  RETURN v_cn_id;
END $$;

-- 9) process_refund_resolution
CREATE OR REPLACE FUNCTION public.process_refund_resolution(
  p_item_id uuid,
  p_amount numeric,
  p_mode text,
  p_payment_account_id uuid,
  p_reference text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_item public.return_request_items%ROWTYPE;
  v_rt public.return_requests%ROWTYPE;
  v_refund_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Only super admins can process refunds';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be greater than zero'; END IF;
  IF p_mode NOT IN ('cash','bank_transfer','cheque','upi') THEN
    RAISE EXCEPTION 'Invalid refund mode: %', p_mode;
  END IF;

  SELECT * INTO v_item FROM public.return_request_items WHERE id = p_item_id FOR UPDATE;
  IF v_item.id IS NULL THEN RAISE EXCEPTION 'Return item % not found', p_item_id; END IF;
  IF v_item.resolution_status = 'completed' THEN RAISE EXCEPTION 'Item already resolved'; END IF;

  SELECT * INTO v_rt FROM public.return_requests WHERE id = v_item.return_request_id;

  INSERT INTO public.refunds (
    refund_number, source_return_request_id, source_invoice_id,
    customer_id, customer_name_snapshot, amount,
    refund_mode, payment_account_id, reference_number, processed_by
  ) VALUES (
    '', v_rt.id, v_rt.source_invoice_id,
    v_rt.customer_id, v_rt.customer_name_snapshot, p_amount,
    p_mode, p_payment_account_id, p_reference, auth.uid()
  ) RETURNING id INTO v_refund_id;

  UPDATE public.return_request_items
     SET resolution_type = 'refund', resolution_status = 'completed', updated_at = now()
   WHERE id = p_item_id;

  RETURN v_refund_id;
END $$;

-- 10) apply_stock_action
CREATE OR REPLACE FUNCTION public.apply_stock_action(p_item_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_item public.return_request_items%ROWTYPE;
  v_rt public.return_requests%ROWTYPE;
  v_action text;
  v_co_id uuid;
  v_wf_id uuid;
BEGIN
  SELECT * INTO v_item FROM public.return_request_items WHERE id = p_item_id FOR UPDATE;
  IF v_item.id IS NULL THEN RAISE EXCEPTION 'Return item % not found', p_item_id; END IF;
  IF v_item.condition_grade IS NULL THEN RAISE EXCEPTION 'QC not complete'; END IF;

  SELECT * INTO v_rt FROM public.return_requests WHERE id = v_item.return_request_id;

  IF v_item.condition_grade = 'like_new' THEN
    UPDATE public.goods_receipt_serials
       SET stock_status = 'available', updated_at = now()
     WHERE id = v_item.goods_receipt_serial_id;
    v_action := 'returned_to_available';

  ELSIF v_item.condition_grade = 'minor_damage' THEN
    UPDATE public.goods_receipt_serials
       SET stock_status = 'under_correction', updated_at = now()
     WHERE id = v_item.goods_receipt_serial_id;

    -- find or create draft CO for this return
    SELECT id INTO v_co_id
      FROM public.correction_orders
     WHERE source_type = 'return' AND source_document_id = v_rt.id AND status = 'draft'
     LIMIT 1;
    IF v_co_id IS NULL THEN
      INSERT INTO public.correction_orders (
        co_number, source_type, source_document_id, source_document_reference,
        addressed_to_type, addressed_to_name, correction_type, status, created_by
      ) VALUES (
        public.generate_document_number('correction_order'),
        'return', v_rt.id, v_rt.rt_number,
        'internal', NULL, 'repair', 'draft', auth.uid()
      ) RETURNING id INTO v_co_id;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.correction_order_items
                   WHERE goods_receipt_serial_id = v_item.goods_receipt_serial_id
                     AND correction_order_id = v_co_id) THEN
      INSERT INTO public.correction_order_items (
        correction_order_id, goods_receipt_serial_id, product_id, serial_number,
        original_qc_notes, original_qc_images, latest_qc_status, latest_qc_cycle, current_status
      ) VALUES (
        v_co_id, v_item.goods_receipt_serial_id, v_item.product_id, v_item.serial_number,
        v_item.qc_notes, COALESCE(v_item.qc_images, '[]'::jsonb), 'failed', 1, 'awaiting_correction'
      );
    END IF;
    v_action := 'sent_to_correction:' || v_co_id::text;

  ELSIF v_item.condition_grade = 'unsalvageable' THEN
    -- find or create draft write-off for this return
    SELECT id INTO v_wf_id
      FROM public.write_off_records
     WHERE source_type = 'return' AND source_document_id = v_rt.id AND status = 'draft'
     LIMIT 1;
    IF v_wf_id IS NULL THEN
      INSERT INTO public.write_off_records (
        wf_number, write_off_type, source_type, source_document_id, source_document_reference,
        status, reason, evidence_photos, created_by
      ) VALUES (
        public.generate_document_number('write_off'),
        'qc_unsalvageable', 'return', v_rt.id, v_rt.rt_number,
        'draft', 'Return QC unsalvageable',
        COALESCE(v_item.qc_images, '[]'::jsonb),
        auth.uid()
      ) RETURNING id INTO v_wf_id;
    ELSE
      -- merge evidence photos
      UPDATE public.write_off_records
         SET evidence_photos = evidence_photos || COALESCE(v_item.qc_images, '[]'::jsonb),
             updated_at = now()
       WHERE id = v_wf_id;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.write_off_items
                   WHERE goods_receipt_serial_id = v_item.goods_receipt_serial_id
                     AND write_off_record_id = v_wf_id) THEN
      INSERT INTO public.write_off_items (
        write_off_record_id, goods_receipt_serial_id, product_id, serial_number,
        unit_cost_value, item_specific_notes
      ) VALUES (
        v_wf_id, v_item.goods_receipt_serial_id, v_item.product_id, v_item.serial_number,
        v_item.original_unit_price, v_item.qc_notes
      );
    END IF;
    v_action := 'drafted_write_off:' || v_wf_id::text;
  END IF;

  UPDATE public.return_request_items
     SET resolution_status = 'completed', updated_at = now()
   WHERE id = p_item_id;

  RETURN jsonb_build_object('action', v_action, 'item_id', p_item_id);
END $$;

-- 11) complete_return_request
CREATE OR REPLACE FUNCTION public.complete_return_request(p_rt_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_pending int;
BEGIN
  SELECT COUNT(*) INTO v_pending
    FROM public.return_request_items
   WHERE return_request_id = p_rt_id
     AND resolution_status <> 'completed';
  IF v_pending > 0 THEN
    RAISE EXCEPTION '% items still have unresolved status', v_pending;
  END IF;

  UPDATE public.return_requests
     SET request_status = 'resolved', updated_at = now()
   WHERE id = p_rt_id;

  RETURN jsonb_build_object('rt_id', p_rt_id, 'status', 'resolved');
END $$;

-- 12) redeem_credit_note
CREATE OR REPLACE FUNCTION public.redeem_credit_note(
  p_cn_id uuid,
  p_invoice_id uuid,
  p_sales_order_id uuid,
  p_amount_to_apply numeric
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_cn public.credit_notes%ROWTYPE;
  v_new_used numeric;
  v_new_status text;
  v_redemption_id uuid;
BEGIN
  SELECT * INTO v_cn FROM public.credit_notes WHERE id = p_cn_id FOR UPDATE;
  IF v_cn.id IS NULL THEN RAISE EXCEPTION 'Credit note not found'; END IF;
  IF v_cn.status NOT IN ('active','partially_used') THEN
    RAISE EXCEPTION 'Credit note is %', v_cn.status;
  END IF;
  IF v_cn.expiry_date < current_date THEN
    UPDATE public.credit_notes SET status='expired' WHERE id = p_cn_id;
    RAISE EXCEPTION 'Credit note has expired';
  END IF;
  IF p_amount_to_apply <= 0 OR p_amount_to_apply > v_cn.amount_remaining THEN
    RAISE EXCEPTION 'Invalid amount: % (remaining: %)', p_amount_to_apply, v_cn.amount_remaining;
  END IF;
  IF p_invoice_id IS NULL AND p_sales_order_id IS NULL THEN
    RAISE EXCEPTION 'Must apply to either an invoice or a sales order';
  END IF;

  INSERT INTO public.credit_note_redemptions (
    credit_note_id, applied_to_invoice_id, applied_to_sales_order_id, amount_applied, applied_by
  ) VALUES (p_cn_id, p_invoice_id, p_sales_order_id, p_amount_to_apply, auth.uid())
  RETURNING id INTO v_redemption_id;

  v_new_used := v_cn.amount_used + p_amount_to_apply;
  v_new_status := CASE WHEN v_new_used >= v_cn.amount THEN 'fully_used' ELSE 'partially_used' END;

  UPDATE public.credit_notes
     SET amount_used = v_new_used, status = v_new_status
   WHERE id = p_cn_id;

  -- If applied to a SO, record as a sales_order_payment with credit_note_redemption mode
  IF p_sales_order_id IS NOT NULL THEN
    INSERT INTO public.sales_order_payments (
      sales_order_id, payment_number, amount, payment_mode,
      payment_account_id, reference_number, notes, received_by
    ) VALUES (
      p_sales_order_id, '', p_amount_to_apply, 'credit_note_redemption',
      NULL, v_cn.cn_number, 'Credit Note ' || v_cn.cn_number || ' applied', auth.uid()
    );
  END IF;

  RETURN v_redemption_id;
END $$;

-- 13) expire_credit_notes (called periodically from client)
CREATE OR REPLACE FUNCTION public.expire_credit_notes()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count int;
BEGIN
  WITH upd AS (
    UPDATE public.credit_notes
       SET status = 'expired'
     WHERE expiry_date < current_date
       AND status IN ('active','partially_used')
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_count FROM upd;
  RETURN COALESCE(v_count, 0);
END $$;

-- 14) void_credit_note (super_admin only)
CREATE OR REPLACE FUNCTION public.void_credit_note(p_cn_id uuid, p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Only super admins can void credit notes';
  END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) < 3 THEN
    RAISE EXCEPTION 'A reason is required to void';
  END IF;
  UPDATE public.credit_notes
     SET status = 'voided', voided_by = auth.uid(), voided_at = now(), void_reason = p_reason
   WHERE id = p_cn_id AND status NOT IN ('voided','fully_used');
END $$;

CREATE TRIGGER trg_refunds_updated BEFORE UPDATE ON public.credit_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
