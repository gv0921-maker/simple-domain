
-- ============================================================
-- DEPARTMENTS
-- ============================================================
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  manager_id uuid,
  parent_department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  description text,
  color text NOT NULL DEFAULT '#1D9E75',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "departments_select_all_auth" ON public.departments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "departments_insert_hr_admin" ON public.departments
  FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['hr_manager','admin','super_admin']::app_role[]));
CREATE POLICY "departments_update_hr_admin" ON public.departments
  FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['hr_manager','admin','super_admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['hr_manager','admin','super_admin']::app_role[]));
CREATE POLICY "departments_delete_hr_admin" ON public.departments
  FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['hr_manager','admin','super_admin']::app_role[]));

-- ============================================================
-- EMPLOYEES
-- ============================================================
CREATE SEQUENCE public.employees_seq START 1;

CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code text UNIQUE,
  full_name text NOT NULL,
  display_name text,
  email text UNIQUE,
  phone text,
  personal_phone text,
  date_of_birth date,
  gender text,
  blood_group text,
  marital_status text,
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  profile_photo_url text,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  designation text,
  employment_type text NOT NULL DEFAULT 'permanent' CHECK (employment_type IN ('permanent','temporary','contractor','intern')),
  date_of_joining date,
  date_of_exit date,
  exit_reason text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','on_leave','terminated','resigned')),
  reports_to uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  work_location text,
  user_id uuid,
  pan_number text,
  aadhaar_number text,
  bank_account_number text,
  bank_name text,
  ifsc_code text,
  pf_number text,
  esi_number text,
  uan_number text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_employees_department ON public.employees(department_id);
CREATE INDEX idx_employees_reports_to ON public.employees(reports_to);
CREATE INDEX idx_employees_user_id ON public.employees(user_id);

CREATE OR REPLACE FUNCTION public.employees_set_code()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.employee_code IS NULL OR NEW.employee_code = '' THEN
    NEW.employee_code := 'EMP-' || to_char(now(),'YYYY') || '-' ||
      lpad(nextval('public.employees_seq')::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_employees_set_code BEFORE INSERT ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.employees_set_code();

CREATE TRIGGER trg_employees_updated_at BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employees_select_hr_or_self_or_reports" ON public.employees
  FOR SELECT TO authenticated USING (
    public.has_any_role(auth.uid(), ARRAY['hr_manager','admin','super_admin']::app_role[])
    OR user_id = auth.uid()
    OR reports_to IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
  );
CREATE POLICY "employees_insert_hr_admin" ON public.employees
  FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['hr_manager','admin','super_admin']::app_role[]));
CREATE POLICY "employees_update_hr_admin" ON public.employees
  FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['hr_manager','admin','super_admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['hr_manager','admin','super_admin']::app_role[]));
CREATE POLICY "employees_delete_hr_admin" ON public.employees
  FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['hr_manager','admin','super_admin']::app_role[]));

-- ============================================================
-- CONTRACTS
-- ============================================================
CREATE SEQUENCE public.contracts_seq START 1;

CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  contract_number text UNIQUE,
  contract_type text NOT NULL DEFAULT 'permanent' CHECK (contract_type IN ('permanent','probation','temporary','contractor','intern')),
  start_date date NOT NULL,
  end_date date,
  basic_salary numeric(14,2) NOT NULL DEFAULT 0,
  hra numeric(14,2) NOT NULL DEFAULT 0,
  da numeric(14,2) NOT NULL DEFAULT 0,
  special_allowance numeric(14,2) NOT NULL DEFAULT 0,
  conveyance_allowance numeric(14,2) NOT NULL DEFAULT 0,
  medical_allowance numeric(14,2) NOT NULL DEFAULT 0,
  other_allowances_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  gross_salary numeric(14,2) GENERATED ALWAYS AS (
    COALESCE(basic_salary,0) + COALESCE(hra,0) + COALESCE(da,0) +
    COALESCE(special_allowance,0) + COALESCE(conveyance_allowance,0) + COALESCE(medical_allowance,0)
  ) STORED,
  ctc numeric(14,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  working_hours_per_day integer NOT NULL DEFAULT 8,
  working_days_per_week integer NOT NULL DEFAULT 6,
  probation_period_months integer,
  notice_period_days integer,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','expired','terminated')),
  contract_document_url text,
  signed_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_contracts_employee ON public.contracts(employee_id);

CREATE OR REPLACE FUNCTION public.contracts_set_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.contract_number IS NULL OR NEW.contract_number = '' THEN
    NEW.contract_number := 'CON-' || to_char(now(),'YYYY') || '-' ||
      lpad(nextval('public.contracts_seq')::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_contracts_set_number BEFORE INSERT ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.contracts_set_number();

CREATE TRIGGER trg_contracts_updated_at BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contracts TO authenticated;
GRANT ALL ON public.contracts TO service_role;

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contracts_select_hr_admin" ON public.contracts
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['hr_manager','admin','super_admin']::app_role[]));
CREATE POLICY "contracts_insert_hr_admin" ON public.contracts
  FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['hr_manager','admin','super_admin']::app_role[]));
CREATE POLICY "contracts_update_hr_admin" ON public.contracts
  FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['hr_manager','admin','super_admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['hr_manager','admin','super_admin']::app_role[]));
CREATE POLICY "contracts_delete_hr_admin" ON public.contracts
  FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['hr_manager','admin','super_admin']::app_role[]));

-- ============================================================
-- Seed default departments
-- ============================================================
INSERT INTO public.departments (name, code, color) VALUES
  ('Sales','SALES','#FF7043'),
  ('Manufacturing','MFG','#1976D2'),
  ('Warehouse','WH','#AD1457'),
  ('Showroom','SHOW','#F59E0B'),
  ('Admin','ADMIN','#616161'),
  ('Finance','FIN','#00838F'),
  ('HR','HR','#1D9E75')
ON CONFLICT (code) DO NOTHING;
