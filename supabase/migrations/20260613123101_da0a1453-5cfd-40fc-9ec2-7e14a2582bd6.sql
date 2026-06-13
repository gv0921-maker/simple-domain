
-- =============== factory_inventory_items ===============
CREATE TABLE IF NOT EXISTS public.factory_inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  unit_of_measurement text NOT NULL,
  description text,
  image_url text,
  current_stock numeric NOT NULL DEFAULT 0,
  min_stock_level numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.factory_inventory_items TO authenticated;
GRANT ALL ON public.factory_inventory_items TO service_role;
ALTER TABLE public.factory_inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fii_select" ON public.factory_inventory_items
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR public.has_role(auth.uid(), 'factory_incharge'::app_role)
  );
CREATE POLICY "fii_insert_admin" ON public.factory_inventory_items
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "fii_update_admin" ON public.factory_inventory_items
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "fii_delete_admin" ON public.factory_inventory_items
  FOR DELETE TO authenticated USING (public.is_admin());

CREATE TRIGGER trg_fii_updated_at BEFORE UPDATE ON public.factory_inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============== factory_stock_movements ===============
CREATE TABLE IF NOT EXISTS public.factory_stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_inventory_item_id uuid NOT NULL REFERENCES public.factory_inventory_items(id) ON DELETE CASCADE,
  movement_type text NOT NULL CHECK (movement_type IN ('inbound','consumed','adjustment','damaged')),
  quantity numeric NOT NULL,
  related_work_order_id uuid REFERENCES public.work_orders(id) ON DELETE SET NULL,
  notes text,
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fsm_item ON public.factory_stock_movements(factory_inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_fsm_wo ON public.factory_stock_movements(related_work_order_id);
GRANT SELECT, INSERT ON public.factory_stock_movements TO authenticated;
GRANT ALL ON public.factory_stock_movements TO service_role;
ALTER TABLE public.factory_stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fsm_select" ON public.factory_stock_movements
  FOR SELECT TO authenticated
  USING (public.is_admin() OR public.has_role(auth.uid(), 'factory_incharge'::app_role));
CREATE POLICY "fsm_insert" ON public.factory_stock_movements
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR public.has_role(auth.uid(), 'factory_incharge'::app_role));

-- =============== work_order_bom_entries ===============
CREATE TABLE IF NOT EXISTS public.work_order_bom_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  factory_inventory_item_id uuid NOT NULL REFERENCES public.factory_inventory_items(id),
  quantity_required numeric NOT NULL,
  quantity_consumed numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wobom_wo ON public.work_order_bom_entries(work_order_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_order_bom_entries TO authenticated;
GRANT ALL ON public.work_order_bom_entries TO service_role;
ALTER TABLE public.work_order_bom_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wobom_select" ON public.work_order_bom_entries
  FOR SELECT TO authenticated
  USING (public.is_admin() OR public.has_role(auth.uid(), 'factory_incharge'::app_role));
CREATE POLICY "wobom_insert" ON public.work_order_bom_entries
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR public.has_role(auth.uid(), 'factory_incharge'::app_role));
CREATE POLICY "wobom_update" ON public.work_order_bom_entries
  FOR UPDATE TO authenticated
  USING (public.is_admin() OR public.has_role(auth.uid(), 'factory_incharge'::app_role))
  WITH CHECK (public.is_admin() OR public.has_role(auth.uid(), 'factory_incharge'::app_role));
CREATE POLICY "wobom_delete_admin" ON public.work_order_bom_entries
  FOR DELETE TO authenticated USING (public.is_admin());

CREATE TRIGGER trg_wobom_updated_at BEFORE UPDATE ON public.work_order_bom_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============== work_orders.progress_photos ===============
ALTER TABLE public.work_orders
  ADD COLUMN IF NOT EXISTS progress_photos jsonb NOT NULL DEFAULT '[]'::jsonb;

