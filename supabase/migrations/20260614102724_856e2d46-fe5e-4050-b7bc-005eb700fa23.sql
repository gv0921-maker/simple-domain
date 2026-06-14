
CREATE OR REPLACE FUNCTION public.get_activity_log_with_users(
  p_record_type text,
  p_record_id uuid,
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  record_type text,
  record_id uuid,
  action_type text,
  field_name text,
  old_value text,
  new_value text,
  note_text text,
  changed_by uuid,
  changed_by_name text,
  changed_by_email text,
  changed_at timestamptz,
  is_deleted boolean,
  deleted_by uuid,
  deleted_at timestamptz,
  total_count bigint
)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  WITH base AS (
    SELECT al.*
    FROM public.activity_log al
    WHERE al.record_type = p_record_type
      AND al.record_id = p_record_id
      AND al.is_deleted = false
  ),
  counted AS (SELECT count(*)::bigint AS c FROM base)
  SELECT
    al.id, al.record_type, al.record_id, al.action_type,
    al.field_name,
    CASE
      WHEN al.field_name = 'stage_id' THEN COALESCE(s_old.name, al.old_value)
      ELSE al.old_value
    END AS old_value,
    CASE
      WHEN al.field_name = 'stage_id' THEN COALESCE(s_new.name, al.new_value)
      ELSE al.new_value
    END AS new_value,
    al.note_text,
    al.changed_by,
    COALESCE(
      NULLIF(TRIM(e.full_name), ''),
      SPLIT_PART(au.email, '@', 1),
      'Unknown user'
    ) AS changed_by_name,
    au.email AS changed_by_email,
    al.changed_at, al.is_deleted, al.deleted_by, al.deleted_at,
    (SELECT c FROM counted) AS total_count
  FROM base al
  LEFT JOIN auth.users au ON au.id = al.changed_by
  LEFT JOIN public.employees e ON e.auth_user_id = al.changed_by
  LEFT JOIN public.crm_pipeline_stages s_old
    ON al.field_name = 'stage_id'
   AND al.old_value ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
   AND s_old.id = al.old_value::uuid
  LEFT JOIN public.crm_pipeline_stages s_new
    ON al.field_name = 'stage_id'
   AND al.new_value ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
   AND s_new.id = al.new_value::uuid
  ORDER BY al.changed_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

GRANT EXECUTE ON FUNCTION public.get_activity_log_with_users(text, uuid, int, int) TO authenticated;

CREATE OR REPLACE FUNCTION public.log_row_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  rid uuid;
  id_text text;
  k text;
  old_v text;
  new_v text;
  skip_fields text[] := ARRAY['updated_at','created_at','id'];
BEGIN
  IF uid IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_TABLE_NAME = 'crm_opportunities' THEN
    skip_fields := skip_fields || ARRAY['stage'];
  END IF;

  IF TG_OP = 'DELETE' THEN
    id_text := (to_jsonb(OLD) ->> 'id');
  ELSE
    id_text := (to_jsonb(NEW) ->> 'id');
  END IF;

  BEGIN
    rid := id_text::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN COALESCE(NEW, OLD);
  END;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_log (record_type, record_id, action_type, changed_by)
    VALUES (TG_TABLE_NAME, rid, 'created', uid);
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.activity_log (record_type, record_id, action_type, changed_by)
    VALUES (TG_TABLE_NAME, rid, 'deleted', uid);
  ELSIF TG_OP = 'UPDATE' THEN
    FOR k IN SELECT key FROM jsonb_each(to_jsonb(NEW))
    LOOP
      IF k = ANY(skip_fields) THEN CONTINUE; END IF;
      old_v := (to_jsonb(OLD) ->> k);
      new_v := (to_jsonb(NEW) ->> k);
      IF old_v IS DISTINCT FROM new_v THEN
        INSERT INTO public.activity_log
          (record_type, record_id, action_type, field_name, old_value, new_value, changed_by)
        VALUES (TG_TABLE_NAME, rid, 'field_change', k, old_v, new_v, uid);
      END IF;
    END LOOP;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;
