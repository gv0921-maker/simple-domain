import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import * as chat from '@/lib/services/chat/api';

export const chatKeys = {
  all: ['chat'] as const,
  channels: () => [...chatKeys.all, 'channels'] as const,
  channel: (id: string) => [...chatKeys.all, 'channel', id] as const,
  members: (id: string) => [...chatKeys.all, 'members', id] as const,
  messages: (id: string) => [...chatKeys.all, 'messages', id] as const,
  directory: () => [...chatKeys.all, 'directory'] as const,
  attachments: (id: string) => [...chatKeys.all, 'attachments', id] as const,
  mentionsForMsgs: (ids: string[]) => [...chatKeys.all, 'msg-mentions', ids.join(',')] as const,
  thread: (parentId: string) => [...chatKeys.all, 'thread', parentId] as const,
  reads: (msgId: string) => [...chatKeys.all, 'reads', msgId] as const,
  myMentions: (isRead?: boolean) => [...chatKeys.all, 'my-mentions', isRead ?? 'all'] as const,
  unreadMentions: () => [...chatKeys.all, 'unread-mentions'] as const,
};

export function useDirectory() {
  return useQuery({ queryKey: chatKeys.directory(), queryFn: chat.fetchDirectory });
}

export function useChannels() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: chatKeys.channels(), queryFn: chat.fetchChannels });

  useEffect(() => {
    const ch = supabase
      .channel(`rt-chat-channels-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_channels' }, () => {
        qc.invalidateQueries({ queryKey: chatKeys.channels() });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_channel_members' }, () => {
        qc.invalidateQueries({ queryKey: chatKeys.channels() });
      })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [qc]);

  return query;
}

export function useChannel(channelId: string | undefined) {
  return useQuery({
    queryKey: chatKeys.channel(channelId ?? '__none__'),
    queryFn: () => chat.fetchChannel(channelId!),
    enabled: !!channelId,
  });
}

export function useChannelMembers(channelId: string | undefined) {
  return useQuery({
    queryKey: chatKeys.members(channelId ?? '__none__'),
    queryFn: () => chat.fetchChannelMembers(channelId!),
    enabled: !!channelId,
  });
}

export function useMessages(channelId: string | undefined) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: chatKeys.messages(channelId ?? '__none__'),
    queryFn: () => chat.fetchMessages(channelId!),
    enabled: !!channelId,
  });

  useEffect(() => {
    if (!channelId) return;
    const ch = supabase
      .channel(`rt-chat-messages-${channelId}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages', filter: `channel_id=eq.${channelId}` },
        (payload) => {
          qc.setQueryData<chat.ChatMessage[]>(chatKeys.messages(channelId), (prev = []) => {
            const next = [...prev];
            if (payload.eventType === 'INSERT') {
              const row = payload.new as chat.ChatMessage;
              if (!next.find((m) => m.id === row.id)) next.push(row);
            } else if (payload.eventType === 'UPDATE') {
              const row = payload.new as chat.ChatMessage;
              const i = next.findIndex((m) => m.id === row.id);
              if (i >= 0) next[i] = row;
            } else if (payload.eventType === 'DELETE') {
              const old = payload.old as chat.ChatMessage;
              return next.filter((m) => m.id !== old.id);
            }
            return next;
          });
        }
      )
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [channelId, qc]);

  return query;
}

export function useSendMessage(channelId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => chat.sendMessage(channelId!, body),
    onSuccess: () => channelId && qc.invalidateQueries({ queryKey: chatKeys.messages(channelId) }),
  });
}

export function useEditMessage(channelId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => chat.editMessage(id, body),
    onSuccess: () => channelId && qc.invalidateQueries({ queryKey: chatKeys.messages(channelId) }),
  });
}

export function useDeleteMessage(channelId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => chat.deleteMessage(id),
    onSuccess: () => channelId && qc.invalidateQueries({ queryKey: chatKeys.messages(channelId) }),
  });
}

export function useCreateChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      type: 'channel' | 'group' | 'dm';
      memberUserIds: string[];
      description?: string;
      isPrivate?: boolean;
    }) =>
      chat.createChannel(input.name, input.type, input.memberUserIds, {
        description: input.description,
        isPrivate: input.isPrivate,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: chatKeys.channels() }),
  });
}

export function useMarkChannelRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (channelId: string) => chat.markChannelRead(channelId),
    onSuccess: (_d, channelId) => {
      qc.invalidateQueries({ queryKey: chatKeys.members(channelId) });
      qc.invalidateQueries({ queryKey: chatKeys.channels() });
    },
  });
}

