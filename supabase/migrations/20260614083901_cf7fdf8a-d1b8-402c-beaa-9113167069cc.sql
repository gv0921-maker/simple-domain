
ALTER TABLE public.crm_contacts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_companies       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_opportunities   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_pipelines       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_notes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_tags            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_audit_logs      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view notes" ON public.crm_notes;
DROP POLICY IF EXISTS "crm_notes_select" ON public.crm_notes;
DROP POLICY IF EXISTS "crm_notes_select_visibility" ON public.crm_notes;
CREATE POLICY "crm_notes_select_visibility"
ON public.crm_notes FOR SELECT TO authenticated
USING (
  COALESCE(visibility, 'team') IN ('public','team')
  OR (visibility = 'private' AND user_id = auth.uid()::text)
  OR public.is_admin_or_super()
);

REVOKE SELECT (portal_token) ON public.customers FROM authenticated;

DROP POLICY IF EXISTS "aal_auth_insert" ON public.app_audit_logs;
DROP POLICY IF EXISTS "aal_auth_insert_self" ON public.app_audit_logs;
CREATE POLICY "aal_auth_insert_self"
ON public.app_audit_logs FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "audit_insert_authenticated" ON public.crm_audit_logs;
DROP POLICY IF EXISTS "crm_audit_insert_self" ON public.crm_audit_logs;
CREATE POLICY "crm_audit_insert_self"
ON public.crm_audit_logs FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid()::text);

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT format('DROP FUNCTION public.insert_audit_log(%s);',
                  pg_get_function_identity_arguments(p.oid)) AS stmt
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'insert_audit_log'
  LOOP EXECUTE r.stmt; END LOOP;
END $$;
CREATE FUNCTION public.insert_audit_log(
  _user_name text, _action text, _resource text, _resource_id text, _details text DEFAULT NULL
) RETURNS uuid LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.crm_audit_logs(user_id, user_name, action, resource, resource_id, details)
  VALUES (auth.uid()::text, _user_name, _action, _resource, _resource_id, _details)
  RETURNING id;
$$;
REVOKE EXECUTE ON FUNCTION public.insert_audit_log(text, text, text, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.insert_audit_log(text, text, text, text, text) TO authenticated;

DROP POLICY IF EXISTS "lal insert auth" ON public.leave_approval_log;
DROP POLICY IF EXISTS "lal_insert_auth" ON public.leave_approval_log;
DROP POLICY IF EXISTS "lal_insert_scoped" ON public.leave_approval_log;
CREATE POLICY "lal_insert_scoped"
ON public.leave_approval_log FOR INSERT TO authenticated
WITH CHECK (
  actor_id = auth.uid()
  AND (
    public.has_any_role(auth.uid(), ARRAY['admin','super_admin','hr_manager']::public.app_role[])
    OR public.is_manager_of((
      SELECT employee_id FROM public.leave_requests WHERE id = leave_request_id LIMIT 1
    ))
  )
);

DROP POLICY IF EXISTS "lr update reports" ON public.leave_requests;
CREATE POLICY "lr update reports"
ON public.leave_requests FOR UPDATE TO authenticated
USING (public.is_manager_of(employee_id))
WITH CHECK (public.is_manager_of(employee_id));

DROP POLICY IF EXISTS "Authenticated can insert suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated can update suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_insert_admin" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_update_admin" ON public.suppliers;
CREATE POLICY "suppliers_insert_admin"
ON public.suppliers FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "suppliers_update_admin"
ON public.suppliers FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "imi_select" ON public.internal_movement_items;
DROP POLICY IF EXISTS "imi_select_via_parent" ON public.internal_movement_items;
CREATE POLICY "imi_select_via_parent"
ON public.internal_movement_items FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.internal_movements m
    WHERE m.id = internal_movement_items.internal_movement_id
      AND (public.is_admin() OR public.can_write_inventory())
  )
);

