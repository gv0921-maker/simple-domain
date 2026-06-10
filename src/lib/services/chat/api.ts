import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type ChatChannel = Database['public']['Tables']['chat_channels']['Row'];
export type ChatChannelInsert = Database['public']['Tables']['chat_channels']['Insert'];
export type ChatChannelMember = Database['public']['Tables']['chat_channel_members']['Row'];
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
export type ChatAttachment = Database['public']['Tables']['chat_message_attachments']['Row'];
export type ChatMention = Database['public']['Tables']['chat_message_mentions']['Row'];
export type ChatRead = Database['public']['Tables']['chat_message_reads']['Row'];

export const CHAT_BUCKET = 'chat-attachments';
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

export interface PendingAttachment {
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: 'image' | 'file' | 'audio' | 'video';
  mime_type: string;
  thumbnail_url?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface DirectoryUser {
  user_id: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
}

export async function fetchChannels(): Promise<ChatChannel[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: memberRows, error: mErr } = await supabase
    .from('chat_channel_members')
    .select('channel_id')
    .eq('user_id', user.id);
  if (mErr) throw mErr;
  const ids = (memberRows ?? []).map((r) => r.channel_id);
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from('chat_channels')
    .select('*')
    .in('id', ids)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchChannel(channelId: string): Promise<ChatChannel | null> {
  const { data, error } = await supabase
    .from('chat_channels').select('*').eq('id', channelId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchChannelMembers(channelId: string): Promise<ChatChannelMember[]> {
  const { data, error } = await supabase
    .from('chat_channel_members').select('*').eq('channel_id', channelId);
  if (error) throw error;
  return data ?? [];
}

export async function fetchMessages(
  channelId: string,
  opts: { limit?: number; before?: string } = {}
): Promise<ChatMessage[]> {
  const limit = opts.limit ?? 50;
  let q = supabase
    .from('chat_messages')
    .select('*')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (opts.before) q = q.lt('created_at', opts.before);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).reverse();
}

export async function sendMessage(channelId: string, body: string): Promise<ChatMessage> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ channel_id: channelId, user_id: user.id, body, message_type: 'text' })
    .select().single();
  if (error) throw error;
  return data;
}

export async function sendMessageRich(opts: {
  channelId: string;
  body: string;
  attachments?: PendingAttachment[];
  parentMessageId?: string | null;
  mentionedUserIds?: string[];
}): Promise<ChatMessage> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');
  const { data: msg, error } = await supabase
    .from('chat_messages')
    .insert({
      channel_id: opts.channelId,
      user_id: user.id,
      body: opts.body,
      message_type: 'text',
      parent_message_id: opts.parentMessageId ?? null,
    })
    .select().single();
  if (error) throw error;

  if (opts.attachments && opts.attachments.length > 0) {
    const rows = opts.attachments.map((a) => ({ ...a, message_id: msg.id }));
    const { error: aErr } = await supabase.from('chat_message_attachments').insert(rows);
    if (aErr) throw aErr;
  }

  const uniqueMentions = Array.from(new Set(opts.mentionedUserIds ?? []));
  if (uniqueMentions.length > 0) {
    const mrows = uniqueMentions.map((uid) => ({
      message_id: msg.id,
      mentioned_user_id: uid,
    }));
    const { error: mErr } = await supabase.from('chat_message_mentions').insert(mrows);
    if (mErr) throw mErr;
  }

  return msg;
}

