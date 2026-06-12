-- Universal activity log table
CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type text NOT NULL,
  record_id uuid NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('field_change','status_change','manual_note','created','deleted')),
  field_name text,
  old_value text,
  new_value text,
  note_text text,
  changed_by uuid NOT NULL REFERENCES auth.users(id),
  changed_at timestamptz NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_by uuid REFERENCES auth.users(id),
  deleted_at timestamptz
);

CREATE INDEX idx_activity_log_record ON public.activity_log (record_type, record_id, changed_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read activity log"
  ON public.activity_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert activity log"
  ON public.activity_log FOR INSERT
  TO authenticated
  WITH CHECK (changed_by = auth.uid());

-- Only super_admin can update (for soft deletes)
CREATE POLICY "Super admin can soft delete"
  ON public.activity_log FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

-- No DELETE policy = no hard deletes allowed