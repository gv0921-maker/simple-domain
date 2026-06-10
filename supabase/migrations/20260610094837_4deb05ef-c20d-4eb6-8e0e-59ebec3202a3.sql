
-- 1. Helper functions that bypass RLS
CREATE OR REPLACE FUNCTION public.get_current_employee_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT id FROM public.employees WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_manager_of(target_employee_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = target_employee_id
      AND e.reports_to = public.get_current_employee_id()
  )
$$;

-- 2. EMPLOYEES — drop and recreate
DROP POLICY IF EXISTS employees_select_hr_or_self_or_reports ON public.employees;
DROP POLICY IF EXISTS employees_insert_hr_admin ON public.employees;
DROP POLICY IF EXISTS employees_update_hr_admin ON public.employees;
DROP POLICY IF EXISTS employees_delete_hr_admin ON public.employees;

CREATE POLICY employees_select ON public.employees FOR SELECT TO authenticated
USING (
  public.has_any_role(auth.uid(), ARRAY['admin','super_admin','hr_manager']::app_role[])
  OR user_id = auth.uid()
  OR public.is_manager_of(id)
);
CREATE POLICY employees_insert_hr_admin ON public.employees FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['hr_manager','admin','super_admin']::app_role[]));
CREATE POLICY employees_update_hr_admin ON public.employees FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['hr_manager','admin','super_admin']::app_role[]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['hr_manager','admin','super_admin']::app_role[]));
CREATE POLICY employees_delete_hr_admin ON public.employees FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['hr_manager','admin','super_admin']::app_role[]));

-- 3. ATTENDANCE SESSIONS
DROP POLICY IF EXISTS att_sessions_select_self_or_hr_or_mgr ON public.attendance_sessions;
DROP POLICY IF EXISTS att_sessions_insert_self_or_hr ON public.attendance_sessions;
DROP POLICY IF EXISTS att_sessions_update_open_self_or_hr ON public.attendance_sessions;
DROP POLICY IF EXISTS att_sessions_delete_hr ON public.attendance_sessions;

CREATE POLICY att_sessions_select_self_or_hr_or_mgr ON public.attendance_sessions FOR SELECT TO authenticated
USING (
  public.has_any_role(auth.uid(), ARRAY['hr_manager','admin','super_admin']::app_role[])
  OR employee_id = public.get_current_employee_id()
  OR public.is_manager_of(employee_id)
);
CREATE POLICY att_sessions_insert_self_or_hr ON public.attendance_sessions FOR INSERT TO authenticated
WITH CHECK (
  public.has_any_role(auth.uid(), ARRAY['hr_manager','admin','super_admin']::app_role[])
  OR employee_id = public.get_current_employee_id()
);
CREATE POLICY att_sessions_update_open_self_or_hr ON public.attendance_sessions FOR UPDATE TO authenticated
USING (
  public.has_any_role(auth.uid(), ARRAY['hr_manager','admin','super_admin']::app_role[])
  OR (check_out_time IS NULL AND employee_id = public.get_current_employee_id())
)
WITH CHECK (
  public.has_any_role(auth.uid(), ARRAY['hr_manager','admin','super_admin']::app_role[])
  OR employee_id = public.get_current_employee_id()
);
CREATE POLICY att_sessions_delete_hr ON public.attendance_sessions FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['hr_manager','admin','super_admin']::app_role[]));

-- 4. LEAVE REQUESTS
DROP POLICY IF EXISTS "lr view own" ON public.leave_requests;
DROP POLICY IF EXISTS "lr view reports" ON public.leave_requests;
DROP POLICY IF EXISTS "lr insert own" ON public.leave_requests;
DROP POLICY IF EXISTS "lr update own" ON public.leave_requests;
DROP POLICY IF EXISTS "lr update reports" ON public.leave_requests;

CREATE POLICY "lr view own" ON public.leave_requests FOR SELECT TO authenticated
USING (employee_id = public.get_current_employee_id());
CREATE POLICY "lr view reports" ON public.leave_requests FOR SELECT TO authenticated
USING (public.is_manager_of(employee_id));
CREATE POLICY "lr insert own" ON public.leave_requests FOR INSERT TO authenticated
WITH CHECK (employee_id = public.get_current_employee_id());
CREATE POLICY "lr update own" ON public.leave_requests FOR UPDATE TO authenticated
USING (status = ANY (ARRAY['draft','pending']) AND employee_id = public.get_current_employee_id())
WITH CHECK (employee_id = public.get_current_employee_id());
CREATE POLICY "lr update reports" ON public.leave_requests FOR UPDATE TO authenticated
USING (public.is_manager_of(employee_id))
WITH CHECK (true);

-- 5. LEAVE BALANCES
DROP POLICY IF EXISTS "bal view own" ON public.leave_balances;
DROP POLICY IF EXISTS "bal view reports" ON public.leave_balances;
CREATE POLICY "bal view own" ON public.leave_balances FOR SELECT TO authenticated
USING (employee_id = public.get_current_employee_id());
CREATE POLICY "bal view reports" ON public.leave_balances FOR SELECT TO authenticated
USING (public.is_manager_of(employee_id));

-- 6. EMPLOYEE LEAVE ENTITLEMENTS
DROP POLICY IF EXISTS "ent view own" ON public.employee_leave_entitlements;
DROP POLICY IF EXISTS "ent view reports" ON public.employee_leave_entitlements;
CREATE POLICY "ent view own" ON public.employee_leave_entitlements FOR SELECT TO authenticated
USING (employee_id = public.get_current_employee_id());
CREATE POLICY "ent view reports" ON public.employee_leave_entitlements FOR SELECT TO authenticated
USING (public.is_manager_of(employee_id));

-- 7. EMPLOYEE ROSTERS
DROP POLICY IF EXISTS "rost view own" ON public.employee_rosters;
DROP POLICY IF EXISTS "rost view reports" ON public.employee_rosters;
CREATE POLICY "rost view own" ON public.employee_rosters FOR SELECT TO authenticated
USING (employee_id = public.get_current_employee_id());
CREATE POLICY "rost view reports" ON public.employee_rosters FOR SELECT TO authenticated
USING (public.is_manager_of(employee_id));

-- 8. COMP OFF CREDITS
DROP POLICY IF EXISTS "coc view own" ON public.comp_off_credits;
CREATE POLICY "coc view own" ON public.comp_off_credits FOR SELECT TO authenticated
USING (employee_id = public.get_current_employee_id());

-- 9. PAYSLIPS
DROP POLICY IF EXISTS psl_own ON public.payslips;
CREATE POLICY psl_own ON public.payslips FOR SELECT TO authenticated
USING (employee_id = public.get_current_employee_id());

-- 10. PAYSLIP COMPONENTS
DROP POLICY IF EXISTS pslc_own ON public.payslip_components;
CREATE POLICY pslc_own ON public.payslip_components FOR SELECT TO authenticated
USING (payslip_id IN (SELECT id FROM public.payslips WHERE employee_id = public.get_current_employee_id()));

-- 11. LEAVE APPROVAL LOG
DROP POLICY IF EXISTS "lal select related" ON public.leave_approval_log;
CREATE POLICY "lal select related" ON public.leave_approval_log FOR SELECT TO authenticated
USING (
  public.has_any_role(auth.uid(), ARRAY['admin','super_admin','hr_manager']::app_role[])
  OR EXISTS (
    SELECT 1 FROM public.leave_requests lr
    WHERE lr.id = leave_approval_log.leave_request_id
      AND (lr.employee_id = public.get_current_employee_id() OR public.is_manager_of(lr.employee_id))
  )
);