DROP POLICY IF EXISTS "wfi_modify_draft" ON public.write_off_items;
DROP POLICY IF EXISTS "wfi_modify_draft_role" ON public.write_off_items;
CREATE POLICY "wfi_modify_draft_role"
ON public.write_off_items FOR ALL TO authenticated
USING (
  (public.can_write_inventory() OR public.is_admin())
  AND EXISTS (SELECT 1 FROM public.write_off_records r
              WHERE r.id = write_off_items.write_off_record_id AND r.status = 'draft')
)
WITH CHECK (
  (public.can_write_inventory() OR public.is_admin())
  AND EXISTS (SELECT 1 FROM public.write_off_records r
              WHERE r.id = write_off_items.write_off_record_id AND r.status = 'draft')
);

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT polname FROM pg_policy WHERE polrelid = 'public.sales_fiscal_positions'::regclass
  LOOP EXECUTE format('DROP POLICY %I ON public.sales_fiscal_positions', pol.polname); END LOOP;
END $$;
ALTER TABLE public.sales_fiscal_positions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sales_fiscal_positions FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_fiscal_positions TO authenticated;
CREATE POLICY "sfp_select_auth" ON public.sales_fiscal_positions FOR SELECT TO authenticated USING (true);
CREATE POLICY "sfp_write_admin" ON public.sales_fiscal_positions FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT polname FROM pg_policy WHERE polrelid = 'public.sales_loyalty_transactions'::regclass
  LOOP EXECUTE format('DROP POLICY %I ON public.sales_loyalty_transactions', pol.polname); END LOOP;
END $$;
ALTER TABLE public.sales_loyalty_transactions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sales_loyalty_transactions FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_loyalty_transactions TO authenticated;
CREATE POLICY "slt_select_auth" ON public.sales_loyalty_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "slt_insert_sales" ON public.sales_loyalty_transactions FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR public.has_any_role(auth.uid(), ARRAY['admin','super_admin','sales_manager','sales_rep','accountant']::public.app_role[]));
CREATE POLICY "slt_update_admin" ON public.sales_loyalty_transactions FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "slt_delete_admin" ON public.sales_loyalty_transactions FOR DELETE TO authenticated
  USING (public.is_admin());

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT polname FROM pg_policy WHERE polrelid = 'public.sales_seasonal_promotions'::regclass
  LOOP EXECUTE format('DROP POLICY %I ON public.sales_seasonal_promotions', pol.polname); END LOOP;
END $$;
ALTER TABLE public.sales_seasonal_promotions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sales_seasonal_promotions FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_seasonal_promotions TO authenticated;
CREATE POLICY "ssp_select_auth" ON public.sales_seasonal_promotions FOR SELECT TO authenticated USING (true);
CREATE POLICY "ssp_write_admin" ON public.sales_seasonal_promotions FOR ALL TO authenticated
  USING (public.is_admin() OR public.has_any_role(auth.uid(), ARRAY['admin','super_admin','sales_manager']::public.app_role[]))
  WITH CHECK (public.is_admin() OR public.has_any_role(auth.uid(), ARRAY['admin','super_admin','sales_manager']::public.app_role[]));

DROP POLICY IF EXISTS "appraisals self update" ON public.appraisals;
CREATE POLICY "appraisals self update"
ON public.appraisals FOR UPDATE TO authenticated
USING (public.is_employee_self(employee_id) AND status IN ('not_started','self_review'))
WITH CHECK (public.is_employee_self(employee_id) AND status IN ('not_started','self_review'));

-- ===== SECURITY DEFINER RPC guards (drop first to allow return-type change) =====

