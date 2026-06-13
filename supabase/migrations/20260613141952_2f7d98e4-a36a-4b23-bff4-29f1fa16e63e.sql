
-- ============================================================
-- Phase 7 Batch 2: Leave simplification + Sunday duty roster
-- ============================================================

-- PART A.1: Simplify leave types
-- Deactivate any legacy types (do NOT delete; historical leave_requests depend on them)
UPDATE public.leave_types SET is_active = false
WHERE code NOT IN ('paid', 'unpaid');

-- Ensure canonical Paid / Unpaid rows exist (idempotent upsert by code)
INSERT INTO public.leave_types (code, name, is_paid, is_active)
SELECT 'paid', 'Paid Leave', true, true
WHERE NOT EXISTS (SELECT 1 FROM public.leave_types WHERE code = 'paid');

INSERT INTO public.leave_types (code, name, is_paid, is_active)
SELECT 'unpaid', 'Unpaid Leave', false, true
WHERE NOT EXISTS (SELECT 1 FROM public.leave_types WHERE code = 'unpaid');

UPDATE public.leave_types SET is_active = true, is_paid = true,  name = 'Paid Leave'   WHERE code = 'paid';
UPDATE public.leave_types SET is_active = true, is_paid = false, name = 'Unpaid Leave' WHERE code = 'unpaid';

COMMENT ON TABLE public.leave_types IS 'Legacy leave types deactivated. Going forward only Paid and Unpaid leaves.';

-- PART A.2: Monthly allotments
CREATE TABLE IF NOT EXISTS public.employee_monthly_leave_allotments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  year integer NOT NULL,
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  paid_leaves_allotted integer NOT NULL DEFAULT 0,
  paid_leaves_used integer NOT NULL DEFAULT 0,
  unpaid_leaves_used integer NOT NULL DEFAULT 0,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, year, month)
);
CREATE INDEX IF NOT EXISTS idx_emla_employee_period
  ON public.employee_monthly_leave_allotments (employee_id, year DESC, month DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_monthly_leave_allotments TO authenticated;
GRANT ALL ON public.employee_monthly_leave_allotments TO service_role;

ALTER TABLE public.employee_monthly_leave_allotments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS emla_select ON public.employee_monthly_leave_allotments;
CREATE POLICY emla_select ON public.employee_monthly_leave_allotments FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.user_id = auth.uid())
);

DROP POLICY IF EXISTS emla_insert ON public.employee_monthly_leave_allotments;
CREATE POLICY emla_insert ON public.employee_monthly_leave_allotments FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS emla_update ON public.employee_monthly_leave_allotments;
CREATE POLICY emla_update ON public.employee_monthly_leave_allotments FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS emla_delete ON public.employee_monthly_leave_allotments;
CREATE POLICY emla_delete ON public.employee_monthly_leave_allotments FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at_emla()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trg_emla_updated_at ON public.employee_monthly_leave_allotments;
CREATE TRIGGER trg_emla_updated_at BEFORE UPDATE ON public.employee_monthly_leave_allotments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_emla();

-- PART A.3: Leave requests denorm + validation
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS leave_type_code text;

CREATE OR REPLACE FUNCTION public.validate_simplified_leave_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_code text;
  v_year int;
  v_month int;
  v_allotted int;
  v_used int;
  v_remaining int;
  v_days numeric;
BEGIN
  -- Resolve code from joined leave_types if not provided
  SELECT lt.code INTO v_code FROM public.leave_types lt WHERE lt.id = NEW.leave_type_id;
  IF v_code IS NULL THEN
    RETURN NEW; -- unknown type; let other checks handle
  END IF;
  NEW.leave_type_code := v_code;

  -- Only enforce for the simplified types
  IF v_code NOT IN ('paid', 'unpaid') THEN
    RETURN NEW;
  END IF;

  v_year  := EXTRACT(YEAR  FROM NEW.start_date)::int;
  v_month := EXTRACT(MONTH FROM NEW.start_date)::int;
  v_days  := COALESCE(NEW.total_days, 0);

  SELECT COALESCE(paid_leaves_allotted, 0), COALESCE(paid_leaves_used, 0)
    INTO v_allotted, v_used
  FROM public.employee_monthly_leave_allotments
  WHERE employee_id = NEW.employee_id AND year = v_year AND month = v_month;

  v_allotted := COALESCE(v_allotted, 0);
  v_used     := COALESCE(v_used, 0);
  v_remaining := v_allotted - v_used;

  IF v_code = 'unpaid' THEN
    IF v_remaining > 0 THEN
      RAISE EXCEPTION 'Unpaid leave can only be applied after paid leave is exhausted for this month.';
    END IF;
  ELSIF v_code = 'paid' THEN
    IF v_days > v_remaining THEN
      RAISE EXCEPTION 'Requested % paid day(s) exceeds remaining allotment (%) for %-%.', v_days, v_remaining, v_year, v_month;
    END IF;
  END IF;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_validate_simplified_leave ON public.leave_requests;