export async function uploadAttachment(
  file: File,
  channelId: string,
): Promise<PendingAttachment> {
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error(`File "${file.name}" exceeds 25 MB limit`);
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const stamp = Date.now();
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${channelId}/${user.id}/${stamp}-${safe}`;

  const { error: upErr } = await supabase.storage
    .from(CHAT_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });
  if (upErr) throw upErr;

  const { data: signed } = await supabase.storage
    .from(CHAT_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 7);

  const mime = file.type || 'application/octet-stream';
  const file_type: PendingAttachment['file_type'] =
    mime.startsWith('image/') ? 'image'
    : mime.startsWith('audio/') ? 'audio'
    : mime.startsWith('video/') ? 'video' : 'file';

  let width: number | null = null;
  let height: number | null = null;
  if (file_type === 'image' && typeof window !== 'undefined') {
    try {
      const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });
      width = dims.w; height = dims.h;
    } catch { /* ignore */ }
  }

  return {
    file_url: signed?.signedUrl ?? path,
    file_name: file.name,
    file_size: file.size,
    file_type,
    mime_type: mime,
    thumbnail_url: file_type === 'image' ? (signed?.signedUrl ?? path) : null,
    width,
    height,
  };
}

export async function fetchAttachmentsForMessages(
  messageIds: string[],
): Promise<Record<string, ChatAttachment[]>> {
  if (messageIds.length === 0) return {};
  const { data, error } = await supabase
    .from('chat_message_attachments')
    .select('*')
    .in('message_id', messageIds);
  if (error) throw error;
  const out: Record<string, ChatAttachment[]> = {};
  for (const a of data ?? []) {
    (out[a.message_id] ||= []).push(a);
  }
  return out;
}

export async function fetchMentionsForMessages(
  messageIds: string[],
): Promise<Record<string, ChatMention[]>> {
  if (messageIds.length === 0) return {};
  const { data, error } = await supabase
    .from('chat_message_mentions')
    .select('*')
    .in('message_id', messageIds);
  if (error) throw error;
  const out: Record<string, ChatMention[]> = {};
  for (const m of data ?? []) (out[m.message_id] ||= []).push(m);
  return out;
}

export async function fetchThreadReplies(parentMessageId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('parent_message_id', parentMessageId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function markMessageRead(messageId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from('chat_message_reads')
    .upsert(
      { message_id: messageId, user_id: user.id, read_at: new Date().toISOString() },
      { onConflict: 'message_id,user_id', ignoreDuplicates: true },
    );
}

export async function fetchMessageReads(messageId: string): Promise<ChatRead[]> {
  const { data, error } = await supabase
    .from('chat_message_reads')
    .select('*')
    .eq('message_id', messageId);
  if (error) throw error;
  return data ?? [];
}

export async function fetchUserMentions(
  isRead?: boolean,
): Promise<Array<ChatMention & { message: ChatMessage | null; channel: ChatChannel | null }>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  let q = supabase
    .from('chat_message_mentions')
    .select('*, message:chat_messages(*, channel:chat_channels(*))')
    .eq('mentioned_user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);
  if (typeof isRead === 'boolean') q = q.eq('is_read', isRead);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    ...row,
    channel: row.message?.channel ?? null,
    message: row.message ? { ...row.message, channel: undefined } : null,
  }));
}

export async function markMentionRead(mentionId: string): Promise<void> {
  const { error } = await supabase
    .from('chat_message_mentions')
    .update({ is_read: true })
    .eq('id', mentionId);
  if (error) throw error;
}

export async function markAllMentionsRead(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase
    .from('chat_message_mentions')
    .update({ is_read: true })
    .eq('mentioned_user_id', user.id)
    .eq('is_read', false);
  if (error) throw error;
}

export async function fetchUnreadMentionCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { count, error } = await supabase
    .from('chat_message_mentions')
    .select('id', { count: 'exact', head: true })
    .eq('mentioned_user_id', user.id)
    .eq('is_read', false);
  if (error) throw error;
  return count ?? 0;
}

export interface MentionToken { username: string; user_id: string }

export function extractMentions(
  body: string,
  directory: Array<{ user_id: string; name: string }>,
): string[] {
  const found = new Set<string>();
  const re = /@([A-Za-z0-9._-]+(?:\s+[A-Za-z0-9._-]+)?)/g;
  let match: RegExpExecArray | null;
  const norm = (s: string) => s.trim().toLowerCase();
  while ((match = re.exec(body))) {
    const candidate = norm(match[1]);
    const hit = directory.find((d) => norm(d.name).startsWith(candidate)
      || norm(d.name.split(' ')[0]) === norm(match![1].split(/\s+/)[0]));
    if (hit) found.add(hit.user_id);
  }
  return Array.from(found);
}

export async function editMessage(messageId: string, newBody: string): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from('chat_messages')
    .update({ body: newBody, is_edited: true, edited_at: new Date().toISOString() })
    .eq('id', messageId)
    .select().single();
  if (error) throw error;
  return data;
}

export async function deleteMessage(messageId: string): Promise<void> {
  const { error } = await supabase
    .from('chat_messages')
    .update({ is_deleted: true, deleted_at: new Date().toISOString(), body: '' })
    .eq('id', messageId);
  if (error) throw error;
}

export async function createChannel(
  name: string,
  type: 'channel' | 'group' | 'dm',
  memberUserIds: string[],
  opts: { description?: string; isPrivate?: boolean } = {}
): Promise<ChatChannel> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');
  const { data: channel, error } = await supabase
    .from('chat_channels')
    .insert({
      name,
      description: opts.description ?? null,
      type,
      is_private: opts.isPrivate ?? type === 'dm',
      created_by: user.id,
    })
    .select().single();
  if (error) throw error;

  const uniqueIds = Array.from(new Set([user.id, ...memberUserIds]));
  const rows = uniqueIds.map((uid) => ({
    channel_id: channel.id,
    user_id: uid,
    role: uid === user.id ? 'owner' : 'member',
  }));
  const { error: mErr } = await supabase.from('chat_channel_members').insert(rows);
  if (mErr) throw mErr;
  return channel;
}

export async function addChannelMember(channelId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('chat_channel_members')
    .insert({ channel_id: channelId, user_id: userId, role: 'member' });
  if (error) throw error;
}

export async function removeChannelMember(channelId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('chat_channel_members')
    .delete().eq('channel_id', channelId).eq('user_id', userId);
  if (error) throw error;
}

export async function findOrCreateDM(otherUserId: string): Promise<ChatChannel> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  // Find existing DM with both users
  const { data: myDms, error: e1 } = await supabase
    .from('chat_channel_members')
    .select('channel_id, chat_channels!inner(id,type)')
    .eq('user_id', user.id);
  if (e1) throw e1;

  const dmChannelIds = (myDms ?? [])
    .filter((r: any) => r.chat_channels?.type === 'dm')
    .map((r) => r.channel_id);

  if (dmChannelIds.length > 0) {
    const { data: matches, error: e2 } = await supabase
      .from('chat_channel_members')
      .select('channel_id')
      .in('channel_id', dmChannelIds)
      .eq('user_id', otherUserId);
    if (e2) throw e2;
    if (matches && matches.length > 0) {
      const found = await fetchChannel(matches[0].channel_id);
      if (found) return found;
    }
  }

  const other = await fetchDirectoryUser(otherUserId);
  const name = other?.name ?? 'Direct Message';
  return createChannel(name, 'dm', [otherUserId], { isPrivate: true });
}

export async function markChannelRead(channelId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase
    .from('chat_channel_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('channel_id', channelId)
    .eq('user_id', user.id);
  if (error) throw error;
}

export async function fetchDirectory(): Promise<DirectoryUser[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('user_id, full_name, display_name, email')
    .not('user_id', 'is', null);
  if (error) throw error;
  return (data ?? []).map((e: any) => ({
    user_id: e.user_id,
    name: e.display_name || e.full_name || e.email || 'User',
    email: e.email ?? null,
    avatar_url: null,
  }));
}

export async function fetchDirectoryUser(userId: string): Promise<DirectoryUser | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('user_id, full_name, display_name, email')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    user_id: data.user_id!,
    name: data.display_name || data.full_name || data.email || 'User',
    email: data.email ?? null,
    avatar_url: null,
  };
}