
-- ==================== ENUMS ====================

CREATE TYPE public.contact_type AS ENUM ('individual', 'company');
CREATE TYPE public.contact_status AS ENUM ('active', 'archived');
CREATE TYPE public.lead_source AS ENUM ('website', 'referral', 'social_media', 'trade_show', 'cold_call', 'email_campaign', 'import', 'manual', 'other');
CREATE TYPE public.lead_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost');
CREATE TYPE public.opportunity_stage AS ENUM ('new', 'qualified', 'proposition', 'won', 'lost');
CREATE TYPE public.activity_type AS ENUM ('call', 'email', 'meeting', 'task', 'note', 'follow_up');
CREATE TYPE public.note_visibility AS ENUM ('private', 'team', 'public');

-- ==================== TIMESTAMP TRIGGER ====================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ==================== TABLES ====================

-- Companies
CREATE TABLE public.crm_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  employee_count TEXT,
  annual_revenue NUMERIC,
  phone TEXT,
  email TEXT,
  addresses JSONB DEFAULT '[]'::jsonb,
  parent_company_id UUID REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  assigned_to TEXT,
  status public.contact_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contacts
CREATE TABLE public.crm_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type public.contact_type NOT NULL DEFAULT 'individual',
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  email TEXT DEFAULT '',
  emails JSONB DEFAULT '[]'::jsonb,
  phone TEXT,
  phones JSONB DEFAULT '[]'::jsonb,
  company_id UUID REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  company_name TEXT,
  job_title TEXT,
  department TEXT,
  website TEXT,
  gstin TEXT,
  addresses JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  assigned_to TEXT,
  status public.contact_status NOT NULL DEFAULT 'active',
  score INTEGER NOT NULL DEFAULT 0,
  parent_contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  custom_fields JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pipelines
CREATE TABLE public.crm_pipelines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pipeline Stages
CREATE TABLE public.crm_pipeline_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_id UUID NOT NULL REFERENCES public.crm_pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  probability INTEGER NOT NULL DEFAULT 0,
  color TEXT DEFAULT 'hsl(210, 70%, 55%)',
  description TEXT,
  automation_hooks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Leads
CREATE TABLE public.crm_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  contact_name TEXT NOT NULL DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT,
  company_id UUID REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  company_name TEXT,
  source public.lead_source NOT NULL DEFAULT 'manual',
  source_detail TEXT,
  status public.lead_status NOT NULL DEFAULT 'new',
  priority public.lead_priority NOT NULL DEFAULT 'medium',
  score INTEGER NOT NULL DEFAULT 0,
  expected_revenue NUMERIC NOT NULL DEFAULT 0,
  probability INTEGER NOT NULL DEFAULT 10,
  assigned_to TEXT,
  team_id TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  qualified_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  converted_to_opportunity_id UUID,
  lost_reason TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Opportunities
CREATE TABLE public.crm_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  contact_name TEXT DEFAULT '',
  company_id UUID REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  pipeline_id UUID NOT NULL REFERENCES public.crm_pipelines(id) ON DELETE RESTRICT,
  stage_id TEXT NOT NULL DEFAULT 'new',
  stage public.opportunity_stage NOT NULL DEFAULT 'new',
  expected_revenue NUMERIC NOT NULL DEFAULT 0,
  probability INTEGER NOT NULL DEFAULT 10,
  priority SMALLINT NOT NULL DEFAULT 0,
  expected_close_date DATE,
  assigned_to TEXT,
  sales_team TEXT,
  team_id TEXT,
  products JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  internal_notes TEXT,
  lost_reason TEXT,
  won_at TIMESTAMPTZ,
  lost_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activities
CREATE TABLE public.crm_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type public.activity_type NOT NULL DEFAULT 'task',
  subject TEXT NOT NULL DEFAULT '',
  description TEXT,
  related_to TEXT NOT NULL DEFAULT 'contact',
  related_id UUID NOT NULL,
  user_id TEXT NOT NULL DEFAULT '',
  user_name TEXT NOT NULL DEFAULT '',
  due_date TIMESTAMPTZ,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  priority public.lead_priority,
  mentions JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notes
