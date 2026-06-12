-- Numbering settings (single-row)
CREATE TABLE public.numbering_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fy_start_month integer NOT NULL DEFAULT 4,
  fy_start_day integer NOT NULL DEFAULT 1,
  prefix_separator text NOT NULL DEFAULT '-',
  sequential_padding integer NOT NULL DEFAULT 4,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

GRANT SELECT ON public.numbering_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.numbering_settings TO authenticated;
GRANT ALL ON public.numbering_settings TO service_role;

ALTER TABLE public.numbering_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read numbering settings"
  ON public.numbering_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only super admins can modify numbering settings"
  ON public.numbering_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Sequences table
CREATE TABLE public.numbering_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type text NOT NULL,
  fy_label text NOT NULL,
  last_number integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_type, fy_label)
);

GRANT SELECT ON public.numbering_sequences TO authenticated;
GRANT ALL ON public.numbering_sequences TO service_role;

ALTER TABLE public.numbering_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read numbering sequences"
  ON public.numbering_sequences FOR SELECT TO authenticated USING (true);

-- Seed default settings row
INSERT INTO public.numbering_settings (fy_start_month, fy_start_day) VALUES (4, 1);

-- Current FY label function (e.g. '2526' for FY 2025-26)
CREATE OR REPLACE FUNCTION public.get_current_fy_label()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month integer;
  v_day integer;
  v_today date := (now() AT TIME ZONE 'Asia/Kolkata')::date;
  v_start_year integer;
  v_end_year integer;
BEGIN
  SELECT fy_start_month, fy_start_day INTO v_month, v_day FROM public.numbering_settings LIMIT 1;
  IF v_month IS NULL THEN v_month := 4; v_day := 1; END IF;

  IF (EXTRACT(MONTH FROM v_today)::int > v_month)
     OR (EXTRACT(MONTH FROM v_today)::int = v_month AND EXTRACT(DAY FROM v_today)::int >= v_day) THEN
    v_start_year := EXTRACT(YEAR FROM v_today)::int;
  ELSE
    v_start_year := EXTRACT(YEAR FROM v_today)::int - 1;
  END IF;
  v_end_year := v_start_year + 1;

  RETURN lpad((v_start_year % 100)::text, 2, '0') || lpad((v_end_year % 100)::text, 2, '0');
END;
$$;

-- Generate next document number
CREATE OR REPLACE FUNCTION public.generate_document_number(p_document_type text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Preview next number (non-incrementing)
CREATE OR REPLACE FUNCTION public.preview_next_document_number(p_document_type text)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE TRIGGER trg_numbering_settings_updated_at
  BEFORE UPDATE ON public.numbering_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();