CREATE TRIGGER trg_validate_simplified_leave
BEFORE INSERT OR UPDATE OF leave_type_id, start_date, end_date, total_days, status
ON public.leave_requests
FOR EACH ROW EXECUTE FUNCTION public.validate_simplified_leave_request();

-- Trigger to keep allotment usage counters in sync when leave is approved/cancelled
CREATE OR REPLACE FUNCTION public.sync_monthly_allotment_usage()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_code text;
  v_year int;
  v_month int;
  v_days numeric;
  v_delta_paid numeric := 0;
  v_delta_unpaid numeric := 0;
BEGIN
  SELECT lt.code INTO v_code FROM public.leave_types lt
   WHERE lt.id = COALESCE(NEW.leave_type_id, OLD.leave_type_id);
  IF v_code NOT IN ('paid','unpaid') THEN RETURN NEW; END IF;

  v_year  := EXTRACT(YEAR  FROM COALESCE(NEW.start_date, OLD.start_date))::int;
  v_month := EXTRACT(MONTH FROM COALESCE(NEW.start_date, OLD.start_date))::int;
  v_days  := COALESCE(NEW.total_days, OLD.total_days, 0);

  -- Determine delta based on status transition
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'approved' THEN
      IF v_code = 'paid' THEN v_delta_paid := v_days; ELSE v_delta_unpaid := v_days; END IF;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status <> 'approved' AND NEW.status = 'approved' THEN
      IF v_code = 'paid' THEN v_delta_paid := v_days; ELSE v_delta_unpaid := v_days; END IF;
    ELSIF OLD.status = 'approved' AND NEW.status <> 'approved' THEN
      IF v_code = 'paid' THEN v_delta_paid := -v_days; ELSE v_delta_unpaid := -v_days; END IF;
    END IF;
  END IF;

  IF v_delta_paid = 0 AND v_delta_unpaid = 0 THEN RETURN NEW; END IF;

  INSERT INTO public.employee_monthly_leave_allotments
    (employee_id, year, month, paid_leaves_allotted, paid_leaves_used, unpaid_leaves_used)
  VALUES (COALESCE(NEW.employee_id, OLD.employee_id), v_year, v_month, 0,
          GREATEST(0, v_delta_paid)::int, GREATEST(0, v_delta_unpaid)::int)
  ON CONFLICT (employee_id, year, month) DO UPDATE
  SET paid_leaves_used   = GREATEST(0, public.employee_monthly_leave_allotments.paid_leaves_used   + v_delta_paid)::int,
      unpaid_leaves_used = GREATEST(0, public.employee_monthly_leave_allotments.unpaid_leaves_used + v_delta_unpaid)::int,
      updated_at = now();

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_sync_alloment_usage ON public.leave_requests;
CREATE TRIGGER trg_sync_alloment_usage
AFTER INSERT OR UPDATE OF status ON public.leave_requests
FOR EACH ROW EXECUTE FUNCTION public.sync_monthly_allotment_usage();

