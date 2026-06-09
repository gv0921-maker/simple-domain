
-- Salary components catalog
CREATE TABLE public.salary_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('earning','deduction','employer_contribution')),
  calculation_type text NOT NULL DEFAULT 'fixed' CHECK (calculation_type IN ('fixed','percentage_of_basic','percentage_of_gross','formula')),
  default_value numeric NOT NULL DEFAULT 0,
  is_taxable boolean NOT NULL DEFAULT true,
  is_pf_applicable boolean NOT NULL DEFAULT true,
  is_esi_applicable boolean NOT NULL DEFAULT true,
  affects_lop boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.salary_components TO authenticated;
GRANT ALL ON public.salary_components TO service_role;
ALTER TABLE public.salary_components ENABLE ROW LEVEL SECURITY;
CREATE POLICY sc_sel ON public.salary_components FOR SELECT TO authenticated USING (true);
CREATE POLICY sc_mng ON public.salary_components FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','hr_manager']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','hr_manager']::app_role[]));
CREATE TRIGGER trg_sc_updated BEFORE UPDATE ON public.salary_components
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Payroll settings
CREATE TABLE public.payroll_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  financial_year text NOT NULL UNIQUE,
  pf_rate numeric NOT NULL DEFAULT 12.0,
  pf_basic_cap numeric NOT NULL DEFAULT 15000,
  esi_rate_employee numeric NOT NULL DEFAULT 0.75,
  esi_rate_employer numeric NOT NULL DEFAULT 3.25,
  esi_gross_threshold numeric NOT NULL DEFAULT 21000,
  pt_amount numeric NOT NULL DEFAULT 200,
  pt_state text NOT NULL DEFAULT 'Karnataka',
  tds_regime text NOT NULL DEFAULT 'new' CHECK (tds_regime IN ('old','new')),
  working_days_per_month int NOT NULL DEFAULT 26,
  working_hours_per_day numeric NOT NULL DEFAULT 8,
  overtime_rate_multiplier numeric NOT NULL DEFAULT 1.5,
  standard_deduction numeric NOT NULL DEFAULT 50000,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payroll_settings TO authenticated;
GRANT ALL ON public.payroll_settings TO service_role;
ALTER TABLE public.payroll_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY ps_sel ON public.payroll_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY ps_mng ON public.payroll_settings FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','hr_manager']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','hr_manager']::app_role[]));
CREATE TRIGGER trg_ps_updated BEFORE UPDATE ON public.payroll_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tax slabs
CREATE TABLE public.tax_slabs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  financial_year text NOT NULL,
  regime text NOT NULL CHECK (regime IN ('old','new')),
  slab_order int NOT NULL,
  from_amount numeric NOT NULL,
  to_amount numeric,
  rate_percentage numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tax_slabs TO authenticated;
GRANT ALL ON public.tax_slabs TO service_role;
ALTER TABLE public.tax_slabs ENABLE ROW LEVEL SECURITY;
CREATE POLICY ts_sel ON public.tax_slabs FOR SELECT TO authenticated USING (true);
CREATE POLICY ts_mng ON public.tax_slabs FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','hr_manager']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','hr_manager']::app_role[]));

-- Employee loans
CREATE TABLE public.employee_loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  loan_amount numeric NOT NULL,
  monthly_emi numeric NOT NULL,
  total_emis int NOT NULL,
  paid_emis int NOT NULL DEFAULT 0,
  remaining_amount numeric GENERATED ALWAYS AS (loan_amount - (monthly_emi * paid_emis)) STORED,
  start_month date NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','closed')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_loans TO authenticated;
GRANT ALL ON public.employee_loans TO service_role;
ALTER TABLE public.employee_loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY el_own ON public.employee_loans FOR SELECT TO authenticated
  USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));
CREATE POLICY el_mng ON public.employee_loans FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','hr_manager']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','hr_manager']::app_role[]));
CREATE TRIGGER trg_el_updated BEFORE UPDATE ON public.employee_loans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_el_emp ON public.employee_loans(employee_id, status);

