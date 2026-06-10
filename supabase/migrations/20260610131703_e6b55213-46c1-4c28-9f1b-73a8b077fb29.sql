
-- 1. Extend chat_messages for threading
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS parent_message_id uuid REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS thread_reply_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_thread_reply_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_chat_messages_parent ON public.chat_messages(parent_message_id);

-- 2. Attachments
CREATE TABLE public.chat_message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  file_type text NOT NULL CHECK (file_type IN ('image','file','audio','video')),
  mime_type text,
  thumbnail_url text,
  width integer,
  height integer,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_chat_attachments_message ON public.chat_message_attachments(message_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_message_attachments TO authenticated;
GRANT ALL ON public.chat_message_attachments TO service_role;
ALTER TABLE public.chat_message_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attachments visible to channel members"
ON public.chat_message_attachments FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.chat_messages m
  WHERE m.id = chat_message_attachments.message_id
    AND public.is_chat_channel_member(m.channel_id, auth.uid())
));

CREATE POLICY "Authors can attach"
ON public.chat_message_attachments FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.chat_messages m
  WHERE m.id = chat_message_attachments.message_id
    AND m.user_id = auth.uid()
));

CREATE POLICY "Authors or admins can delete attachments"
ON public.chat_message_attachments FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.chat_messages m
  WHERE m.id = chat_message_attachments.message_id
    AND (m.user_id = auth.uid() OR public.is_chat_channel_admin(m.channel_id, auth.uid()))
));

-- 3. Mentions
CREATE TABLE public.chat_message_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  mentioned_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, mentioned_user_id)
);
CREATE INDEX idx_chat_mentions_user ON public.chat_message_mentions(mentioned_user_id, is_read);
CREATE INDEX idx_chat_mentions_message ON public.chat_message_mentions(message_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_message_mentions TO authenticated;
GRANT ALL ON public.chat_message_mentions TO service_role;
ALTER TABLE public.chat_message_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentions visible to mentioned user or members"
ON public.chat_message_mentions FOR SELECT TO authenticated
USING (
  mentioned_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.chat_messages m
    WHERE m.id = chat_message_mentions.message_id
      AND public.is_chat_channel_member(m.channel_id, auth.uid())
  )
);

CREATE POLICY "Message authors can create mentions"
ON public.chat_message_mentions FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.chat_messages m
  WHERE m.id = chat_message_mentions.message_id
    AND m.user_id = auth.uid()
));

CREATE POLICY "Mentioned user can mark read"
ON public.chat_message_mentions FOR UPDATE TO authenticated
USING (mentioned_user_id = auth.uid())
WITH CHECK (mentioned_user_id = auth.uid());

-- 4. Read receipts
CREATE TABLE public.chat_message_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id)
);
CREATE INDEX idx_chat_reads_message ON public.chat_message_reads(message_id);
CREATE INDEX idx_chat_reads_user ON public.chat_message_reads(user_id);

GRANT SELECT, INSERT, DELETE ON public.chat_message_reads TO authenticated;
GRANT ALL ON public.chat_message_reads TO service_role;
ALTER TABLE public.chat_message_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reads visible to channel members"
ON public.chat_message_reads FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.chat_messages m
  WHERE m.id = chat_message_reads.message_id
    AND public.is_chat_channel_member(m.channel_id, auth.uid())
));

CREATE POLICY "Users insert own read receipts"
ON public.chat_message_reads FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.chat_messages m
    WHERE m.id = chat_message_reads.message_id
      AND public.is_chat_channel_member(m.channel_id, auth.uid())
  )
);

-- 5. Thread reply count trigger
CREATE OR REPLACE FUNCTION public.chat_messages_update_thread_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_message_id IS NOT NULL THEN
    UPDATE public.chat_messages
       SET thread_reply_count = thread_reply_count + 1,
           last_thread_reply_at = NEW.created_at
     WHERE id = NEW.parent_message_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_message_id IS NOT NULL THEN
    UPDATE public.chat_messages
       SET thread_reply_count = GREATEST(0, thread_reply_count - 1)
     WHERE id = OLD.parent_message_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_chat_messages_thread_count ON public.chat_messages;
CREATE TRIGGER trg_chat_messages_thread_count
AFTER INSERT OR DELETE ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.chat_messages_update_thread_count();

-- 6. Realtime
ALTER TABLE public.chat_message_attachments REPLICA IDENTITY FULL;
ALTER TABLE public.chat_message_mentions REPLICA IDENTITY FULL;
ALTER TABLE public.chat_message_reads REPLICA IDENTITY FULL;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_message_attachments;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_message_mentions;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_message_reads;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 7. Storage policies for chat-attachments bucket (bucket must be created manually)
CREATE POLICY "Chat attachments readable by channel members"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND public.is_chat_channel_member(
    NULLIF(split_part(name, '/', 1), '')::uuid,
    auth.uid()
  )
);

CREATE POLICY "Authenticated users upload chat attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND public.is_chat_channel_member(
    NULLIF(split_part(name, '/', 1), '')::uuid,
    auth.uid()
  )
  AND owner = auth.uid()
);

CREATE POLICY "Owners or channel admins delete chat attachments"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND (
    owner = auth.uid()
    OR public.is_chat_channel_admin(
      NULLIF(split_part(name, '/', 1), '')::uuid,
      auth.uid()
    )
  )
);
