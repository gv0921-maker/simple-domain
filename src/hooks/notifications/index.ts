import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  getMyNotifications, getUnreadCount, markAsRead, markAllAsRead,
  deleteNotification, getMyPreferences, updateMyPreferences,
  subscribeBrowserPush, unsubscribeBrowserPush, sendTestNotification,
  type NotifFilters, type AppNotification,
} from '@/lib/services/notifications';
import { playNotificationSound } from '@/lib/notifications/sound';

export const NOTIF_KEYS = {
  list: (f: NotifFilters) => ['notifications', 'list', f] as const,
  unread: ['notifications', 'unread'] as const,
  prefs: ['notifications', 'prefs'] as const,
};

export function useNotificationsList(filters: NotifFilters = {}) {
  return useQuery({
    queryKey: NOTIF_KEYS.list(filters),
    queryFn: () => getMyNotifications(filters),
    staleTime: 15_000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: NOTIF_KEYS.unread,
    queryFn: () => getUnreadCount(),
    staleTime: 15_000,
    refetchInterval: 60_000,
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markAllAsRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: NOTIF_KEYS.prefs,
    queryFn: () => getMyPreferences(),
  });
}

export function useUpdatePreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) => updateMyPreferences(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIF_KEYS.prefs }),
  });
}

export function useSubscribeBrowserPush() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => subscribeBrowserPush(),
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIF_KEYS.prefs }),
  });
}

export function useUnsubscribeBrowserPush() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => unsubscribeBrowserPush(),
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIF_KEYS.prefs }),
  });
}

export function useSendTestNotification() {
  return useMutation({ mutationFn: () => sendTestNotification() });
}

/**
 * Realtime subscription that invalidates lists and plays a sound/desktop
 * notification whenever a new notification is inserted for the current user.
 */
export function useNotificationsRealtime(enabled = true) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let cleanup: (() => void) | null = null;

    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (!uid || cancelled) return;

      const channel = (supabase as any)
        .channel(`notifications:${uid}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_user_id=eq.${uid}`,
          },
          async (payload: { new: AppNotification }) => {
            const n = payload.new;
            qc.invalidateQueries({ queryKey: ['notifications'] });

            // Load prefs to decide sound + push
            let prefs: any = null;
            try { prefs = await getMyPreferences(); } catch { /* ignore */ }

            const cat = n.category;
            const allowed =
              !prefs ||
              (prefs.categories?.[cat] ?? true);
            if (!allowed) return;

            // Quiet hours
            if (prefs?.quiet_hours_start && prefs?.quiet_hours_end) {
              const now = new Date();
              const cur = now.getHours() * 60 + now.getMinutes();
              const [sh, sm] = String(prefs.quiet_hours_start).split(':').map(Number);
              const [eh, em] = String(prefs.quiet_hours_end).split(':').map(Number);
              const start = sh * 60 + (sm || 0);
              const end = eh * 60 + (em || 0);
              const inQuiet = start < end
                ? cur >= start && cur < end
                : cur >= start || cur < end;
              if (inQuiet && n.priority !== 'urgent') return;
            }

            // Sound
            if (prefs?.in_app_sound_enabled !== false) {
              const tone =
                cat === 'chat' ? 'chat'
                : n.priority === 'urgent' ? 'urgent'
                : 'general';
              playNotificationSound(tone);
            }

            // Browser push
            if (prefs?.browser_push_enabled && 'Notification' in window && Notification.permission === 'granted') {
              try {
                const notif = new Notification(n.title, {
                  body: n.body,
                  tag: n.id,
                  icon: '/favicon.ico',
                });
                notif.onclick = () => {
                  window.focus();
                  if (n.link_url) window.location.href = n.link_url;
                };
              } catch { /* ignore */ }
            }
          },
        )
        .subscribe();

      cleanup = () => { (supabase as any).removeChannel(channel); };
    })();

    return () => { cancelled = true; cleanup?.(); };
  }, [enabled, qc]);
}