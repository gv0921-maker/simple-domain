CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
  )
$$;

DO $$
DECLARE
  target_table text;
  target_tables text[] := ARRAY[
    'products',
    'warehouses',
    'warehouse_locations',
    'stock_moves',
    'stock_move_lines',
    'transfers',
    'transfer_lines',
    'reorder_rules',
    'inventory_adjustments',
    'adjustment_lines',
    'lots',
    'serial_numbers',
    'customers',
    'quotations',
    'quotation_lines',
    'sales_orders',
    'order_lines',
    'invoices',
    'invoice_lines',
    'payments',
    'bom',
    'bom_lines',
    'work_orders',
    'work_order_components',
    'work_centers'
  ];
  policy_record record;
BEGIN
  FOREACH target_table IN ARRAY target_tables LOOP
    FOR policy_record IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = target_table
        AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_record.policyname, target_table);
    END LOOP;

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_admin())',
      target_table || '_insert_admin',
      target_table
    );

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())',
      target_table || '_update_admin',
      target_table
    );

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.is_admin())',
      target_table || '_delete_admin',
      target_table
    );
  END LOOP;
END $$;

CREATE POLICY customers_insert_authenticated_fallback
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY quotations_insert_authenticated_fallback
ON public.quotations
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY quotation_lines_insert_authenticated_fallback
ON public.quotation_lines
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY sales_orders_insert_authenticated_fallback
ON public.sales_orders
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY order_lines_insert_authenticated_fallback
ON public.order_lines
FOR INSERT
TO authenticated
WITH CHECK (true);