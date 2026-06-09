
CREATE TABLE public.leave_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  description text,
  default_days_per_year numeric NOT NULL DEFAULT 0,
  is_paid boolean NOT NULL DEFAULT true,
  accrual_type text NOT NULL DEFAULT 'annual' CHECK (accrual_type IN ('annual','monthly','none')),
  default_carry_forward_max_days numeric NOT NULL DEFAULT 0,
  requires_approval boolean NOT NULL DEFAULT true,
  default_min_notice_days int NOT NULL DEFAULT 0,
  default_max_consecutive_days int,
  allow_half_day boolean NOT NULL DEFAULT true,
  allow_negative_balance boolean NOT NULL DEFAULT false,
  applicable_after_months int NOT NULL DEFAULT 0,
  gender_restriction text NOT NULL DEFAULT 'all' CHECK (gender_restriction IN ('all','male','female')),
  color text NOT NULL DEFAULT '#1D9E75',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leave_types TO authenticated;
GRANT ALL ON public.leave_types TO service_role;
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leave_types select all auth" ON public.leave_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "leave_types manage hr" ON public.leave_types FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','hr_manager']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','hr_manager']::app_role[]));
CREATE TRIGGER trg_leave_types_updated BEFORE UPDATE ON public.leave_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.leave_types (name, code, default_days_per_year, default_carry_forward_max_days, default_min_notice_days, gender_restriction, is_paid, color) VALUES
  ('Casual Leave','CL',12,0,1,'all',true,'#3B82F6'),
  ('Sick Leave','SL',10,0,0,'all',true,'#EF4444'),
  ('Earned Leave','EL',21,30,7,'all',true,'#10B981'),
  ('Maternity Leave','ML',180,0,30,'female',true,'#EC4899'),
  ('Paternity Leave','PL',15,0,7,'male',true,'#6366F1'),
  ('Unpaid Leave','UPL',0,0,0,'all',false,'#6B7280'),
  ('Comp Off','COFF',0,0,0,'all',true,'#F59E0B'),
  ('Bereavement Leave','BL',5,0,0,'all',true,'#1F2937');

CREATE TABLE public.employee_leave_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type_id uuid NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
  year int NOT NULL,
  allocated_days numeric NOT NULL DEFAULT 0,
  min_notice_days int,
  max_consecutive_days int,
  carry_forward_max_days numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, leave_type_id, year)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_leave_entitlements TO authenticated;
GRANT ALL ON public.employee_leave_entitlements TO service_role;
ALTER TABLE public.employee_leave_entitlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ent hr manage" ON public.employee_leave_entitlements FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','hr_manager']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','hr_manager']::app_role[]));
CREATE POLICY "ent view own" ON public.employee_leave_entitlements FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.user_id = auth.uid()));
CREATE POLICY "ent view reports" ON public.employee_leave_entitlements FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.employees e
    JOIN public.employees m ON m.id = e.reports_to
    WHERE e.id = employee_id AND m.user_id = auth.uid()
  ));
CREATE TRIGGER trg_ent_updated BEFORE UPDATE ON public.employee_leave_entitlements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.leave_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type_id uuid NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
  year int NOT NULL,
  opening_balance numeric NOT NULL DEFAULT 0,
  accrued numeric NOT NULL DEFAULT 0,
  used numeric NOT NULL DEFAULT 0,
  pending_approval numeric NOT NULL DEFAULT 0,
  carried_forward numeric NOT NULL DEFAULT 0,
  available_balance numeric GENERATED ALWAYS AS (opening_balance + accrued + carried_forward - used - pending_approval) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, leave_type_id, year)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leave_balances TO authenticated;
GRANT ALL ON public.leave_balances TO service_role;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bal hr manage" ON public.leave_balances FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','hr_manager']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','hr_manager']::app_role[]));
CREATE POLICY "bal view own" ON public.leave_balances FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.user_id = auth.uid()));
CREATE POLICY "bal view reports" ON public.leave_balances FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.employees e
    JOIN public.employees m ON m.id = e.reports_to
    WHERE e.id = employee_id AND m.user_id = auth.uid()
  ));
CREATE TRIGGER trg_bal_updated BEFORE UPDATE ON public.leave_balances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE SEQUENCE IF NOT EXISTS public.leave_requests_seq START 1;

CREATE TABLE public.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number text UNIQUE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type_id uuid NOT NULL REFERENCES public.leave_types(id),
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_days numeric NOT NULL DEFAULT 0,
  is_half_day boolean NOT NULL DEFAULT false,
  half_day_session text CHECK (half_day_session IN ('first_half','second_half')),
  reason text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending','approved','rejected','cancelled')),
  applied_date timestamptz,
  approver_id uuid REFERENCES public.employees(id),
  approved_date timestamptz,
  rejection_reason text,
  attachment_url text,
  contact_during_leave text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leave_requests TO authenticated;
