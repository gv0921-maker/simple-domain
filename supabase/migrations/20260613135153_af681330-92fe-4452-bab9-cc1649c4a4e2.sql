
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
        'factory', NULL, 'repair', 'draft', auth.uid()
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
