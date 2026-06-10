import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type ChatChannel = Database['public']['Tables']['chat_channels']['Row'];
export type ChatChannelInsert = Database['public']['Tables']['chat_channels']['Insert'];
export type ChatChannelMember = Database['public']['Tables']['chat_channel_members']['Row'];
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
export type ChatAttachment = Database['public']['Tables']['chat_message_attachments']['Row'];
export type ChatMention = Database['public']['Tables']['chat_message_mentions']['Row'];
export type ChatRead = Database['public']['Tables']['chat_message_reads']['Row'];
export type ChatNotification = Database['public']['Tables']['chat_notifications']['Row'];

export type ResourceType =
  | 'sales_order' | 'quotation' | 'invoice' | 'customer'
  | 'product' | 'work_order' | 'purchase_order' | 'employee';

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

// ---------------- Batch 3: Search ----------------

export interface MessageSearchResult {
  message: ChatMessage;
  channel: ChatChannel | null;
  sender_name: string | null;
  snippet: string;
}

export async function searchMessages(
  query: string,
  channelId: string | null = null,
  limit = 30,
  offset = 0,
): Promise<MessageSearchResult[]> {
  const q = query.trim();
  if (!q) return [];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let req = supabase
    .from('chat_messages')
    .select('*, channel:chat_channels(*)')
    .textSearch('body_tsv', q, { type: 'websearch', config: 'english' })
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (channelId) req = req.eq('channel_id', channelId);

  const { data, error } = await req;
  if (error) throw error;

  const dir = await fetchDirectory();
  const nameById = new Map(dir.map((d) => [d.user_id, d.name]));
  const terms = q.split(/\s+/).filter(Boolean);

  return (data ?? []).map((row: any) => {
    const body: string = row.body ?? '';
    let snippet = body;
    // build a snippet around the first match
    const lower = body.toLowerCase();
    let pos = -1;
    for (const t of terms) {
      const i = lower.indexOf(t.toLowerCase());
      if (i >= 0 && (pos === -1 || i < pos)) pos = i;
    }
    if (pos > 60) snippet = '…' + body.slice(pos - 40);
    if (snippet.length > 200) snippet = snippet.slice(0, 200) + '…';
    return {
      message: { ...row, channel: undefined } as ChatMessage,
      channel: row.channel ?? null,
      sender_name: row.user_id ? nameById.get(row.user_id) ?? null : null,
      snippet,
    };
  });
}

export function highlightSnippet(text: string, query: string): Array<{ text: string; hit: boolean }> {
  const terms = query.trim().split(/\s+/).filter((t) => t.length >= 2);
  if (terms.length === 0) return [{ text, hit: false }];
  const re = new RegExp('(' + terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'ig');
  const parts: Array<{ text: string; hit: boolean }> = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index), hit: false });
    parts.push({ text: m[0], hit: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), hit: false });
  return parts;
}

// ---------------- Batch 3: Pinned messages ----------------

export async function pinMessage(messageId: string): Promise<ChatMessage> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');
  const { data, error } = await supabase
    .from('chat_messages')
    .update({ is_pinned: true, pinned_by: user.id, pinned_at: new Date().toISOString() })
    .eq('id', messageId)
    .select().single();
  if (error) throw error;
  return data;
}

export async function unpinMessage(messageId: string): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from('chat_messages')
    .update({ is_pinned: false, pinned_by: null, pinned_at: null })
    .eq('id', messageId)
    .select().single();
  if (error) throw error;
  return data;
}

export async function fetchPinnedMessages(channelId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('channel_id', channelId)
    .eq('is_pinned', true)
    .order('pinned_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ---------------- Batch 3: Resource-linked messages ----------------

export async function sendMessageWithResource(opts: {
  channelId: string;
  body: string;
  resourceType: ResourceType;
  resourceId: string;
  resourceLabel: string;
}): Promise<ChatMessage> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      channel_id: opts.channelId,
      user_id: user.id,
      body: opts.body,
      message_type: opts.body && opts.body.trim().length > 0 ? 'mixed' : 'resource_link',
      linked_resource_type: opts.resourceType,
      linked_resource_id: opts.resourceId,
      linked_resource_label: opts.resourceLabel,
    })
    .select().single();
  if (error) throw error;
  return data;
}