GRANT ALL ON public.leave_requests TO service_role;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lr hr manage" ON public.leave_requests FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','hr_manager']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','hr_manager']::app_role[]));
CREATE POLICY "lr view own" ON public.leave_requests FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.user_id = auth.uid()));
CREATE POLICY "lr insert own" ON public.leave_requests FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.user_id = auth.uid()));
CREATE POLICY "lr update own" ON public.leave_requests FOR UPDATE TO authenticated
  USING (status IN ('draft','pending') AND EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.user_id = auth.uid()));
CREATE POLICY "lr view reports" ON public.leave_requests FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.employees e
    JOIN public.employees m ON m.id = e.reports_to
    WHERE e.id = employee_id AND m.user_id = auth.uid()
  ));
CREATE POLICY "lr update reports" ON public.leave_requests FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.employees e
    JOIN public.employees m ON m.id = e.reports_to
    WHERE e.id = employee_id AND m.user_id = auth.uid()
  ))
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.leave_requests_set_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.request_number IS NULL OR NEW.request_number = '' THEN
    NEW.request_number := 'LR-' || to_char(now(),'YYYY') || '-' ||
      lpad(nextval('public.leave_requests_seq')::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_lr_number BEFORE INSERT ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.leave_requests_set_number();
CREATE TRIGGER trg_lr_updated BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.leave_approval_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_request_id uuid NOT NULL REFERENCES public.leave_requests(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('submitted','approved','rejected','cancelled','modified')),
  actor_id uuid REFERENCES auth.users(id),
  action_date timestamptz NOT NULL DEFAULT now(),
  comments text,
  previous_status text,
  new_status text
);
GRANT SELECT, INSERT ON public.leave_approval_log TO authenticated;
GRANT ALL ON public.leave_approval_log TO service_role;
ALTER TABLE public.leave_approval_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lal insert auth" ON public.leave_approval_log FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "lal select related" ON public.leave_approval_log FOR SELECT TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['admin','super_admin','hr_manager']::app_role[])
    OR EXISTS (
      SELECT 1 FROM public.leave_requests lr
      JOIN public.employees e ON e.id = lr.employee_id
      LEFT JOIN public.employees m ON m.id = e.reports_to
      WHERE lr.id = leave_request_id
        AND (e.user_id = auth.uid() OR m.user_id = auth.uid())
    )
  );

CREATE TABLE public.employee_rosters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  roster_date date NOT NULL,
  roster_type text NOT NULL DEFAULT 'working' CHECK (roster_type IN ('working','weekly_off','comp_off','training','holiday')),
  original_off_date date,
  comp_off_reason text,
  planned_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, roster_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_rosters TO authenticated;
GRANT ALL ON public.employee_rosters TO service_role;
ALTER TABLE public.employee_rosters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rost hr manage" ON public.employee_rosters FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','hr_manager']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','hr_manager']::app_role[]));
CREATE POLICY "rost view own" ON public.employee_rosters FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.user_id = auth.uid()));
CREATE POLICY "rost view reports" ON public.employee_rosters FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.employees e
    JOIN public.employees m ON m.id = e.reports_to
    WHERE e.id = employee_id AND m.user_id = auth.uid()
  ));
CREATE TRIGGER trg_rost_updated BEFORE UPDATE ON public.employee_rosters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.comp_off_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  work_date date NOT NULL,
  comp_off_days numeric NOT NULL DEFAULT 1,
  expiry_date date NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '90 days'),
  used boolean NOT NULL DEFAULT false,
  used_in_leave_request_id uuid REFERENCES public.leave_requests(id),
  granted_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comp_off_credits TO authenticated;
GRANT ALL ON public.comp_off_credits TO service_role;
ALTER TABLE public.comp_off_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coc hr manage" ON public.comp_off_credits FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','hr_manager']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','hr_manager']::app_role[]));
CREATE POLICY "coc view own" ON public.comp_off_credits FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.user_id = auth.uid()));

CREATE INDEX idx_rosters_emp_date ON public.employee_rosters(employee_id, roster_date);
CREATE INDEX idx_rosters_date_type ON public.employee_rosters(roster_date, roster_type);
CREATE INDEX idx_lr_emp_status ON public.leave_requests(employee_id, status);
CREATE INDEX idx_lr_dates ON public.leave_requests(start_date, end_date);
CREATE INDEX idx_balances_emp_year ON public.leave_balances(employee_id, year);
CREATE INDEX idx_entitlements_emp_year ON public.employee_leave_entitlements(employee_id, year);
CREATE INDEX idx_coc_emp ON public.comp_off_credits(employee_id, used, expiry_date);
