import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AtSign, MessageSquare, Pin, UserPlus, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  useNotifications, useUnreadNotificationCount,
  useMarkAllNotificationsRead, useMarkNotificationRead, useDirectory,
} from '@/hooks/chat';
import type { ChatNotification } from '@/lib/services/chat/api';
import { cn } from '@/lib/utils';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  mention: AtSign, thread_reply: MessageSquare, pin: Pin, added_to_channel: UserPlus, message: MessageCircle,
};

const GROUP_TITLES: Record<string, string> = {
  mention: 'Mentions', thread_reply: 'Thread Replies', pin: 'Pins', added_to_channel: 'Channel Activity', message: 'Messages',
};

export function ChatNotificationsBell() {
  const navigate = useNavigate();
  const { data: notifs = [] } = useNotifications();
  const { data: unread = 0 } = useUnreadNotificationCount();
  const markAll = useMarkAllNotificationsRead();
  const markOne = useMarkNotificationRead();
  const { data: directory = [] } = useDirectory();
  const nameById = new Map(directory.map((d) => [d.user_id, d.name]));

  // Browser notifications
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'default') {
      try { void Notification.requestPermission(); } catch { /* ignore */ }
    }
  }, []);

  const grouped = notifs.reduce<Record<string, ChatNotification[]>>((acc, n) => {
    (acc[n.type] ||= []).push(n); return acc;
  }, {});

  const handleClick = async (n: ChatNotification) => {
    if (!n.is_read) await markOne.mutateAsync(n.id);
    if (n.channel_id) {
      navigate(n.message_id ? `/chat/channels/${n.channel_id}#message-${n.message_id}` : `/chat/channels/${n.channel_id}`);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" title="Chat notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0 max-h-[28rem] flex flex-col">
        <div className="px-3 py-2 border-b flex items-center justify-between">
          <span className="text-sm font-medium">Chat notifications</span>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => markAll.mutate()}>
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="flex-1">
          {notifs.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No notifications</div>
          ) : (
            Object.entries(grouped).map(([type, items]) => {
              const Icon = ICONS[type] ?? Bell;
              return (
                <div key={type}>
                  <div className="px-3 py-1 bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                    {GROUP_TITLES[type] ?? type}
                  </div>
                  {items.map((n) => (
                    <button key={n.id} type="button" onClick={() => handleClick(n)}
                      className={cn('w-full text-left flex items-start gap-2 px-3 py-2 border-b last:border-0 hover:bg-muted/60', !n.is_read && 'bg-primary/5')}>
                      <Icon className="h-3.5 w-3.5 text-muted-foreground mt-1 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium truncate">
                          {n.actor_user_id ? nameById.get(n.actor_user_id) ?? 'Someone' : 'System'}
                        </div>
                        {n.body_preview && <div className="text-xs text-muted-foreground line-clamp-2">{n.body_preview}</div>}
                        <div className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
                      </div>
                      {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary mt-2" />}
                    </button>
                  ))}
                </div>
              );
            })
          )}
        </ScrollArea>
        <div className="border-t p-2 text-center">
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/chat/notifications')}>
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}