
-- 1. Fix is_admin() to include super_admin and check user_roles table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    coalesce((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','super_admin'), false)
    OR public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]);
$$;

-- 2. Helper for broadened inventory write access
CREATE OR REPLACE FUNCTION public.can_write_inventory()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin()
      OR public.has_role(auth.uid(), 'warehouse_operator'::app_role)
      OR public.has_role(auth.uid(), 'sales_manager'::app_role);
$$;

-- 3. Broaden INSERT/UPDATE on inventory tables to include warehouse_operator + sales_manager
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'products','warehouses','warehouse_locations',
    'stock_moves','stock_move_lines','transfers','transfer_lines',
    'reorder_rules','inventory_adjustments','adjustment_lines',
    'lots','serial_numbers'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_insert_admin', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_update_admin', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.can_write_inventory())',
      t || '_insert_admin', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.can_write_inventory()) WITH CHECK (public.can_write_inventory())',
      t || '_update_admin', t
    );
  END LOOP;
END $$;
