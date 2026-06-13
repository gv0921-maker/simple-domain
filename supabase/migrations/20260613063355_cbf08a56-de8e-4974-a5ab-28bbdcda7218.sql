
-- Phase 3 Batch 5: Write-off / Scrap workflow + stock bucket finalization

CREATE TABLE IF NOT EXISTS public.write_off_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wf_number text NOT NULL UNIQUE,
  write_off_type text NOT NULL CHECK (write_off_type IN ('damage','loss','theft','obsolete','scrap','count_missing','qc_unsalvageable','other')),
  source_type text CHECK (source_type IN ('stock_count','correction_order','return','damage_report','manual')),
  source_document_id uuid,
  source_document_reference text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','cancelled')),
  reason text NOT NULL DEFAULT '',
  evidence_photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_value numeric NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  approved_by uuid REFERENCES auth.users,
  approved_at timestamptz,
  cancelled_by uuid REFERENCES auth.users,
  cancelled_at timestamptz,
  cancellation_reason text,
  CONSTRAINT write_off_reason_not_empty CHECK (status <> 'approved' OR length(trim(reason)) > 0)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.write_off_records TO authenticated;
GRANT ALL ON public.write_off_records TO service_role;
ALTER TABLE public.write_off_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wf_select_inv" ON public.write_off_records FOR SELECT TO authenticated
  USING (public.can_write_inventory() OR public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));
CREATE POLICY "wf_insert_inv" ON public.write_off_records FOR INSERT TO authenticated
  WITH CHECK (public.can_write_inventory() OR public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));
CREATE POLICY "wf_update_draft_owner_or_super" ON public.write_off_records FOR UPDATE TO authenticated
  USING (
    (status = 'draft' AND (created_by = auth.uid() OR public.has_role(auth.uid(), 'super_admin'::app_role)))
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );
CREATE POLICY "wf_delete_super" ON public.write_off_records FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_wf_status_created ON public.write_off_records (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wf_type ON public.write_off_records (write_off_type);

CREATE TRIGGER trg_wf_updated_at BEFORE UPDATE ON public.write_off_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.wf_set_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.wf_number IS NULL OR NEW.wf_number = '' THEN
    NEW.wf_number := public.generate_document_number('write_off');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_wf_set_number BEFORE INSERT ON public.write_off_records
  FOR EACH ROW EXECUTE FUNCTION public.wf_set_number();

CREATE TABLE IF NOT EXISTS public.write_off_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  write_off_record_id uuid NOT NULL REFERENCES public.write_off_records(id) ON DELETE CASCADE,
  goods_receipt_serial_id uuid NOT NULL REFERENCES public.goods_receipt_serials(id),
  product_id uuid NOT NULL REFERENCES public.products(id),
  serial_number text NOT NULL,
  unit_cost_value numeric NOT NULL DEFAULT 0,
  item_specific_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (write_off_record_id, goods_receipt_serial_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.write_off_items TO authenticated;
GRANT ALL ON public.write_off_items TO service_role;
ALTER TABLE public.write_off_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wfi_select_inv" ON public.write_off_items FOR SELECT TO authenticated
  USING (public.can_write_inventory() OR public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));
CREATE POLICY "wfi_modify_draft" ON public.write_off_items FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.write_off_records r WHERE r.id = write_off_record_id
            AND (r.status = 'draft' OR public.has_role(auth.uid(), 'super_admin'::app_role)))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.write_off_records r WHERE r.id = write_off_record_id
            AND (r.status = 'draft' OR public.has_role(auth.uid(), 'super_admin'::app_role)))
  );

CREATE INDEX IF NOT EXISTS idx_wfi_record ON public.write_off_items (write_off_record_id);
CREATE INDEX IF NOT EXISTS idx_wfi_serial ON public.write_off_items (goods_receipt_serial_id);

DO $$ BEGIN
  BEGIN
    ALTER TABLE public.goods_receipt_serials DROP CONSTRAINT IF EXISTS goods_receipt_serials_stock_status_check;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

ALTER TABLE public.goods_receipt_serials
  ADD CONSTRAINT goods_receipt_serials_stock_status_check
  CHECK (stock_status IN ('pending','available','under_correction','reserved','sold','returned_to_vendor','written_off','rejected'));

CREATE OR REPLACE FUNCTION public.approve_write_off(p_wf_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_rec public.write_off_records%ROWTYPE;
  v_item_count int;
  v_total numeric := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Only super admins can approve write-offs';
  END IF;

  SELECT * INTO v_rec FROM public.write_off_records WHERE id = p_wf_id FOR UPDATE;
  IF v_rec.id IS NULL THEN RAISE EXCEPTION 'Write-off % not found', p_wf_id; END IF;
  IF v_rec.status <> 'draft' THEN RAISE EXCEPTION 'Write-off is in status %', v_rec.status; END IF;
  IF length(trim(coalesce(v_rec.reason,''))) = 0 THEN RAISE EXCEPTION 'Reason is required'; END IF;
  IF jsonb_array_length(coalesce(v_rec.evidence_photos,'[]'::jsonb)) < 1 THEN
    RAISE EXCEPTION 'At least one evidence photo is required';
  END IF;

  SELECT COUNT(*), COALESCE(SUM(unit_cost_value),0) INTO v_item_count, v_total
    FROM public.write_off_items WHERE write_off_record_id = p_wf_id;
  IF v_item_count = 0 THEN RAISE EXCEPTION 'At least one item is required'; END IF;

  UPDATE public.goods_receipt_serials
     SET stock_status = 'written_off', updated_at = now()
   WHERE id IN (SELECT goods_receipt_serial_id FROM public.write_off_items WHERE write_off_record_id = p_wf_id);

  UPDATE public.write_off_records
     SET status = 'approved', approved_by = auth.uid(), approved_at = now(),
         total_value = v_total, updated_at = now()
   WHERE id = p_wf_id;

  RETURN jsonb_build_object('success', true, 'total_value', v_total, 'item_count', v_item_count);
END $$;

CREATE OR REPLACE FUNCTION public.cancel_write_off(p_wf_id uuid, p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_status text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Only super admins can cancel write-offs';
  END IF;
  SELECT status INTO v_status FROM public.write_off_records WHERE id = p_wf_id FOR UPDATE;
  IF v_status IS NULL THEN RAISE EXCEPTION 'Write-off not found'; END IF;
  IF v_status <> 'draft' THEN RAISE EXCEPTION 'Only draft write-offs can be cancelled'; END IF;

  UPDATE public.write_off_records
     SET status = 'cancelled', cancelled_by = auth.uid(), cancelled_at = now(),
         cancellation_reason = p_reason, updated_at = now()
   WHERE id = p_wf_id;
  RETURN jsonb_build_object('success', true);
END $$;

CREATE OR REPLACE VIEW public.v_stock_summary AS
SELECT
  s.product_id,
  s.stock_status,
  COUNT(*)::bigint AS unit_count,
  COALESCE(SUM(p.cost_price), 0) AS total_value
FROM public.goods_receipt_serials s
LEFT JOIN public.products p ON p.id = s.product_id
GROUP BY s.product_id, s.stock_status;

GRANT SELECT ON public.v_stock_summary TO authenticated;
GRANT SELECT ON public.v_stock_summary TO service_role;

CREATE OR REPLACE FUNCTION public.get_product_stock_breakdown(p_product_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_result jsonb;
BEGIN
  SELECT jsonb_object_agg(stock_status, unit_count) INTO v_result
    FROM public.v_stock_summary WHERE product_id = p_product_id;
  RETURN COALESCE(v_result, '{}'::jsonb);
END $$;
