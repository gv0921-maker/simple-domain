
ALTER TABLE public.holidays
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'holidays_holiday_date_key') THEN
    BEGIN
      ALTER TABLE public.holidays ADD CONSTRAINT holidays_holiday_date_key UNIQUE (holiday_date);
    EXCEPTION WHEN unique_violation THEN NULL;
    END;
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_holidays_updated_at ON public.holidays;
CREATE TRIGGER trg_holidays_updated_at
  BEFORE UPDATE ON public.holidays
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "holidays_select" ON public.holidays;
DROP POLICY IF EXISTS "holidays_select_authenticated" ON public.holidays;
DROP POLICY IF EXISTS "holidays_modify" ON public.holidays;
DROP POLICY IF EXISTS "holidays_admin_write" ON public.holidays;

CREATE POLICY "holidays_select_authenticated" ON public.holidays
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "holidays_admin_write" ON public.holidays
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

GRANT SELECT ON public.holidays TO authenticated;
GRANT ALL ON public.holidays TO service_role;

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS is_manager boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.get_unified_calendar(
  p_start_date date,
  p_end_date date,
  p_employee_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_is_admin boolean := false;
  v_caller_emp uuid;
  v_emp_ids uuid[];
  v_result jsonb := '[]'::jsonb;
BEGIN
  SELECT (public.has_role(v_uid, 'super_admin'::app_role)
       OR public.has_role(v_uid, 'admin'::app_role)
       OR public.has_role(v_uid, 'hr_manager'::app_role))
    INTO v_is_admin;

  SELECT id INTO v_caller_emp FROM public.employees WHERE user_id = v_uid LIMIT 1;

  IF p_employee_id IS NOT NULL THEN
    IF NOT v_is_admin AND p_employee_id <> v_caller_emp THEN
      RAISE EXCEPTION 'Not authorized to view another employee calendar';
    END IF;
    v_emp_ids := ARRAY[p_employee_id];
  ELSIF v_is_admin THEN
    SELECT COALESCE(array_agg(id), ARRAY[]::uuid[]) INTO v_emp_ids FROM public.employees WHERE status = 'active';
  ELSE
    v_emp_ids := CASE WHEN v_caller_emp IS NULL THEN ARRAY[]::uuid[] ELSE ARRAY[v_caller_emp] END;
  END IF;

  WITH dates AS (
    SELECT generate_series(p_start_date, p_end_date, INTERVAL '1 day')::date AS d
  ),
  emps AS (
    SELECT e.id, e.full_name, e.profile_photo_url FROM public.employees e WHERE e.id = ANY(v_emp_ids)
  ),
  hol AS (
    SELECT holiday_date, name FROM public.holidays
    WHERE is_active = true AND holiday_date BETWEEN p_start_date AND p_end_date
  ),
  rost AS (
    SELECT employee_id, roster_date, roster_type, is_sunday_duty,
           (compensatory_off_for_date IS NOT NULL OR roster_type = 'comp_off') AS is_comp_off
    FROM public.employee_rosters
    WHERE employee_id = ANY(v_emp_ids)
      AND roster_date BETWEEN p_start_date AND p_end_date
  ),
  lv AS (
    SELECT lr.employee_id, gs::date AS d,
           COALESCE(lt.code, lr.leave_type_code) AS code,
           COALESCE(lt.is_paid, true) AS is_paid
    FROM public.leave_requests lr
    LEFT JOIN public.leave_types lt ON lt.id = lr.leave_type_id
    CROSS JOIN LATERAL generate_series(lr.start_date::timestamp, lr.end_date::timestamp, INTERVAL '1 day') gs
    WHERE lr.status = 'approved'
      AND lr.employee_id = ANY(v_emp_ids)
      AND lr.start_date <= p_end_date AND lr.end_date >= p_start_date
  )
  SELECT jsonb_agg(jsonb_build_object('date', to_char(d.d, 'YYYY-MM-DD'), 'entries', entries) ORDER BY d.d)
  INTO v_result
  FROM dates d
  LEFT JOIN LATERAL (
    SELECT jsonb_agg(jsonb_build_object(
      'employee_id', e.id,
      'employee_name', e.full_name,
      'photo_url', e.profile_photo_url,
      'type', t.kind,
      'label', t.label,
      'color', t.color
    )) AS entries
    FROM emps e
    CROSS JOIN LATERAL (
      SELECT
        CASE
          WHEN lv.code IS NOT NULL AND lv.is_paid THEN 'leave_paid'
          WHEN lv.code IS NOT NULL AND NOT lv.is_paid THEN 'leave_unpaid'
          WHEN r.is_sunday_duty THEN 'sunday_duty'
          WHEN r.is_comp_off THEN 'comp_off'
          WHEN h.holiday_date IS NOT NULL THEN 'holiday'
          WHEN EXTRACT(ISODOW FROM d.d) = 7 THEN 'off_day'
          ELSE 'working'
        END AS kind,
        CASE
          WHEN lv.code IS NOT NULL AND lv.is_paid THEN 'Paid Leave'
          WHEN lv.code IS NOT NULL AND NOT lv.is_paid THEN 'Unpaid Leave'
          WHEN r.is_sunday_duty THEN 'Sunday Duty'
          WHEN r.is_comp_off THEN 'Comp Off'
          WHEN h.holiday_date IS NOT NULL THEN h.name
          WHEN EXTRACT(ISODOW FROM d.d) = 7 THEN 'Off'
          ELSE 'Working'
        END AS label,
        CASE
          WHEN lv.code IS NOT NULL AND lv.is_paid THEN '#3b82f6'
          WHEN lv.code IS NOT NULL AND NOT lv.is_paid THEN '#ef4444'
          WHEN r.is_sunday_duty THEN '#a855f7'
          WHEN r.is_comp_off THEN '#f97316'
          WHEN h.holiday_date IS NOT NULL THEN '#6b7280'
          WHEN EXTRACT(ISODOW FROM d.d) = 7 THEN '#d1d5db'
          ELSE '#10b981'
        END AS color
      FROM (SELECT 1) _
      LEFT JOIN lv ON lv.employee_id = e.id AND lv.d = d.d
      LEFT JOIN rost r ON r.employee_id = e.id AND r.roster_date = d.d
      LEFT JOIN hol h ON h.holiday_date = d.d
    ) t
  ) per_day ON true;

  RETURN COALESCE(v_result, '[]'::jsonb);
END $$;

GRANT EXECUTE ON FUNCTION public.get_unified_calendar(date, date, uuid) TO authenticated;

INSERT INTO public.holidays (holiday_date, name, type, is_optional, is_active, description)
VALUES
  ((date_trunc('year', current_date) + INTERVAL '0 day')::date,  'New Year''s Day',  'national', false, true, 'New Year'),
  ((date_trunc('year', current_date) + INTERVAL '25 day')::date, 'Republic Day',     'national', false, true, 'Republic Day of India'),
  ((date_trunc('year', current_date) + INTERVAL '73 day')::date, 'Holi',             'national', false, true, 'Festival of Colours'),
  ((date_trunc('year', current_date) + INTERVAL '226 day')::date,'Independence Day', 'national', false, true, 'Indian Independence Day'),
  ((date_trunc('year', current_date) + INTERVAL '274 day')::date,'Gandhi Jayanti',   'national', false, true, 'Mahatma Gandhi''s Birthday'),
  ((date_trunc('year', current_date) + INTERVAL '305 day')::date,'Diwali',           'national', false, true, 'Festival of Lights'),
  ((date_trunc('year', current_date) + INTERVAL '358 day')::date,'Christmas',        'national', false, true, 'Christmas Day')
ON CONFLICT (holiday_date) DO NOTHING;
