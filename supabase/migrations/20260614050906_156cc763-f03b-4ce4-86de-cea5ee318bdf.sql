CREATE OR REPLACE FUNCTION public.is_admin_or_super()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin','super_admin'))
$$;

CREATE OR REPLACE FUNCTION public.is_sales_rep_for_record(p_salesperson_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p_salesperson_id IS NOT NULL AND p_salesperson_id <> ''
     AND (p_salesperson_id = public.get_current_employee_id()::text
          OR p_salesperson_id = auth.uid()::text)
$$;

CREATE OR REPLACE FUNCTION public._can_see_all_sales()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_any_role(auth.uid(),
    ARRAY['admin','super_admin','sales_manager','accountant']::app_role[])
$$;

ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS crm_leads_no_access ON public.crm_leads;
CREATE POLICY crm_leads_no_access ON public.crm_leads
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (false);

ALTER TABLE public.crm_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS crm_tags_select ON public.crm_tags;
DROP POLICY IF EXISTS crm_tags_write ON public.crm_tags;
CREATE POLICY crm_tags_select ON public.crm_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY crm_tags_write ON public.crm_tags FOR ALL TO authenticated
  USING (public.is_admin_or_super()) WITH CHECK (public.is_admin_or_super());

DROP POLICY IF EXISTS customers_select ON public.customers;
CREATE POLICY customers_select ON public.customers FOR SELECT TO authenticated
  USING (public._can_see_all_sales()
    OR public.is_sales_rep_for_record(salesperson_id)
    OR created_by = auth.uid());

DROP POLICY IF EXISTS quotations_select ON public.quotations;
CREATE POLICY quotations_select ON public.quotations FOR SELECT TO authenticated
  USING (public._can_see_all_sales()
    OR public.is_sales_rep_for_record(salesperson_id)
    OR created_by = auth.uid());

DROP POLICY IF EXISTS quotation_lines_select ON public.quotation_lines;
CREATE POLICY quotation_lines_select ON public.quotation_lines FOR SELECT TO authenticated
  USING (public._can_see_all_sales()
    OR EXISTS (SELECT 1 FROM public.quotations q
      WHERE q.id = quotation_lines.quotation_id
        AND (public.is_sales_rep_for_record(q.salesperson_id) OR q.created_by = auth.uid())));

DROP POLICY IF EXISTS sales_orders_select ON public.sales_orders;
CREATE POLICY sales_orders_select ON public.sales_orders FOR SELECT TO authenticated
  USING (public._can_see_all_sales()
    OR public.has_any_role(auth.uid(), ARRAY['warehouse_operator','factory_incharge']::app_role[])
    OR public.is_sales_rep_for_record(salesperson_id)
    OR created_by = auth.uid());

DROP POLICY IF EXISTS order_lines_select ON public.order_lines;
CREATE POLICY order_lines_select ON public.order_lines FOR SELECT TO authenticated
  USING (public._can_see_all_sales()
    OR public.has_any_role(auth.uid(), ARRAY['warehouse_operator','factory_incharge']::app_role[])
    OR EXISTS (SELECT 1 FROM public.sales_orders so
      WHERE so.id = order_lines.order_id
        AND (public.is_sales_rep_for_record(so.salesperson_id) OR so.created_by = auth.uid())));

DROP POLICY IF EXISTS "Authenticated can view delivery notes" ON public.delivery_notes;
DROP POLICY IF EXISTS delivery_notes_select ON public.delivery_notes;
CREATE POLICY delivery_notes_select ON public.delivery_notes FOR SELECT TO authenticated
  USING (public._can_see_all_sales()
    OR public.has_role(auth.uid(),'warehouse_operator')
    OR EXISTS (SELECT 1 FROM public.sales_orders so
      WHERE so.id = delivery_notes.sales_order_id
        AND (public.is_sales_rep_for_record(so.salesperson_id) OR so.created_by = auth.uid())));

DROP POLICY IF EXISTS invoices_select_auth ON public.invoices;
CREATE POLICY invoices_select_auth ON public.invoices FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','accountant','sales_manager']::app_role[])
    OR EXISTS (SELECT 1 FROM public.sales_orders so
      WHERE so.id = invoices.sales_order_id
        AND public.is_sales_rep_for_record(so.salesperson_id)));

DROP POLICY IF EXISTS payments_select_auth ON public.payments;
CREATE POLICY payments_select_auth ON public.payments FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','accountant','sales_manager']::app_role[])
    OR EXISTS (SELECT 1 FROM public.invoices i
      JOIN public.sales_orders so ON so.id = i.sales_order_id
      WHERE i.id = payments.invoice_id
        AND public.is_sales_rep_for_record(so.salesperson_id)));

DO $$ DECLARE t text; pol record; BEGIN
  FOR t IN SELECT unnest(ARRAY['crm_contacts','crm_companies','crm_opportunities']) LOOP
    FOR pol IN SELECT policyname FROM pg_policies
      WHERE schemaname='public' AND tablename=t AND cmd='SELECT' AND qual='true' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;
    EXECUTE format('DROP POLICY IF EXISTS %I_select_scoped ON public.%I', t, t);
    EXECUTE format($f$CREATE POLICY %I_select_scoped ON public.%I FOR SELECT TO authenticated
      USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','sales_manager']::app_role[])
        OR assigned_to = auth.uid()::text
        OR assigned_to = public.get_current_employee_id()::text)$f$, t, t);
  END LOOP;
END $$;

DO $$ DECLARE t text; pol record; BEGIN
  FOR t IN SELECT unnest(ARRAY['crm_activities','crm_notes']) LOOP
    FOR pol IN SELECT policyname FROM pg_policies
      WHERE schemaname='public' AND tablename=t AND cmd='SELECT' AND qual='true' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;
    EXECUTE format('DROP POLICY IF EXISTS %I_select_scoped ON public.%I', t, t);
    EXECUTE format($f$CREATE POLICY %I_select_scoped ON public.%I FOR SELECT TO authenticated
      USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','sales_manager']::app_role[])
        OR user_id::text = auth.uid()::text)$f$, t, t);
  END LOOP;
END $$;

DO $$ DECLARE t text; pol record; BEGIN
  FOR t IN SELECT unnest(ARRAY[
      'sales_orders','quotations','customers','products','vendors',
      'invoices','delivery_notes','vendor_orders','work_orders','return_requests',
      'employees','contracts','payslips','payroll_periods',
      'activity_log','sales_order_payments'
    ]) LOOP
    FOR pol IN SELECT policyname FROM pg_policies
      WHERE schemaname='public' AND tablename=t AND cmd='DELETE' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;
    EXECUTE format($f$CREATE POLICY %I_no_delete ON public.%I FOR DELETE TO authenticated USING (false)$f$, t, t);
  END LOOP;
END $$;
