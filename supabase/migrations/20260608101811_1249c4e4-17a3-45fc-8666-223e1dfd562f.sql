
-- Helper: admin check from JWT user_metadata.role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- Drop existing policies so we can recreate cleanly
DO $$
DECLARE
  t text;
  p record;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'crm_contacts','crm_companies','crm_opportunities',
    'crm_pipelines','crm_pipeline_stages',
    'crm_activities','crm_notes','crm_audit_logs'
  ]
  LOOP
    FOR p IN
      SELECT policyname FROM pg_policies
      WHERE schemaname='public' AND tablename=t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, t);
    END LOOP;
  END LOOP;
END$$;

-- Enable RLS on all CRM tables
ALTER TABLE public.crm_contacts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_companies         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_opportunities     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_pipelines         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_pipeline_stages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_notes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_audit_logs        ENABLE ROW LEVEL SECURITY;

-- Ensure grants for authenticated/service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_contacts        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_companies       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_opportunities   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_pipelines       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_pipeline_stages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_activities      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_notes           TO authenticated;
GRANT SELECT, INSERT          ON public.crm_audit_logs             TO authenticated;
GRANT ALL ON public.crm_contacts, public.crm_companies, public.crm_opportunities,
             public.crm_pipelines, public.crm_pipeline_stages,
             public.crm_activities, public.crm_notes, public.crm_audit_logs
       TO service_role;

-- =========================
-- crm_contacts (assigned_to)
-- =========================
CREATE POLICY "contacts_select_own_or_admin" ON public.crm_contacts
  FOR SELECT TO authenticated
  USING (assigned_to = auth.uid()::text OR public.is_admin());

CREATE POLICY "contacts_insert_own_or_admin" ON public.crm_contacts
  FOR INSERT TO authenticated
  WITH CHECK (assigned_to = auth.uid()::text OR public.is_admin());

CREATE POLICY "contacts_update_own_or_admin" ON public.crm_contacts
  FOR UPDATE TO authenticated
  USING (assigned_to = auth.uid()::text OR public.is_admin())
  WITH CHECK (assigned_to = auth.uid()::text OR public.is_admin());

CREATE POLICY "contacts_delete_own_or_admin" ON public.crm_contacts
  FOR DELETE TO authenticated
  USING (assigned_to = auth.uid()::text OR public.is_admin());

-- =========================
-- crm_companies (assigned_to)
-- =========================
CREATE POLICY "companies_select_own_or_admin" ON public.crm_companies
  FOR SELECT TO authenticated
  USING (assigned_to = auth.uid()::text OR public.is_admin());

CREATE POLICY "companies_insert_own_or_admin" ON public.crm_companies
  FOR INSERT TO authenticated
  WITH CHECK (assigned_to = auth.uid()::text OR public.is_admin());

CREATE POLICY "companies_update_own_or_admin" ON public.crm_companies
  FOR UPDATE TO authenticated
  USING (assigned_to = auth.uid()::text OR public.is_admin())
  WITH CHECK (assigned_to = auth.uid()::text OR public.is_admin());

CREATE POLICY "companies_delete_own_or_admin" ON public.crm_companies
  FOR DELETE TO authenticated
  USING (assigned_to = auth.uid()::text OR public.is_admin());

-- =========================
-- crm_opportunities (assigned_to)
-- =========================
CREATE POLICY "opps_select_own_or_admin" ON public.crm_opportunities
  FOR SELECT TO authenticated
  USING (assigned_to = auth.uid()::text OR public.is_admin());

CREATE POLICY "opps_insert_own_or_admin" ON public.crm_opportunities
  FOR INSERT TO authenticated
  WITH CHECK (assigned_to = auth.uid()::text OR public.is_admin());

CREATE POLICY "opps_update_own_or_admin" ON public.crm_opportunities
  FOR UPDATE TO authenticated
  USING (assigned_to = auth.uid()::text OR public.is_admin())
  WITH CHECK (assigned_to = auth.uid()::text OR public.is_admin());

CREATE POLICY "opps_delete_own_or_admin" ON public.crm_opportunities
  FOR DELETE TO authenticated
  USING (assigned_to = auth.uid()::text OR public.is_admin());

-- =========================
-- crm_pipelines (shared config)
-- =========================
CREATE POLICY "pipelines_all_authenticated" ON public.crm_pipelines
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- =========================
-- crm_pipeline_stages (shared config)
-- =========================
CREATE POLICY "stages_all_authenticated" ON public.crm_pipeline_stages
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- =========================
-- crm_activities (user_id)
-- =========================
CREATE POLICY "activities_select_own_or_admin" ON public.crm_activities
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text OR public.is_admin());

CREATE POLICY "activities_insert_own_or_admin" ON public.crm_activities
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text OR public.is_admin());

CREATE POLICY "activities_update_own_or_admin" ON public.crm_activities
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text OR public.is_admin())
  WITH CHECK (user_id = auth.uid()::text OR public.is_admin());

CREATE POLICY "activities_delete_own_or_admin" ON public.crm_activities
  FOR DELETE TO authenticated
  USING (user_id = auth.uid()::text OR public.is_admin());

-- =========================
-- crm_notes (user_id)
-- =========================
CREATE POLICY "notes_select_own_or_admin" ON public.crm_notes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text OR public.is_admin());

CREATE POLICY "notes_insert_own_or_admin" ON public.crm_notes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text OR public.is_admin());

CREATE POLICY "notes_update_own_or_admin" ON public.crm_notes
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text OR public.is_admin())
  WITH CHECK (user_id = auth.uid()::text OR public.is_admin());

CREATE POLICY "notes_delete_own_or_admin" ON public.crm_notes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid()::text OR public.is_admin());

-- =========================
-- crm_audit_logs: INSERT-only for authenticated, SELECT-only for admins
-- =========================
CREATE POLICY "audit_insert_authenticated" ON public.crm_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "audit_select_admin_only" ON public.crm_audit_logs
  FOR SELECT TO authenticated
  USING (public.is_admin());
