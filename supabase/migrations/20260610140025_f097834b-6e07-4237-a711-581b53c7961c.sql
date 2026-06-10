
-- Chat Batch 3: pins, full-text search, deep links, notifications

-- 1. chat_messages extensions
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pinned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pinned_at timestamptz,
  ADD COLUMN IF NOT EXISTS linked_resource_type text,
  ADD COLUMN IF NOT EXISTS linked_resource_id uuid,
  ADD COLUMN IF NOT EXISTS linked_resource_label text,
  ADD COLUMN IF NOT EXISTS body_tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(body, ''))) STORED;

ALTER TABLE public.chat_messages
  DROP CONSTRAINT IF EXISTS chat_messages_linked_resource_type_check;
ALTER TABLE public.chat_messages
  ADD CONSTRAINT chat_messages_linked_resource_type_check
  CHECK (linked_resource_type IS NULL OR linked_resource_type IN
    ('sales_order','quotation','invoice','customer','product','work_order','purchase_order','employee'));

CREATE INDEX IF NOT EXISTS chat_messages_body_tsv_idx ON public.chat_messages USING gin(body_tsv);
CREATE INDEX IF NOT EXISTS chat_messages_pinned_idx ON public.chat_messages(channel_id) WHERE is_pinned;

-- Policy: allow pin/unpin updates by channel admin/owner or author
DROP POLICY IF EXISTS "chat_messages: pin by admin or author" ON public.chat_messages;
CREATE POLICY "chat_messages: pin by admin or author"
ON public.chat_messages FOR UPDATE TO authenticated
USING (
  public.is_chat_channel_admin(channel_id, auth.uid())
  OR user_id = auth.uid()
)
WITH CHECK (
  public.is_chat_channel_admin(channel_id, auth.uid())
  OR user_id = auth.uid()
);

-- 2. chat_notifications table
CREATE TABLE IF NOT EXISTS public.chat_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('mention','message','thread_reply','pin','added_to_channel')),
  channel_id uuid REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  message_id uuid REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  body_preview text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.chat_notifications TO authenticated;
GRANT ALL ON public.chat_notifications TO service_role;

ALTER TABLE public.chat_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_notifications: own select" ON public.chat_notifications;
CREATE POLICY "chat_notifications: own select"
ON public.chat_notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "chat_notifications: own update" ON public.chat_notifications;
CREATE POLICY "chat_notifications: own update"
ON public.chat_notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS chat_notifications_user_unread_idx
  ON public.chat_notifications(user_id, is_read, created_at DESC);

-- 3. Realtime
DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_notifications';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Triggers

-- mention trigger
CREATE OR REPLACE FUNCTION public.chat_notify_on_mention()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_msg public.chat_messages%ROWTYPE;
BEGIN
  SELECT * INTO v_msg FROM public.chat_messages WHERE id = NEW.message_id;
  IF v_msg.user_id = NEW.mentioned_user_id THEN RETURN NEW; END IF;
  INSERT INTO public.chat_notifications (user_id, type, channel_id, message_id, actor_user_id, body_preview)
  VALUES (NEW.mentioned_user_id, 'mention', v_msg.channel_id, v_msg.id, v_msg.user_id, left(coalesce(v_msg.body,''), 200));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS chat_mentions_notify ON public.chat_message_mentions;
CREATE TRIGGER chat_mentions_notify AFTER INSERT ON public.chat_message_mentions
FOR EACH ROW EXECUTE FUNCTION public.chat_notify_on_mention();

-- thread reply trigger
CREATE OR REPLACE FUNCTION public.chat_notify_on_thread_reply()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_parent_author uuid;
BEGIN
  IF NEW.parent_message_id IS NULL THEN RETURN NEW; END IF;
  SELECT user_id INTO v_parent_author FROM public.chat_messages WHERE id = NEW.parent_message_id;
  IF v_parent_author IS NULL OR v_parent_author = NEW.user_id THEN RETURN NEW; END IF;
  INSERT INTO public.chat_notifications (user_id, type, channel_id, message_id, actor_user_id, body_preview)
  VALUES (v_parent_author, 'thread_reply', NEW.channel_id, NEW.id, NEW.user_id, left(coalesce(NEW.body,''), 200));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS chat_thread_reply_notify ON public.chat_messages;
CREATE TRIGGER chat_thread_reply_notify AFTER INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.chat_notify_on_thread_reply();

-- pin trigger
CREATE OR REPLACE FUNCTION public.chat_notify_on_pin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_pinned = true AND (OLD.is_pinned IS DISTINCT FROM true) THEN
    INSERT INTO public.chat_notifications (user_id, type, channel_id, message_id, actor_user_id, body_preview)
    SELECT m.user_id, 'pin', NEW.channel_id, NEW.id, NEW.pinned_by, left(coalesce(NEW.body,''), 200)
    FROM public.chat_channel_members m
    WHERE m.channel_id = NEW.channel_id AND m.user_id <> COALESCE(NEW.pinned_by, '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS chat_pin_notify ON public.chat_messages;
CREATE TRIGGER chat_pin_notify AFTER UPDATE OF is_pinned ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.chat_notify_on_pin();

-- added_to_channel trigger
CREATE OR REPLACE FUNCTION public.chat_notify_on_member_added()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_actor uuid;
BEGIN
  v_actor := auth.uid();
  IF v_actor IS NOT NULL AND v_actor = NEW.user_id THEN RETURN NEW; END IF;
  INSERT INTO public.chat_notifications (user_id, type, channel_id, actor_user_id, body_preview)
  VALUES (NEW.user_id, 'added_to_channel', NEW.channel_id, v_actor, null);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS chat_member_added_notify ON public.chat_channel_members;
CREATE TRIGGER chat_member_added_notify AFTER INSERT ON public.chat_channel_members
FOR EACH ROW EXECUTE FUNCTION public.chat_notify_on_member_added();
