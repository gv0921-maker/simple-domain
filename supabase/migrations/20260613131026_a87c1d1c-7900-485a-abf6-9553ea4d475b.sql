
-- Phase 5 Batch 1: Part Billing

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS is_partial boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS invoice_sequence_in_so integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS superseded_by_credit_note_id uuid,
  ADD COLUMN IF NOT EXISTS payment_account_id uuid REFERENCES public.payment_accounts(id),
  ADD COLUMN IF NOT EXISTS invoice_type_override_reason text,
  ADD COLUMN IF NOT EXISTS invoice_type_override_by uuid;

ALTER TABLE public.invoice_lines
  ADD COLUMN IF NOT EXISTS sales_order_line_id uuid REFERENCES public.order_lines(id),
  ADD COLUMN IF NOT EXISTS quantity_from_so_line numeric;

ALTER TABLE public.order_lines
  ADD COLUMN IF NOT EXISTS quantity_invoiced numeric NOT NULL DEFAULT 0;

-- Generated column for remaining-to-invoice
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='order_lines' AND column_name='quantity_remaining_to_invoice'
  ) THEN
    EXECUTE 'ALTER TABLE public.order_lines ADD COLUMN quantity_remaining_to_invoice numeric GENERATED ALWAYS AS (quantity - COALESCE(quantity_invoiced,0)) STORED';
  END IF;
END $$;

-- Validate invoice type against SO payment modes
CREATE OR REPLACE FUNCTION public.validate_invoice_type_against_so(p_so_id uuid, p_invoice_type text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_modes text[];
  v_non_cash int;
BEGIN
  SELECT COALESCE(array_agg(DISTINCT payment_mode), ARRAY[]::text[]) INTO v_modes
    FROM public.sales_order_payments
   WHERE sales_order_id = p_so_id AND is_voided = false;

  IF p_invoice_type = 'warranty' OR p_invoice_type = 'warranty_bill' THEN
    SELECT COUNT(*) INTO v_non_cash
      FROM public.sales_order_payments
     WHERE sales_order_id = p_so_id AND is_voided = false AND payment_mode <> 'cash';
    IF v_non_cash > 0 THEN
      RETURN jsonb_build_object(
        'valid', false,
        'message', 'Warranty Bill requires all payments to be cash. Current modes: ' || array_to_string(v_modes, ', '),
        'payment_modes_used', to_jsonb(v_modes)
      );
    END IF;
    RETURN jsonb_build_object('valid', true, 'message', 'OK', 'payment_modes_used', to_jsonb(v_modes));
  ELSIF p_invoice_type = 'factory' OR p_invoice_type = 'factory_bill' THEN
    RETURN jsonb_build_object('valid', true, 'message', 'OK', 'payment_modes_used', to_jsonb(v_modes));
  ELSE
    RETURN jsonb_build_object('valid', true, 'message', 'OK', 'payment_modes_used', to_jsonb(v_modes));
  END IF;
END $$;

-- SO invoice summary
CREATE OR REPLACE FUNCTION public.get_so_invoice_summary(p_so_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total numeric;
  v_invoiced numeric;
  v_count int;
  v_lines jsonb;
BEGIN
  SELECT COALESCE(total,0) INTO v_total FROM public.sales_orders WHERE id = p_so_id;
  SELECT COALESCE(SUM(total),0), COUNT(*) INTO v_invoiced, v_count
    FROM public.invoices WHERE sales_order_id = p_so_id AND COALESCE(status,'') <> 'cancelled';

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'line_id', ol.id,
    'product_id', ol.product_id,
    'product', ol.product_name,
    'qty_ordered', ol.quantity,
    'qty_invoiced', COALESCE(ol.quantity_invoiced,0),
    'qty_remaining', GREATEST(ol.quantity - COALESCE(ol.quantity_invoiced,0), 0),
    'unit_price', ol.unit_price,
    'gst_rate', COALESCE(ol.gst_rate, 0),
    'fully_invoiced', COALESCE(ol.quantity_invoiced,0) >= ol.quantity
  ) ORDER BY ol.created_at), '[]'::jsonb)
  INTO v_lines
  FROM public.order_lines ol
  WHERE ol.order_id = p_so_id;

  RETURN jsonb_build_object(
    'total_order_value', v_total,
    'total_invoiced_value', v_invoiced,
    'balance_to_invoice', GREATEST(v_total - v_invoiced, 0),
    'invoice_count', v_count,
    'line_summary', v_lines
  );
END $$;