CREATE TABLE public.crm_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL DEFAULT '',
  related_to TEXT NOT NULL DEFAULT 'contact',
  related_id UUID NOT NULL,
  user_id TEXT NOT NULL DEFAULT '',
  user_name TEXT NOT NULL DEFAULT '',
  visibility public.note_visibility NOT NULL DEFAULT 'team',
  mentions JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tags
CREATE TABLE public.crm_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  color TEXT DEFAULT 'hsl(var(--muted))',
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit Logs
CREATE TABLE public.crm_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT '',
  user_name TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== INDEXES ====================

-- Contacts
CREATE INDEX idx_crm_contacts_email ON public.crm_contacts (email);
CREATE INDEX idx_crm_contacts_phone ON public.crm_contacts (phone);
CREATE INDEX idx_crm_contacts_assigned_to ON public.crm_contacts (assigned_to);
CREATE INDEX idx_crm_contacts_status ON public.crm_contacts (status);
CREATE INDEX idx_crm_contacts_created_at ON public.crm_contacts (created_at);

-- Companies
CREATE INDEX idx_crm_companies_email ON public.crm_companies (email);
CREATE INDEX idx_crm_companies_assigned_to ON public.crm_companies (assigned_to);

-- Leads
CREATE INDEX idx_crm_leads_email ON public.crm_leads (email);
CREATE INDEX idx_crm_leads_assigned_to ON public.crm_leads (assigned_to);
CREATE INDEX idx_crm_leads_status ON public.crm_leads (status);
CREATE INDEX idx_crm_leads_source ON public.crm_leads (source);
CREATE INDEX idx_crm_leads_created_at ON public.crm_leads (created_at);

-- Pipeline Stages
CREATE INDEX idx_crm_pipeline_stages_pipeline_id ON public.crm_pipeline_stages (pipeline_id);

-- Opportunities
CREATE INDEX idx_crm_opportunities_stage ON public.crm_opportunities (stage);
CREATE INDEX idx_crm_opportunities_assigned_to ON public.crm_opportunities (assigned_to);
CREATE INDEX idx_crm_opportunities_pipeline_id ON public.crm_opportunities (pipeline_id);
CREATE INDEX idx_crm_opportunities_close_date ON public.crm_opportunities (expected_close_date);
CREATE INDEX idx_crm_opportunities_created_at ON public.crm_opportunities (created_at);

-- Activities
CREATE INDEX idx_crm_activities_related ON public.crm_activities (related_to, related_id);
CREATE INDEX idx_crm_activities_user_id ON public.crm_activities (user_id);
CREATE INDEX idx_crm_activities_due_date ON public.crm_activities (due_date);
CREATE INDEX idx_crm_activities_completed ON public.crm_activities (completed);

-- Notes
CREATE INDEX idx_crm_notes_related ON public.crm_notes (related_to, related_id);

-- Audit Logs
CREATE INDEX idx_crm_audit_logs_created_at ON public.crm_audit_logs (created_at);
CREATE INDEX idx_crm_audit_logs_resource ON public.crm_audit_logs (resource);

-- ==================== TRIGGERS ====================

CREATE TRIGGER update_crm_companies_updated_at BEFORE UPDATE ON public.crm_companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_crm_contacts_updated_at BEFORE UPDATE ON public.crm_contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_crm_pipelines_updated_at BEFORE UPDATE ON public.crm_pipelines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_crm_pipeline_stages_updated_at BEFORE UPDATE ON public.crm_pipeline_stages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_crm_leads_updated_at BEFORE UPDATE ON public.crm_leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_crm_opportunities_updated_at BEFORE UPDATE ON public.crm_opportunities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_crm_activities_updated_at BEFORE UPDATE ON public.crm_activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_crm_notes_updated_at BEFORE UPDATE ON public.crm_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_crm_tags_updated_at BEFORE UPDATE ON public.crm_tags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==================== RLS POLICIES ====================

