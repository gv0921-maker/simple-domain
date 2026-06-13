
CREATE TABLE IF NOT EXISTS public.company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT 'GLF',
  address text,
  city text,
  state text,
  country text NOT NULL DEFAULT 'India',
  pincode text,
  phone text,
  email text,
  gstin text,
  website text,
  logo_url text,
  letterhead_footer text,
  standard_terms text,
  thermal_width_mm integer NOT NULL DEFAULT 80,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_settings TO authenticated;
GRANT ALL ON public.company_settings TO service_role;

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view company settings"
  ON public.company_settings FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Super admins can insert company settings"
  ON public.company_settings FOR INSERT
  TO authenticated WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can update company settings"
  ON public.company_settings FOR UPDATE
  TO authenticated USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can delete company settings"
  ON public.company_settings FOR DELETE
  TO authenticated USING (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER update_company_settings_updated_at
  BEFORE UPDATE ON public.company_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.company_settings (company_name, address, city, state, country, pincode, phone, email, gstin, website, letterhead_footer, standard_terms)
SELECT 'GLF', 'Goods Logistics & Fulfilment', 'Mumbai', 'Maharashtra', 'India', '400001', '+91 00000 00000', 'contact@glf.example', '27AAAAA0000A1Z5', 'www.glf.example',
       'This is a computer-generated document. For any queries, please contact us.',
       E'1. Goods once sold will not be taken back.\n2. Payment due within 30 days.\n3. Subject to local jurisdiction.'
WHERE NOT EXISTS (SELECT 1 FROM public.company_settings);