-- =============== Helpers ===============
CREATE OR REPLACE FUNCTION public.is_assigned_or_admin(p_wo_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin() OR EXISTS (
    SELECT 1 FROM public.work_orders w
    WHERE w.id = p_wo_id AND w.assigned_factory_incharge_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.start_work(p_wo_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_stage text;
BEGIN
  IF NOT public.is_assigned_or_admin(p_wo_id) THEN
    RAISE EXCEPTION 'Not authorized for work order %', p_wo_id;
  END IF;
  SELECT current_stage INTO v_stage FROM public.work_orders WHERE id = p_wo_id FOR UPDATE;
  IF v_stage IS NULL THEN RAISE EXCEPTION 'Work order not found'; END IF;
  IF v_stage <> 'placed' THEN
    RAISE EXCEPTION 'Work order is in stage %, must be placed', v_stage;
  END IF;
  UPDATE public.work_orders SET current_stage = 'work_start', updated_at = now() WHERE id = p_wo_id;
END $$;

CREATE OR REPLACE FUNCTION public.enter_bom(p_wo_id uuid, p_entries jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_stage text; v_entry jsonb;
BEGIN
  IF NOT public.is_assigned_or_admin(p_wo_id) THEN
    RAISE EXCEPTION 'Not authorized for work order %', p_wo_id;
  END IF;
  SELECT current_stage INTO v_stage FROM public.work_orders WHERE id = p_wo_id FOR UPDATE;
  IF v_stage <> 'work_start' THEN
    RAISE EXCEPTION 'BOM can only be entered during work_start, current stage: %', v_stage;
  END IF;
  IF jsonb_typeof(p_entries) <> 'array' THEN
    RAISE EXCEPTION 'p_entries must be a JSON array';
  END IF;
  FOR v_entry IN SELECT * FROM jsonb_array_elements(p_entries) LOOP
    INSERT INTO public.work_order_bom_entries (
      work_order_id, factory_inventory_item_id, quantity_required, notes
    ) VALUES (
      p_wo_id,
      (v_entry->>'factory_inventory_item_id')::uuid,
      (v_entry->>'quantity_required')::numeric,
      v_entry->>'notes'
    );
  END LOOP;
  UPDATE public.work_orders SET bom_entered_at = now(), updated_at = now() WHERE id = p_wo_id;
END $$;

CREATE OR REPLACE FUNCTION public.start_polishing(p_wo_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_stage text;
  v_bom_count int;
  v_uid uuid := auth.uid();
  v_entry record;
  v_insufficient text := '';
BEGIN
  IF NOT public.is_assigned_or_admin(p_wo_id) THEN
    RAISE EXCEPTION 'Not authorized for work order %', p_wo_id;
  END IF;
  SELECT current_stage INTO v_stage FROM public.work_orders WHERE id = p_wo_id FOR UPDATE;
  IF v_stage <> 'work_start' THEN
    RAISE EXCEPTION 'Can only start polishing from work_start, current: %', v_stage;
  END IF;
  SELECT COUNT(*) INTO v_bom_count FROM public.work_order_bom_entries WHERE work_order_id = p_wo_id;
  IF v_bom_count = 0 THEN RAISE EXCEPTION 'BOM has not been entered yet'; END IF;

  -- Validate stock
  FOR v_entry IN
    SELECT b.id, b.factory_inventory_item_id, b.quantity_required, i.name, i.current_stock
      FROM public.work_order_bom_entries b
      JOIN public.factory_inventory_items i ON i.id = b.factory_inventory_item_id
     WHERE b.work_order_id = p_wo_id
  LOOP
    IF v_entry.current_stock < v_entry.quantity_required THEN
      v_insufficient := v_insufficient || v_entry.name || ' (need '
        || v_entry.quantity_required || ', have ' || v_entry.current_stock || '); ';
    END IF;
  END LOOP;
  IF v_insufficient <> '' THEN
    RAISE EXCEPTION 'Insufficient stock: %', v_insufficient;
  END IF;

  -- Consume
  FOR v_entry IN
    SELECT b.id, b.factory_inventory_item_id, b.quantity_required
      FROM public.work_order_bom_entries b
     WHERE b.work_order_id = p_wo_id
  LOOP
    INSERT INTO public.factory_stock_movements (
      factory_inventory_item_id, movement_type, quantity, related_work_order_id, recorded_by, notes
    ) VALUES (
      v_entry.factory_inventory_item_id, 'consumed', -v_entry.quantity_required,
      p_wo_id, v_uid, 'Consumed via start_polishing'
    );
    UPDATE public.factory_inventory_items
       SET current_stock = current_stock - v_entry.quantity_required, updated_at = now()
     WHERE id = v_entry.factory_inventory_item_id;
    UPDATE public.work_order_bom_entries
       SET quantity_consumed = v_entry.quantity_required, updated_at = now()
     WHERE id = v_entry.id;
  END LOOP;

  UPDATE public.work_orders
     SET current_stage = 'polishing', materials_consumed_at = now(), updated_at = now()
   WHERE id = p_wo_id;
END $$;

CREATE OR REPLACE FUNCTION public.complete_factory_work(p_wo_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_stage text;
BEGIN
  IF NOT public.is_assigned_or_admin(p_wo_id) THEN
    RAISE EXCEPTION 'Not authorized for work order %', p_wo_id;
  END IF;
  SELECT current_stage INTO v_stage FROM public.work_orders WHERE id = p_wo_id FOR UPDATE;
  IF v_stage <> 'polishing' THEN
    RAISE EXCEPTION 'Can only complete from polishing, current: %', v_stage;
  END IF;
  UPDATE public.work_orders
     SET current_stage = 'completed', factory_completion_at = now(), updated_at = now()
   WHERE id = p_wo_id;

  -- Notify admins (best effort using wo_notifications)
  INSERT INTO public.wo_notifications (work_order_id, user_id, notification_type, message)
  SELECT p_wo_id, ur.user_id, 'factory_completed',
         'Factory work completed for WO. Ready for transport to store.'
    FROM public.user_roles ur
   WHERE ur.role IN ('admin','super_admin');
END $$;