-- All CRM tables: authenticated users can CRUD
ALTER TABLE public.crm_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_audit_logs ENABLE ROW LEVEL SECURITY;

-- Companies
CREATE POLICY "Authenticated users can view companies" ON public.crm_companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create companies" ON public.crm_companies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update companies" ON public.crm_companies FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete companies" ON public.crm_companies FOR DELETE TO authenticated USING (true);

-- Contacts
CREATE POLICY "Authenticated users can view contacts" ON public.crm_contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create contacts" ON public.crm_contacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update contacts" ON public.crm_contacts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete contacts" ON public.crm_contacts FOR DELETE TO authenticated USING (true);

-- Pipelines
CREATE POLICY "Authenticated users can view pipelines" ON public.crm_pipelines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create pipelines" ON public.crm_pipelines FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update pipelines" ON public.crm_pipelines FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete pipelines" ON public.crm_pipelines FOR DELETE TO authenticated USING (true);

-- Pipeline Stages
CREATE POLICY "Authenticated users can view stages" ON public.crm_pipeline_stages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create stages" ON public.crm_pipeline_stages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update stages" ON public.crm_pipeline_stages FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete stages" ON public.crm_pipeline_stages FOR DELETE TO authenticated USING (true);

-- Leads
CREATE POLICY "Authenticated users can view leads" ON public.crm_leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create leads" ON public.crm_leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update leads" ON public.crm_leads FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete leads" ON public.crm_leads FOR DELETE TO authenticated USING (true);

-- Opportunities
CREATE POLICY "Authenticated users can view opportunities" ON public.crm_opportunities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create opportunities" ON public.crm_opportunities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update opportunities" ON public.crm_opportunities FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete opportunities" ON public.crm_opportunities FOR DELETE TO authenticated USING (true);

-- Activities
CREATE POLICY "Authenticated users can view activities" ON public.crm_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create activities" ON public.crm_activities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update activities" ON public.crm_activities FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete activities" ON public.crm_activities FOR DELETE TO authenticated USING (true);

-- Notes
CREATE POLICY "Authenticated users can view notes" ON public.crm_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create notes" ON public.crm_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update notes" ON public.crm_notes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete notes" ON public.crm_notes FOR DELETE TO authenticated USING (true);

-- Tags
CREATE POLICY "Authenticated users can view tags" ON public.crm_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create tags" ON public.crm_tags FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update tags" ON public.crm_tags FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete tags" ON public.crm_tags FOR DELETE TO authenticated USING (true);

-- Audit Logs (insert-only for authenticated, read for authenticated)
CREATE POLICY "Authenticated users can view audit logs" ON public.crm_audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert audit logs" ON public.crm_audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Insert default pipeline
INSERT INTO public.crm_pipelines (id, name, description, is_default) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Default Sales Pipeline', 'Standard sales pipeline for all opportunities', true);

INSERT INTO public.crm_pipeline_stages (id, pipeline_id, name, "order", probability, color) VALUES
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'New', 1, 10, 'hsl(210, 70%, 55%)'),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Qualified', 2, 30, 'hsl(174, 60%, 45%)'),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'Proposition', 3, 60, 'hsl(38, 90%, 55%)'),
  ('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'Won', 4, 100, 'hsl(142, 60%, 45%)');

-- Insert default tags
INSERT INTO public.crm_tags (name, color) VALUES
  ('VIP', 'hsl(0, 70%, 55%)'),
  ('Enterprise', 'hsl(210, 70%, 55%)'),
  ('Priority', 'hsl(38, 90%, 55%)'),
  ('Hot Lead', 'hsl(0, 85%, 55%)'),
  ('Startup', 'hsl(142, 60%, 45%)'),
  ('New Customer', 'hsl(200, 70%, 55%)');