-- Employee advances
CREATE TABLE public.employee_advances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  advance_amount numeric NOT NULL,
  deducted_amount numeric NOT NULL DEFAULT 0,
  remaining_amount numeric GENERATED ALWAYS AS (advance_amount - deducted_amount) STORED,
  deduction_month date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','recovered','cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_advances TO authenticated;
GRANT ALL ON public.employee_advances TO service_role;
ALTER TABLE public.employee_advances ENABLE ROW LEVEL SECURITY;
CREATE POLICY ea_own ON public.employee_advances FOR SELECT TO authenticated
  USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));
CREATE POLICY ea_mng ON public.employee_advances FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','hr_manager']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','hr_manager']::app_role[]));
CREATE TRIGGER trg_ea_updated BEFORE UPDATE ON public.employee_advances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_ea_emp ON public.employee_advances(employee_id, status);

-- Payroll periods
CREATE TABLE public.payroll_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_month int NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year int NOT NULL,
  period_label text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','processing','processed','locked','paid')),
  processed_at timestamptz,
  processed_by uuid REFERENCES auth.users(id),
  locked_at timestamptz,
  locked_by uuid REFERENCES auth.users(id),
  paid_at timestamptz,
  payment_reference text,
  total_gross numeric NOT NULL DEFAULT 0,
  total_deductions numeric NOT NULL DEFAULT 0,
  total_net numeric NOT NULL DEFAULT 0,
  total_employer_contrib numeric NOT NULL DEFAULT 0,
  total_employees int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(period_month, period_year)
);
GRANT SELECT ON public.payroll_periods TO authenticated;
GRANT ALL ON public.payroll_periods TO service_role;
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY pp_sel ON public.payroll_periods FOR SELECT TO authenticated USING (true);
CREATE POLICY pp_mng ON public.payroll_periods FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','hr_manager']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','hr_manager']::app_role[]));
CREATE TRIGGER trg_pp_updated BEFORE UPDATE ON public.payroll_periods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Payslips
CREATE TABLE public.payslips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_period_id uuid NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  payslip_number text NOT NULL,
  contract_id uuid REFERENCES public.contracts(id),
  total_working_days numeric NOT NULL DEFAULT 26,
  lop_days numeric NOT NULL DEFAULT 0,
  paid_days numeric GENERATED ALWAYS AS (total_working_days - lop_days) STORED,
  overtime_hours numeric NOT NULL DEFAULT 0,
  gross_earnings numeric NOT NULL DEFAULT 0,
  total_deductions numeric NOT NULL DEFAULT 0,
  net_pay numeric NOT NULL DEFAULT 0,
  employer_contributions numeric NOT NULL DEFAULT 0,
  ctc_for_period numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','finalized','sent')),
  finalized_at timestamptz,
  payslip_pdf_url text,
  payment_date date,
  payment_reference text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(payroll_period_id, employee_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payslips TO authenticated;
GRANT ALL ON public.payslips TO service_role;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
CREATE POLICY psl_own ON public.payslips FOR SELECT TO authenticated
  USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));
CREATE POLICY psl_mng ON public.payslips FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','hr_manager']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','hr_manager']::app_role[]));
CREATE TRIGGER trg_psl_updated BEFORE UPDATE ON public.payslips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_psl_period ON public.payslips(payroll_period_id);
CREATE INDEX idx_psl_emp ON public.payslips(employee_id);

-- Payslip components
CREATE TABLE public.payslip_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payslip_id uuid NOT NULL REFERENCES public.payslips(id) ON DELETE CASCADE,
  salary_component_id uuid NOT NULL REFERENCES public.salary_components(id),
  amount numeric NOT NULL DEFAULT 0,
  calculation_notes text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payslip_components TO authenticated;
