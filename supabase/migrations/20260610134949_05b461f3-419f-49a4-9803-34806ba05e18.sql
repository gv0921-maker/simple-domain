DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='chat attachments: members can read'
  ) THEN
    CREATE POLICY "chat attachments: members can read"
    ON storage.objects FOR SELECT TO authenticated
    USING (
      bucket_id = 'chat-attachments'
      AND EXISTS (
        SELECT 1 FROM public.chat_channel_members ccm
        WHERE ccm.user_id = auth.uid()
          AND ccm.channel_id::text = (storage.foldername(name))[1]
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='chat attachments: members can upload'
  ) THEN
    CREATE POLICY "chat attachments: members can upload"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'chat-attachments'
      AND EXISTS (
        SELECT 1 FROM public.chat_channel_members ccm
        WHERE ccm.user_id = auth.uid()
          AND ccm.channel_id::text = (storage.foldername(name))[1]
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='chat attachments: authors can delete'
  ) THEN
    CREATE POLICY "chat attachments: authors can delete"
    ON storage.objects FOR DELETE TO authenticated
    USING (
      bucket_id = 'chat-attachments'
      AND owner = auth.uid()
    );
  END IF;
END $$;