export function resolveResourceLink(type: ResourceType, id: string): string {
  switch (type) {
    case 'sales_order': return `/sales/orders/${id}`;
    case 'quotation': return `/sales/quotations/${id}`;
    case 'invoice': return `/invoicing/invoices/${id}`;
    case 'customer': return `/sales/customers/${id}/edit`;
    case 'product': return `/inventory/products/${id}`;
    case 'work_order': return `/manufacturing/work-orders/${id}`;
    case 'employee': return `/employees/${id}`;
    case 'purchase_order': return `/`;
    default: return '/';
  }
}

export async function fetchResourcePreview(
  type: ResourceType, id: string
): Promise<{ label: string; subtitle?: string; status?: string } | null> {
  try {
    switch (type) {
      case 'sales_order': {
        const { data } = await supabase.from('sales_orders').select('id, reference, status, customer_name').eq('id', id).maybeSingle();
        if (!data) return null;
        return { label: data.reference ?? `Order ${id.slice(0,8)}`, subtitle: data.customer_name ?? undefined, status: data.status ?? undefined };
      }
      case 'quotation': {
        const { data } = await supabase.from('quotations').select('id, reference, status, customer_name').eq('id', id).maybeSingle();
        if (!data) return null;
        return { label: data.reference ?? `Quotation ${id.slice(0,8)}`, subtitle: data.customer_name ?? undefined, status: data.status ?? undefined };
      }
      case 'invoice': {
        const { data } = await supabase.from('invoices').select('id, reference, status').eq('id', id).maybeSingle();
        if (!data) return null;
        return { label: data.reference ?? `Invoice ${id.slice(0,8)}`, status: data.status ?? undefined };
      }
      case 'customer': {
        const { data } = await supabase.from('customers').select('id, name, email').eq('id', id).maybeSingle();
        if (!data) return null;
        return { label: data.name, subtitle: data.email ?? undefined };
      }
      case 'product': {
        const { data } = await supabase.from('products').select('id, name, sku').eq('id', id).maybeSingle();
        if (!data) return null;
        return { label: data.name, subtitle: data.sku ?? undefined };
      }
      case 'work_order': {
        const { data } = await supabase.from('work_orders').select('id, reference, state').eq('id', id).maybeSingle();
        if (!data) return null;
        return { label: data.reference ?? `WO ${id.slice(0,8)}`, status: data.state ?? undefined };
      }
      case 'employee': {
        const { data } = await supabase.from('employees').select('id, full_name, display_name, job_title').eq('id', id).maybeSingle();
        if (!data) return null;
        return { label: (data as any).display_name || (data as any).full_name, subtitle: (data as any).job_title ?? undefined };
      }
      default: return null;
    }
  } catch { return null; }
}

// ---------------- Batch 3: Notifications ----------------

export async function fetchUserNotifications(
  isReadFilter?: boolean, limit = 50
): Promise<ChatNotification[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  let q = supabase
    .from('chat_notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (typeof isReadFilter === 'boolean') q = q.eq('is_read', isReadFilter);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('chat_notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
  if (error) throw error;
}

export async function markAllNotificationsRead(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase
    .from('chat_notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);
  if (error) throw error;
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { count, error } = await supabase
    .from('chat_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
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
  const map = new Map<string, DirectoryUser>();

  // Primary source: employees with linked auth users.
  const { data: emps } = await supabase
    .from('employees')
    .select('user_id, full_name, display_name, email')
    .not('user_id', 'is', null);
  for (const e of (emps ?? []) as any[]) {
    if (!e.user_id) continue;
    map.set(e.user_id, {
      user_id: e.user_id,
      name: e.display_name || e.full_name || e.email || 'User',
      email: e.email ?? null,
      avatar_url: null,
    });
  }

  // Fallback: include any chat participant we don't have a name for yet,
  // so @mention works even before employees are seeded.
  const { data: members } = await supabase
    .from('chat_channel_members')
    .select('user_id');
  for (const m of members ?? []) {
    if (m.user_id && !map.has(m.user_id)) {
      map.set(m.user_id, {
        user_id: m.user_id,
        name: `User ${m.user_id.slice(0, 8)}`,
        email: null,
        avatar_url: null,
      });
    }
  }

  // Enrich the current user from auth metadata so @-ing yourself works nicely.
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const name =
      (meta.name as string) ||
      (meta.full_name as string) ||
      (user.email ? user.email.split('@')[0] : null) ||
      `User ${user.id.slice(0, 8)}`;
    map.set(user.id, {
      user_id: user.id,
      name,
      email: user.email ?? null,
      avatar_url: (meta.avatar_url as string | undefined) ?? null,
    });
  }

  return Array.from(map.values());
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