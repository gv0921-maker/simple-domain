
-- 1) saved_reports
CREATE TABLE public.saved_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_key text NOT NULL,
  name text NOT NULL,
  description text,
  filters_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  columns_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_by text,
  sort_dir text NOT NULL DEFAULT 'desc' CHECK (sort_dir IN ('asc','desc')),
  is_shared boolean NOT NULL DEFAULT false,
  shared_with_role text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_reports TO authenticated;
GRANT ALL ON public.saved_reports TO service_role;

ALTER TABLE public.saved_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own or shared saved reports"
  ON public.saved_reports FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      is_shared = true
      AND shared_with_role IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role::text = saved_reports.shared_with_role
      )
    )
  );

CREATE POLICY "Users insert own saved reports"
  ON public.saved_reports FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own saved reports"
  ON public.saved_reports FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own saved reports"
  ON public.saved_reports FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER trg_saved_reports_updated_at
  BEFORE UPDATE ON public.saved_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_saved_reports_user ON public.saved_reports(user_id);
CREATE INDEX idx_saved_reports_key ON public.saved_reports(report_key);

-- 2) scheduled_reports
CREATE TABLE public.scheduled_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_report_id uuid NOT NULL REFERENCES public.saved_reports(id) ON DELETE CASCADE,
  schedule text NOT NULL CHECK (schedule IN ('daily','weekly','monthly')),
  schedule_day int,
  schedule_date int,
  delivery_email text NOT NULL,
  last_run_at timestamptz,
  next_run_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduled_reports TO authenticated;
GRANT ALL ON public.scheduled_reports TO service_role;

ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage schedules for their saved reports"
  ON public.scheduled_reports FOR ALL TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.saved_reports sr
      WHERE sr.id = scheduled_reports.saved_report_id
        AND sr.user_id = auth.uid()
    )
  )
  WITH CHECK (created_by = auth.uid());

CREATE INDEX idx_scheduled_reports_saved ON public.scheduled_reports(saved_report_id);
CREATE INDEX idx_scheduled_reports_next ON public.scheduled_reports(next_run_at) WHERE is_active = true;
