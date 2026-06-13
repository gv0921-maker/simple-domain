
-- 1. payment_accounts
CREATE TABLE public.payment_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name text NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('cash','bank')),
  bank_name text,
  account_number_last4 text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payment_accounts TO authenticated;
GRANT ALL ON public.payment_accounts TO service_role;
ALTER TABLE public.payment_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_accounts read" ON public.payment_accounts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "payment_accounts super admin write" ON public.payment_accounts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

GRANT INSERT, UPDATE, DELETE ON public.payment_accounts TO authenticated;

CREATE TRIGGER trg_payment_accounts_updated_at
  BEFORE UPDATE ON public.payment_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.payment_accounts (account_name, account_type, display_order) VALUES
  ('Cash Drawer', 'cash', 0),
  ('Bank Account 1', 'bank', 1),
  ('Bank Account 2', 'bank', 2);

-- 2. sales_order_payments
CREATE TABLE public.sales_order_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id uuid NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  payment_number text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  payment_mode text NOT NULL CHECK (payment_mode IN ('cash','bank_transfer','cheque','card','upi')),
  payment_account_id uuid NOT NULL REFERENCES public.payment_accounts(id),
  payment_date timestamptz NOT NULL DEFAULT now(),
  reference_number text,
  notes text,
  received_by uuid NOT NULL REFERENCES auth.users(id),
  is_voided boolean NOT NULL DEFAULT false,
  voided_by uuid REFERENCES auth.users(id),
  voided_at timestamptz,
  void_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sop_order_date ON public.sales_order_payments (sales_order_id, payment_date DESC);

GRANT SELECT, INSERT, UPDATE ON public.sales_order_payments TO authenticated;
GRANT ALL ON public.sales_order_payments TO service_role;
ALTER TABLE public.sales_order_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sop read sales_rep+" ON public.sales_order_payments
  FOR SELECT TO authenticated USING (
    public.has_any_role(auth.uid(), ARRAY['sales_rep','sales_manager','accountant','admin','super_admin']::app_role[])
  );

CREATE POLICY "sop insert sales_rep+" ON public.sales_order_payments
  FOR INSERT TO authenticated WITH CHECK (
    received_by = auth.uid()
    AND public.has_any_role(auth.uid(), ARRAY['sales_rep','sales_manager','accountant','admin','super_admin']::app_role[])
  );

-- Allow super_admin to UPDATE (only for voiding)
CREATE POLICY "sop super_admin void update" ON public.sales_order_payments
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

-- 3. Real-time enforcement trigger
CREATE OR REPLACE FUNCTION public.enforce_real_time_payment_date()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.payment_date := now();
  IF NEW.payment_number IS NULL OR NEW.payment_number = '' THEN
    NEW.payment_number := public.generate_document_number('payment_receipt');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_sop_realtime_date
  BEFORE INSERT ON public.sales_order_payments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_real_time_payment_date();

-- 4. Update calculate_so_advance_percent to use new table
CREATE OR REPLACE FUNCTION public.calculate_so_advance_percent(p_so_id uuid)
RETURNS numeric LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_total numeric;
  v_paid numeric;
BEGIN
  SELECT COALESCE(total, 0) INTO v_total FROM public.sales_orders WHERE id = p_so_id;
  IF v_total IS NULL OR v_total = 0 THEN RETURN 0; END IF;
  SELECT COALESCE(SUM(amount), 0) INTO v_paid
    FROM public.sales_order_payments
    WHERE sales_order_id = p_so_id AND is_voided = false;
  RETURN ROUND((v_paid / v_total) * 100, 2);
END $$;

-- 5. Summary function
CREATE OR REPLACE FUNCTION public.get_sales_order_payment_summary(p_so_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_total numeric;
  v_required numeric;
  v_override uuid;
  v_paid numeric;
  v_voided numeric;
  v_count integer;
  v_last timestamptz;
  v_pct numeric;
BEGIN
  SELECT COALESCE(total,0), COALESCE(advance_percent_required, 40), advance_override_by
    INTO v_total, v_required, v_override
    FROM public.sales_orders WHERE id = p_so_id;

  SELECT
    COALESCE(SUM(CASE WHEN is_voided = false THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN is_voided = true  THEN amount ELSE 0 END), 0),
    COUNT(*) FILTER (WHERE is_voided = false),
    MAX(payment_date) FILTER (WHERE is_voided = false)
  INTO v_paid, v_voided, v_count, v_last
  FROM public.sales_order_payments WHERE sales_order_id = p_so_id;

  v_pct := CASE WHEN v_total > 0 THEN ROUND((v_paid / v_total) * 100, 2) ELSE 0 END;

  RETURN jsonb_build_object(
    'total_amount', v_total,
    'total_paid', v_paid,
    'total_voided', v_voided,
    'balance_remaining', GREATEST(v_total - v_paid, 0),
    'advance_percent', v_pct,
    'advance_percent_required', v_required,
    'payment_count', v_count,
    'is_advance_met', (v_override IS NOT NULL) OR (v_pct >= v_required),
    'is_fully_paid', v_paid >= v_total AND v_total > 0,
    'last_payment_date', v_last
  );
END $$;
