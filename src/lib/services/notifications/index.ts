import { supabase } from '@/integrations/supabase/client';

export type NotificationCategory = 'sales'|'inventory'|'manufacturing'|'hr'|'returns'|'chat'|'system'|'vendor_orders';
export type NotificationPriority = 'urgent'|'high'|'normal'|'low';

export interface AppNotification {
  id: string;
  recipient_user_id: string;
  notification_type: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string;
  link_url: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  expires_at: string | null;
}

export interface NotifFilters {
  unreadOnly?: boolean;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  limit?: number;
}

export async function getMyNotifications(f: NotifFilters = {}): Promise<AppNotification[]> {
  let q = (supabase as any).from('notifications').select('*').order('created_at', { ascending: false });
  if (f.unreadOnly) q = q.eq('is_read', false);
  if (f.category) q = q.eq('category', f.category);
  if (f.priority) q = q.eq('priority', f.priority);
  q = q.limit(f.limit ?? 50);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as AppNotification[];
}

export async function getUnreadCount(): Promise<number> {
  const { count, error } = await (supabase as any)
    .from('notifications').select('*', { count: 'exact', head: true }).eq('is_read', false);
  if (error) throw error;
  return count ?? 0;
}

export async function markAsRead(id: string) {
  const { error } = await (supabase as any).rpc('mark_notification_read', { p_id: id });
  if (error) throw error;
}

export async function markAllAsRead() {
  const { data, error } = await (supabase as any).rpc('mark_all_notifications_read');
  if (error) throw error;
  return data as number;
}

export async function deleteNotification(id: string) {
  const { error } = await (supabase as any).from('notifications').delete().eq('id', id);
  if (error) throw error;
}

export async function getMyPreferences(): Promise<any> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return null;
  const { data } = await (supabase as any).from('notification_preferences').select('*').eq('user_id', uid).maybeSingle();
  if (data) return data;
  const { data: created, error } = await (supabase as any)
    .from('notification_preferences').insert({ user_id: uid }).select().single();
  if (error) throw error;
  return created;
}

export async function updateMyPreferences(input: Record<string, unknown>) {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) throw new Error('Not authenticated');
  const { data, error } = await (supabase as any)
    .from('notification_preferences')
    .upsert({ user_id: uid, ...input, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    .select().single();
  if (error) throw error;
  return data;
}

export async function subscribeBrowserPush(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return false;
  await updateMyPreferences({ browser_push_enabled: true });
  return true;
}

export async function unsubscribeBrowserPush() {
  await updateMyPreferences({ browser_push_enabled: false, browser_push_subscription: null });
}

export async function sendTestNotification() {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error('Not authenticated');
  const { error } = await (supabase as any).rpc('create_app_notification', {
    p_recipient: u.user.id,
    p_type: 'test',
    p_category: 'system',
    p_priority: 'normal',
    p_title: 'Test notification',
    p_body: 'This is a test notification. If you can see this, notifications are working.',
    p_link: '/notifications',
  });
  if (error) throw error;
}