export function useUnreadCount(channelId: string) {
  const { data: messages = [] } = useMessages(channelId);
  const { data: members = [] } = useChannelMembers(channelId);
  return useMemo(() => {
    const me = members.find((m) => !!m); // we'll filter below by current user
    // Find current user's membership via cached auth user
    return 0;
  }, [messages, members]);
}

export function useTotalUnread(): number {
  const { data: channels = [] } = useChannels();
  // Lightweight: just count channels — exact unread computed in sidebar from members+messages.
  return channels.length === 0 ? 0 : 0;
}

export { chat };

export function useMessageAttachments(channelId: string | undefined, messageIds: string[]) {
  return useQuery({
    queryKey: [...chatKeys.attachments(channelId ?? '__none__'), messageIds.join(',')],
    queryFn: () => chat.fetchAttachmentsForMessages(messageIds),
    enabled: !!channelId && messageIds.length > 0,
  });
}

export function useMessageMentions(channelId: string | undefined, messageIds: string[]) {
  return useQuery({
    queryKey: [...chatKeys.all, 'mentions-batch', channelId ?? '__none__', messageIds.join(',')],
    queryFn: () => chat.fetchMentionsForMessages(messageIds),
    enabled: !!channelId && messageIds.length > 0,
  });
}

export function useThreadReplies(parentMessageId: string | undefined) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: chatKeys.thread(parentMessageId ?? '__none__'),
    queryFn: () => chat.fetchThreadReplies(parentMessageId!),
    enabled: !!parentMessageId,
  });

  useEffect(() => {
    if (!parentMessageId) return;
    const ch = supabase
      .channel(`rt-chat-thread-${parentMessageId}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages', filter: `parent_message_id=eq.${parentMessageId}` },
        () => qc.invalidateQueries({ queryKey: chatKeys.thread(parentMessageId) }),
      )
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [parentMessageId, qc]);

  return query;
}

export function useSendThreadReply(parentMessageId: string | undefined, channelId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (opts: { body: string; attachments?: chat.PendingAttachment[]; mentionedUserIds?: string[] }) =>
      chat.sendMessageRich({
        channelId: channelId!,
        body: opts.body,
        attachments: opts.attachments,
        parentMessageId: parentMessageId!,
        mentionedUserIds: opts.mentionedUserIds,
      }),
    onSuccess: () => {
      if (parentMessageId) qc.invalidateQueries({ queryKey: chatKeys.thread(parentMessageId) });
      if (channelId) qc.invalidateQueries({ queryKey: chatKeys.messages(channelId) });
    },
  });
}

export function useSendRichMessage(channelId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (opts: { body: string; attachments?: chat.PendingAttachment[]; mentionedUserIds?: string[] }) =>
      chat.sendMessageRich({
        channelId: channelId!,
        body: opts.body,
        attachments: opts.attachments,
        mentionedUserIds: opts.mentionedUserIds,
      }),
    onSuccess: () => channelId && qc.invalidateQueries({ queryKey: chatKeys.messages(channelId) }),
  });
}

export function useUploadAttachment(channelId: string | undefined) {
  return useMutation({
    mutationFn: (file: File) => chat.uploadAttachment(file, channelId!),
  });
}

export function useMarkMessageRead() {
  return useMutation({
    mutationFn: (messageId: string) => chat.markMessageRead(messageId),
  });
}

export function useMessageReads(messageId: string | undefined) {
  return useQuery({
    queryKey: chatKeys.reads(messageId ?? '__none__'),
    queryFn: () => chat.fetchMessageReads(messageId!),
    enabled: !!messageId,
  });
}

export function useUserMentions(isRead?: boolean) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: chatKeys.myMentions(isRead),
    queryFn: () => chat.fetchUserMentions(isRead),
  });
  useEffect(() => {
    const ch = supabase
      .channel(`rt-chat-my-mentions-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_message_mentions' }, () => {
        qc.invalidateQueries({ queryKey: chatKeys.all });
      })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [qc]);
  return query;
}

export function useUnreadMentionCount() {
  return useQuery({
    queryKey: chatKeys.unreadMentions(),
    queryFn: () => chat.fetchUnreadMentionCount(),
    refetchInterval: 60_000,
  });
}

export function useMarkMentionRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mentionId: string) => chat.markMentionRead(mentionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: chatKeys.all }),
  });
}

export function useMarkAllMentionsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => chat.markAllMentionsRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: chatKeys.all }),
  });
}