DROP FUNCTION IF EXISTS public.complete_internal_movement(uuid);
CREATE FUNCTION public.complete_internal_movement(p_movement_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_movement public.internal_movements%ROWTYPE; v_item record;
BEGIN
  IF NOT (public.is_admin() OR public.can_write_inventory()) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_movement FROM public.internal_movements WHERE id = p_movement_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Movement not found'; END IF;
  IF v_movement.status = 'completed' THEN RETURN; END IF;

  FOR v_item IN SELECT * FROM public.internal_movement_items WHERE internal_movement_id = p_movement_id LOOP
    IF v_item.serial_id IS NOT NULL THEN
      UPDATE public.goods_receipt_serials
         SET stock_status = CASE v_movement.movement_type
              WHEN 'sale'          THEN 'sold'
              WHEN 'vendor_return' THEN 'returned_to_vendor'
              WHEN 'qc_correction' THEN 'under_correction'
              WHEN 'transfer'      THEN stock_status
              ELSE stock_status END,
             updated_at = now()
       WHERE id = v_item.serial_id;
    END IF;
  END LOOP;

  UPDATE public.internal_movements
     SET status = 'completed', completed_at = now(), updated_at = now()
   WHERE id = p_movement_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.complete_internal_movement(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.complete_internal_movement(uuid) TO authenticated;

DROP FUNCTION IF EXISTS public.create_ito_from_so(uuid, uuid);
DROP FUNCTION IF EXISTS public.create_ito_from_so(uuid);
CREATE FUNCTION public.create_ito_from_so(p_so_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_ito_id uuid; v_so record; v_line record; v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501'; END IF;
  IF NOT (public.is_admin() OR public.has_any_role(v_user, ARRAY['admin','super_admin','sales_manager','sales_rep','warehouse_operator']::public.app_role[])) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_so FROM public.sales_orders WHERE id = p_so_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sales order not found'; END IF;

  INSERT INTO public.internal_transfer_orders(sales_order_id, status, created_by, confirmed_by, confirmed_at)
  VALUES (p_so_id, 'pending', v_user, v_user, now())
  RETURNING id INTO v_ito_id;

  FOR v_line IN SELECT * FROM public.order_lines WHERE order_id = p_so_id LOOP
    INSERT INTO public.internal_transfer_order_lines(ito_id, product_id, product_name, quantity)
    VALUES (v_ito_id, v_line.product_id, v_line.product_name, v_line.quantity);
  END LOOP;

  UPDATE public.sales_orders
     SET status = 'fulfilling', updated_at = now()
   WHERE id = p_so_id AND status <> 'fulfilling';

  RETURN v_ito_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.create_ito_from_so(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.create_ito_from_so(uuid) TO authenticated;

DROP FUNCTION IF EXISTS public.initialize_stock_count(uuid);
CREATE FUNCTION public.initialize_stock_count(p_count_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count record;
BEGIN
  IF NOT (public.is_admin() OR public.can_write_inventory()) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_count FROM public.stock_counts WHERE id = p_count_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Stock count not found'; END IF;

  INSERT INTO public.stock_count_items(stock_count_id, serial_id, product_id, expected_status, actual_status)
  SELECT p_count_id, s.id, s.product_id, s.stock_status, NULL
    FROM public.goods_receipt_serials s
   WHERE s.stock_status IN ('available','reserved')
     AND NOT EXISTS (SELECT 1 FROM public.stock_count_items i
                      WHERE i.stock_count_id = p_count_id AND i.serial_id = s.id);

  UPDATE public.stock_counts SET status = 'in_progress', started_at = now(), updated_at = now()
   WHERE id = p_count_id AND status = 'draft';
END;
$$;
REVOKE EXECUTE ON FUNCTION public.initialize_stock_count(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.initialize_stock_count(uuid) TO authenticated;

DROP FUNCTION IF EXISTS public.complete_stock_count(uuid);
CREATE FUNCTION public.complete_stock_count(p_count_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.is_admin() OR public.can_write_inventory()) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;
  UPDATE public.stock_count_items
     SET actual_status = 'missing', updated_at = now()
   WHERE stock_count_id = p_count_id AND actual_status IS NULL;
  UPDATE public.stock_counts SET status = 'completed', completed_at = now(), updated_at = now()
   WHERE id = p_count_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.complete_stock_count(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.complete_stock_count(uuid) TO authenticated;

DROP FUNCTION IF EXISTS public.close_correction_order(uuid);
CREATE FUNCTION public.close_correction_order(p_co_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.is_admin() OR public.can_write_inventory()) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;
  UPDATE public.correction_orders
     SET status = 'closed', closed_at = now(), updated_at = now()
   WHERE id = p_co_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.close_correction_order(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.close_correction_order(uuid) TO authenticated;