GRANT ALL ON public.payslip_components TO service_role;
ALTER TABLE public.payslip_components ENABLE ROW LEVEL SECURITY;
CREATE POLICY pslc_own ON public.payslip_components FOR SELECT TO authenticated
  USING (payslip_id IN (SELECT id FROM public.payslips WHERE employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())));
CREATE POLICY pslc_mng ON public.payslip_components FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','hr_manager']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','hr_manager']::app_role[]));
CREATE INDEX idx_pslc_psl ON public.payslip_components(payslip_id);

-- Seed salary components
INSERT INTO public.salary_components (code, name, type, calculation_type, default_value, is_taxable, is_pf_applicable, is_esi_applicable, affects_lop, display_order) VALUES
  ('BASIC','Basic','earning','fixed',0,true,true,true,true,1),
  ('HRA','House Rent Allowance','earning','fixed',0,true,false,true,true,2),
  ('DA','Dearness Allowance','earning','fixed',0,true,true,true,true,3),
  ('CONV','Conveyance','earning','fixed',0,true,false,true,true,4),
  ('MED','Medical Allowance','earning','fixed',0,true,false,true,true,5),
  ('SPL','Special Allowance','earning','fixed',0,true,false,true,true,6),
  ('OT','Overtime','earning','formula',0,true,false,true,false,7),
  ('PF','Provident Fund (Employee)','deduction','percentage_of_basic',12,false,false,false,false,10),
  ('ESI','ESI (Employee)','deduction','percentage_of_gross',0.75,false,false,false,false,11),
  ('PT','Professional Tax','deduction','fixed',200,false,false,false,false,12),
  ('TDS','Tax Deducted at Source','deduction','formula',0,false,false,false,false,13),
  ('LOAN','Loan EMI','deduction','fixed',0,false,false,false,false,14),
  ('ADV','Advance Recovery','deduction','fixed',0,false,false,false,false,15),
  ('LOP','Loss of Pay','deduction','formula',0,false,false,false,false,16),
  ('PF_EMP','Provident Fund (Employer)','employer_contribution','percentage_of_basic',12,false,false,false,false,20),
  ('ESI_EMP','ESI (Employer)','employer_contribution','percentage_of_gross',3.25,false,false,false,false,21);

-- Seed payroll settings
INSERT INTO public.payroll_settings (financial_year) VALUES ('2026-27');

-- Seed FY 2026-27 New Regime
INSERT INTO public.tax_slabs (financial_year, regime, slab_order, from_amount, to_amount, rate_percentage) VALUES
  ('2026-27','new',1,0,300000,0),
  ('2026-27','new',2,300000,700000,5),
  ('2026-27','new',3,700000,1000000,10),
  ('2026-27','new',4,1000000,1200000,15),
  ('2026-27','new',5,1200000,1500000,20),
  ('2026-27','new',6,1500000,NULL,30);

-- Auto-numbering for payslips
CREATE OR REPLACE FUNCTION public.payslips_set_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_code text;
  v_y int;
  v_m int;
BEGIN
  IF NEW.payslip_number IS NULL OR NEW.payslip_number = '' THEN
    SELECT employee_code INTO v_code FROM public.employees WHERE id = NEW.employee_id;
    SELECT period_year, period_month INTO v_y, v_m FROM public.payroll_periods WHERE id = NEW.payroll_period_id;
    NEW.payslip_number := 'PS-' || v_y || '-' || lpad(v_m::text,2,'0') || '-' || COALESCE(v_code,'EMP');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_psl_number BEFORE INSERT ON public.payslips
  FOR EACH ROW EXECUTE FUNCTION public.payslips_set_number();

-- Auto period_label
CREATE OR REPLACE FUNCTION public.payroll_periods_set_label()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.period_label IS NULL OR NEW.period_label = '' THEN
    NEW.period_label := to_char(make_date(NEW.period_year, NEW.period_month, 1), 'Mon YYYY');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_pp_label BEFORE INSERT OR UPDATE ON public.payroll_periods
  FOR EACH ROW EXECUTE FUNCTION public.payroll_periods_set_label();
