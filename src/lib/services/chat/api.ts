import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type ChatChannel = Database['public']['Tables']['chat_channels']['Row'];
export type ChatChannelInsert = Database['public']['Tables']['chat_channels']['Insert'];
export type ChatChannelMember = Database['public']['Tables']['chat_channel_members']['Row'];
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];

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