-- PART A.4: Helper RPC — current balance
CREATE OR REPLACE FUNCTION public.get_employee_leave_balance(
  p_employee_id uuid, p_year integer, p_month integer
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_allotted int := 0;
  v_paid_used int := 0;
  v_unpaid_used int := 0;
BEGIN
  SELECT COALESCE(paid_leaves_allotted,0), COALESCE(paid_leaves_used,0), COALESCE(unpaid_leaves_used,0)
    INTO v_allotted, v_paid_used, v_unpaid_used
  FROM public.employee_monthly_leave_allotments
  WHERE employee_id = p_employee_id AND year = p_year AND month = p_month;

  RETURN jsonb_build_object(
    'paid_allotted', COALESCE(v_allotted,0),
    'paid_used',     COALESCE(v_paid_used,0),
    'paid_remaining', GREATEST(0, COALESCE(v_allotted,0) - COALESCE(v_paid_used,0)),
    'unpaid_used',   COALESCE(v_unpaid_used,0)
  );
END; $$;
GRANT EXECUTE ON FUNCTION public.get_employee_leave_balance(uuid, integer, integer) TO authenticated;

-- PART A.5: Bulk set RPC
CREATE OR REPLACE FUNCTION public.bulk_set_monthly_allotments(
  p_year integer, p_month integer, p_employee_allotments jsonb
) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_count int := 0;
  v_item jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Only super_admin can bulk-set monthly allotments';
  END IF;
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_employee_allotments) LOOP
    INSERT INTO public.employee_monthly_leave_allotments
      (employee_id, year, month, paid_leaves_allotted, created_by)
    VALUES (
      (v_item->>'employee_id')::uuid, p_year, p_month,
      COALESCE((v_item->>'paid_leaves_allotted')::int, 0),
      auth.uid()
    )
    ON CONFLICT (employee_id, year, month) DO UPDATE
    SET paid_leaves_allotted = EXCLUDED.paid_leaves_allotted,
        updated_at = now();
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END; $$;
GRANT EXECUTE ON FUNCTION public.bulk_set_monthly_allotments(integer, integer, jsonb) TO authenticated;

-- ============================================================
-- PART B: Sunday duty roster
-- ============================================================
ALTER TABLE public.employee_rosters
  ADD COLUMN IF NOT EXISTS is_working_day boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_sunday_duty boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS compensatory_off_for_date date;
-- unique (employee_id, roster_date) already exists

-- RLS: ensure all authenticated can SELECT, only super_admin can write
ALTER TABLE public.employee_rosters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roster_select ON public.employee_rosters;
DROP POLICY IF EXISTS roster_insert ON public.employee_rosters;
DROP POLICY IF EXISTS roster_update ON public.employee_rosters;
DROP POLICY IF EXISTS roster_delete ON public.employee_rosters;

CREATE POLICY roster_select ON public.employee_rosters FOR SELECT TO authenticated USING (true);
CREATE POLICY roster_insert ON public.employee_rosters FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY roster_update ON public.employee_rosters FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY roster_delete ON public.employee_rosters FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Sunday duty RPC
CREATE OR REPLACE FUNCTION public.assign_sunday_duty(
  p_employee_id uuid, p_sunday_date date, p_comp_off_date date
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_sun_dow int;
  v_diff int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Only super_admin can assign Sunday duty';
  END IF;
  v_sun_dow := EXTRACT(DOW FROM p_sunday_date)::int;
  IF v_sun_dow <> 0 THEN
    RAISE EXCEPTION 'Provided date is not a Sunday';
  END IF;
  v_diff := ABS((p_comp_off_date - p_sunday_date));
  IF v_diff > 6 THEN
    RAISE EXCEPTION 'Comp-off date must be within the same week as the Sunday';
  END IF;

  INSERT INTO public.employee_rosters
    (employee_id, roster_date, roster_type, is_working_day, is_sunday_duty, compensatory_off_for_date, planned_by)
  VALUES (p_employee_id, p_sunday_date, 'working', true, true, p_comp_off_date, auth.uid())
  ON CONFLICT (employee_id, roster_date) DO UPDATE
  SET roster_type='working', is_working_day=true, is_sunday_duty=true,
      compensatory_off_for_date=p_comp_off_date, planned_by=auth.uid(), updated_at=now();

  INSERT INTO public.employee_rosters
    (employee_id, roster_date, roster_type, is_working_day, is_sunday_duty, compensatory_off_for_date, planned_by)
  VALUES (p_employee_id, p_comp_off_date, 'comp_off', false, false, p_sunday_date, auth.uid())
  ON CONFLICT (employee_id, roster_date) DO UPDATE
  SET roster_type='comp_off', is_working_day=false, is_sunday_duty=false,
      compensatory_off_for_date=p_sunday_date, planned_by=auth.uid(), updated_at=now();

  RETURN jsonb_build_object('success', true, 'sunday', p_sunday_date, 'comp_off', p_comp_off_date);
END; $$;
GRANT EXECUTE ON FUNCTION public.assign_sunday_duty(uuid, date, date) TO authenticated;
