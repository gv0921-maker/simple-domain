-- Disable RLS on CRM tables to allow anon access from demo-auth app (prototype mode).
-- WARNING: anyone with the anon key can read/write these tables.

ALTER TABLE public.crm_contacts      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_companies     DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_opportunities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_pipelines     DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_pipeline_stages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_notes         DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_tags          DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads         DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_audit_logs    DISABLE ROW LEVEL SECURITY;
