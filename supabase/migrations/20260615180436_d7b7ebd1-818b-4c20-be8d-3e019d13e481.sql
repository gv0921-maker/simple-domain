CREATE TABLE public.import_export_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module text NOT NULL,
  job_type text NOT NULL CHECK (job_type IN ('import','export')),
  file_name text,
  total_rows integer NOT NULL DEFAULT 0,
  succeeded_rows integer NOT NULL DEFAULT 0,
  failed_rows integer NOT NULL DEFAULT 0,
  error_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

GRANT SELECT, INSERT, UPDATE ON public.import_export_jobs TO authenticated;
GRANT ALL ON public.import_export_jobs TO service_role;

ALTER TABLE public.import_export_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own jobs"
  ON public.import_export_jobs FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users insert own jobs"
  ON public.import_export_jobs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own jobs"
  ON public.import_export_jobs FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Service role full access on jobs"
  ON public.import_export_jobs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX idx_iej_user_module ON public.import_export_jobs(user_id, module, created_at DESC);
CREATE INDEX idx_iej_module ON public.import_export_jobs(module, created_at DESC);