-- Create partial invoice
CREATE OR REPLACE FUNCTION public.create_partial_invoice(
  p_so_id uuid,
  p_invoice_type text,
  p_line_quantities jsonb,
  p_payment_account_id uuid,
  p_override_reason text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_so RECORD;
  v_validation jsonb;
  v_invoice_id uuid;
  v_reference text;
  v_seq int;
  v_subtotal numeric := 0;
  v_tax numeric := 0;
  v_total numeric := 0;
  v_item jsonb;
  v_line RECORD;
  v_qty numeric;
  v_line_sub numeric;
  v_line_tax numeric;
  v_remaining_unfinished int;
  v_is_partial boolean;
  v_norm_type text;
  v_state text;
  v_intra boolean;
  v_cgst numeric;
  v_sgst numeric;
  v_igst numeric;
  v_uid uuid := auth.uid();
BEGIN
  SELECT * INTO v_so FROM public.sales_orders WHERE id = p_so_id FOR UPDATE;
  IF v_so.id IS NULL THEN RAISE EXCEPTION 'Sales order not found'; END IF;
  IF v_so.status IN ('cancelled','closed') THEN
    RAISE EXCEPTION 'Sales order is % and cannot be invoiced', v_so.status;
  END IF;
  IF v_so.status NOT IN ('ready_to_invoice','invoicing','invoiced','fulfilling') THEN
    RAISE EXCEPTION 'Sales order is not ready to invoice (status: %)', v_so.status;
  END IF;

  v_norm_type := CASE
    WHEN p_invoice_type IN ('warranty','warranty_bill') THEN 'warranty'
    WHEN p_invoice_type IN ('factory','factory_bill') THEN 'factory'
    ELSE 'regular' END;

  v_validation := public.validate_invoice_type_against_so(p_so_id, v_norm_type);
  IF (v_validation->>'valid')::boolean = false AND p_override_reason IS NULL THEN
    RAISE EXCEPTION 'Invoice type validation failed: %', v_validation->>'message';
  END IF;

  -- GST mode based on billing state vs company
  SELECT lower(COALESCE(v_so.billing_state,'')) = lower(COALESCE((SELECT company_state FROM public.company_settings LIMIT 1),''))
    INTO v_intra;

  v_seq := (SELECT COUNT(*)+1 FROM public.invoices
            WHERE sales_order_id = p_so_id AND COALESCE(status,'') <> 'cancelled');

  v_reference := public.generate_document_number('invoice');

  INSERT INTO public.invoices (
    reference, customer_id, sales_order_id, type, issue_date, due_date, status,
    subtotal, tax_amount, discount_amount, total, paid_amount, currency,
    price_approval_status, is_partial, invoice_sequence_in_so,
    payment_account_id, invoice_type_override_reason, invoice_type_override_by
  ) VALUES (
    v_reference, v_so.customer_id, p_so_id, v_norm_type,
    (now() AT TIME ZONE 'Asia/Kolkata')::date, (now() AT TIME ZONE 'Asia/Kolkata')::date,
    'paid', 0, 0, 0, 0, 0, COALESCE(v_so.currency,'INR'),
    'not_required', false, v_seq,
    p_payment_account_id,
    p_override_reason,
    CASE WHEN p_override_reason IS NOT NULL THEN v_uid ELSE NULL END
  ) RETURNING id INTO v_invoice_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_line_quantities) LOOP
    v_qty := COALESCE((v_item->>'quantity_to_invoice')::numeric, 0);
    IF v_qty <= 0 THEN CONTINUE; END IF;

    SELECT * INTO v_line FROM public.order_lines
     WHERE id = (v_item->>'sales_order_line_id')::uuid AND order_id = p_so_id FOR UPDATE;
    IF v_line.id IS NULL THEN RAISE EXCEPTION 'SO line % not found', v_item->>'sales_order_line_id'; END IF;

    IF v_qty > (v_line.quantity - COALESCE(v_line.quantity_invoiced,0)) THEN
      RAISE EXCEPTION 'Qty % exceeds remaining-to-invoice for line %', v_qty, v_line.id;
    END IF;

    v_line_sub := ROUND(v_qty * COALESCE(v_line.unit_price,0), 2);
    v_line_tax := ROUND(v_line_sub * COALESCE(v_line.gst_rate,0) / 100.0, 2);

    IF v_intra THEN
      v_cgst := ROUND(v_line_tax/2.0, 2); v_sgst := v_line_tax - v_cgst; v_igst := 0;
    ELSE
      v_igst := v_line_tax; v_cgst := 0; v_sgst := 0;
    END IF;

    INSERT INTO public.invoice_lines (
      invoice_id, product_id, description, quantity, unit_price, discount, tax_rate,
      subtotal, cgst_amount, sgst_amount, igst_amount, final_amount,
      sales_order_line_id, quantity_from_so_line
    ) VALUES (
      v_invoice_id, v_line.product_id, COALESCE(v_line.product_name,'Item'),
      v_qty, v_line.unit_price, 0, COALESCE(v_line.gst_rate,0),
      v_line_sub, v_cgst, v_sgst, v_igst, v_line_sub + v_line_tax,
      v_line.id, v_qty
    );

    UPDATE public.order_lines
       SET quantity_invoiced = COALESCE(quantity_invoiced,0) + v_qty,
           updated_at = now()
     WHERE id = v_line.id;

    v_subtotal := v_subtotal + v_line_sub;
    v_tax := v_tax + v_line_tax;
    v_total := v_total + v_line_sub + v_line_tax;
  END LOOP;

  UPDATE public.invoices
     SET subtotal = v_subtotal, tax_amount = v_tax, total = v_total, paid_amount = v_total,
         is_partial = EXISTS (
           SELECT 1 FROM public.order_lines ol WHERE ol.order_id = p_so_id
             AND COALESCE(ol.quantity_invoiced,0) < ol.quantity
         )
   WHERE id = v_invoice_id;

  SELECT COUNT(*) INTO v_remaining_unfinished FROM public.order_lines
    WHERE order_id = p_so_id AND COALESCE(quantity_invoiced,0) < quantity;

  v_state := CASE WHEN v_remaining_unfinished = 0 THEN 'invoiced' ELSE 'invoicing' END;
  UPDATE public.sales_orders
     SET status = v_state,
         invoice_status = CASE WHEN v_remaining_unfinished = 0 THEN 'invoiced' ELSE 'partial' END,
         invoice_id = CASE WHEN v_remaining_unfinished = 0 THEN v_invoice_id ELSE invoice_id END,
         updated_at = now()
   WHERE id = p_so_id;

  RETURN v_invoice_id;
END $$;
