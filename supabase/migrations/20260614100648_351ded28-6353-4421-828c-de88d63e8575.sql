CREATE OR REPLACE FUNCTION public.log_row_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  rid uuid;
  k text;
  old_v text;
  new_v text;
  id_text text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    id_text := to_jsonb(OLD) ->> 'id';
  ELSE
    id_text := to_jsonb(NEW) ->> 'id';
  END IF;

  BEGIN
    rid := id_text::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN COALESCE(NEW, OLD);
  END;

  IF uid IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_log(record_type, record_id, action_type, changed_by)
    VALUES (TG_TABLE_NAME, rid, 'created', uid);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    FOR k IN SELECT jsonb_object_keys(to_jsonb(NEW)) LOOP
      IF k IN ('updated_at', 'created_at', 'id') THEN CONTINUE; END IF;
      old_v := to_jsonb(OLD) ->> k;
      new_v := to_jsonb(NEW) ->> k;
      IF old_v IS DISTINCT FROM new_v THEN
        INSERT INTO public.activity_log(record_type, record_id, action_type, field_name, old_value, new_value, changed_by)
        VALUES (TG_TABLE_NAME, rid, 'field_change', k, old_v, new_v, uid);
      END IF;
    END LOOP;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.activity_log(record_type, record_id, action_type, changed_by)
    VALUES (TG_TABLE_NAME, rid, 'deleted', uid);
    RETURN OLD;
  END IF;

  RETURN COALESCE(NEW, OLD);
END $$;