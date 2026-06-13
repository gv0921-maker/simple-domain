
-- =========================================================
-- Phase 4 Batch 1: Work Orders extension
-- =========================================================

ALTER TABLE public.work_orders
  ADD COLUMN IF NOT EXISTS wo_number text,
  ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS size_spec text,
  ADD COLUMN IF NOT EXISTS colour_polish_spec text,
  ADD COLUMN IF NOT EXISTS fabric_spec text,
  ADD COLUMN IF NOT EXISTS customization_notes text,
  ADD COLUMN IF NOT EXISTS reference_images jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS linked_sales_order_id uuid REFERENCES public.sales_orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_sales_order_line_id uuid REFERENCES public.order_lines(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_factory_incharge_id uuid,
  ADD COLUMN IF NOT EXISTS eta_date date,
  ADD COLUMN IF NOT EXISTS approval_required boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS placed_at timestamptz,
  ADD COLUMN IF NOT EXISTS current_stage text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS bom_entered_at timestamptz,
  ADD COLUMN IF NOT EXISTS materials_consumed_at timestamptz,
  ADD COLUMN IF NOT EXISTS factory_completion_at timestamptz,
  ADD COLUMN IF NOT EXISTS received_at_store_at timestamptz,
  ADD COLUMN IF NOT EXISTS linked_goods_receipt_id uuid,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- relax legacy reference NOT NULL constraint (we now use wo_number)
ALTER TABLE public.work_orders ALTER COLUMN reference DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'work_orders_current_stage_chk'
  ) THEN
    ALTER TABLE public.work_orders
      ADD CONSTRAINT work_orders_current_stage_chk
      CHECK (current_stage IN ('draft','pending_approval','approved','placed','work_start','polishing','completed','received_at_store','cancelled','rejected'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_work_orders_stage_eta ON public.work_orders (current_stage, eta_date);
CREATE INDEX IF NOT EXISTS idx_work_orders_factory_stage ON public.work_orders (assigned_factory_incharge_id, current_stage);
CREATE INDEX IF NOT EXISTS idx_work_orders_linked_so ON public.work_orders (linked_sales_order_id);

-- Auto-number trigger
CREATE OR REPLACE FUNCTION public.wo_set_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.wo_number IS NULL OR NEW.wo_number = '' THEN
    NEW.wo_number := public.generate_document_number('work_order');
  END IF;
  IF NEW.reference IS NULL OR NEW.reference = '' THEN
    NEW.reference := NEW.wo_number;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_wo_set_number ON public.work_orders;
CREATE TRIGGER trg_wo_set_number BEFORE INSERT ON public.work_orders
  FOR EACH ROW EXECUTE FUNCTION public.wo_set_number();

-- =========================================================
-- Notifications table for WO assignments
-- =========================================================
CREATE TABLE IF NOT EXISTS public.wo_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  work_order_id uuid NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  type text NOT NULL,
  message text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wo_notifications TO authenticated;
GRANT ALL ON public.wo_notifications TO service_role;

ALTER TABLE public.wo_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users see own wo notifications" ON public.wo_notifications;
CREATE POLICY "users see own wo notifications" ON public.wo_notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "users update own wo notifications" ON public.wo_notifications;
CREATE POLICY "users update own wo notifications" ON public.wo_notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admins manage wo notifications" ON public.wo_notifications;
CREATE POLICY "admins manage wo notifications" ON public.wo_notifications
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_wo_notifications_user ON public.wo_notifications (user_id, is_read, created_at DESC);

-- =========================================================
-- Helper RPCs
-- =========================================================

CREATE OR REPLACE FUNCTION public.approve_work_order(p_wo_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stage text;
BEGIN
  IF NOT public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]) THEN
    RAISE EXCEPTION 'Only admins can approve work orders';
  END IF;
  SELECT current_stage INTO v_stage FROM public.work_orders WHERE id = p_wo_id FOR UPDATE;
  IF v_stage IS NULL THEN RAISE EXCEPTION 'Work order not found'; END IF;
  IF v_stage <> 'pending_approval' THEN
    RAISE EXCEPTION 'Work order is in stage % and cannot be approved', v_stage;
  END IF;
  UPDATE public.work_orders
     SET current_stage = 'approved',
         approved_by = auth.uid(),
         approved_at = now(),
         updated_at = now()
   WHERE id = p_wo_id;
  RETURN jsonb_build_object('success', true);
END $$;

CREATE OR REPLACE FUNCTION public.reject_work_order(p_wo_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stage text;
BEGIN
  IF NOT public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]) THEN
    RAISE EXCEPTION 'Only admins can reject work orders';
  END IF;
  SELECT current_stage INTO v_stage FROM public.work_orders WHERE id = p_wo_id FOR UPDATE;
  IF v_stage <> 'pending_approval' THEN
    RAISE EXCEPTION 'Work order is in stage % and cannot be rejected', v_stage;
  END IF;
  UPDATE public.work_orders
     SET current_stage = 'rejected',
         rejection_reason = p_reason,
         updated_at = now()
   WHERE id = p_wo_id;
  RETURN jsonb_build_object('success', true);
END $$;

CREATE OR REPLACE FUNCTION public.place_work_order(p_wo_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stage text;
  v_assignee uuid;
  v_num text;
BEGIN
  IF NOT public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]) THEN
    RAISE EXCEPTION 'Only admins can place work orders';
  END IF;
  SELECT current_stage, assigned_factory_incharge_id, wo_number
    INTO v_stage, v_assignee, v_num
    FROM public.work_orders WHERE id = p_wo_id FOR UPDATE;
  IF v_stage <> 'approved' THEN
    RAISE EXCEPTION 'Work order is in stage % and cannot be placed', v_stage;
  END IF;
  UPDATE public.work_orders
     SET current_stage = 'placed', placed_at = now(), updated_at = now()
   WHERE id = p_wo_id;
  IF v_assignee IS NOT NULL THEN
    INSERT INTO public.wo_notifications (user_id, work_order_id, type, message)
    VALUES (v_assignee, p_wo_id, 'wo_placed',
      'Work Order ' || COALESCE(v_num,'') || ' has been placed at the factory');
  END IF;
  RETURN jsonb_build_object('success', true);
END $$;

CREATE OR REPLACE FUNCTION public.cancel_work_order(p_wo_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stage text;
  v_is_super boolean;
BEGIN
  v_is_super := public.has_role(auth.uid(), 'super_admin'::app_role);
  SELECT current_stage INTO v_stage FROM public.work_orders WHERE id = p_wo_id FOR UPDATE;
  IF v_stage IS NULL THEN RAISE EXCEPTION 'Work order not found'; END IF;
  IF v_stage = 'cancelled' THEN RETURN jsonb_build_object('success', true); END IF;
  IF v_stage IN ('draft','pending_approval','approved','placed') THEN
    IF NOT public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]) THEN
      RAISE EXCEPTION 'Only admins can cancel work orders';
    END IF;
  ELSE
    IF NOT v_is_super THEN
      RAISE EXCEPTION 'Only super admins can cancel work orders after factory has started';
    END IF;
  END IF;
  UPDATE public.work_orders
     SET current_stage = 'cancelled',
         cancellation_reason = p_reason,
         updated_at = now()
   WHERE id = p_wo_id;
  RETURN jsonb_build_object('success', true);
END $$;

GRANT EXECUTE ON FUNCTION public.approve_work_order(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_work_order(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.place_work_order(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_work_order(uuid, text) TO authenticated;
