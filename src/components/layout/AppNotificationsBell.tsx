import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
  useNotificationsList,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  useNotificationsRealtime,
} from '@/hooks/notifications';
import type { AppNotification, NotificationPriority } from '@/lib/services/notifications';

const PRIORITY_COLOR: Record<NotificationPriority, string> = {
  urgent: 'bg-destructive',
  high: 'bg-warning',
  normal: 'bg-primary',
  low: 'bg-muted-foreground',
};

export function AppNotificationsBell() {
  const navigate = useNavigate();
  useNotificationsRealtime();

  const { data: notifs = [] } = useNotificationsList({ limit: 15 });
  const { data: unread = 0 } = useUnreadCount();
  const markOne = useMarkAsRead();
  const markAll = useMarkAllAsRead();
  const del = useDeleteNotification();

  const handleClick = async (n: AppNotification) => {
    if (!n.is_read) await markOne.mutateAsync(n.id);
    if (n.link_url) navigate(n.link_url);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-medium">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0 max-h-[32rem] overflow-hidden flex flex-col">
        <div className="px-3 py-2 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Notifications</span>
            {unread > 0 && <Badge variant="secondary" className="text-xs">{unread} unread</Badge>}
          </div>
          <div className="flex items-center gap-1">
            {unread > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => markAll.mutate()}>
                <Check className="h-3 w-3 mr-1" /> All read
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate('/settings/notifications')} aria-label="Notification settings">
              <SettingsIcon className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-1 max-h-96">
          {notifs.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">You're all caught up.</div>
          ) : (
            notifs.map((n) => (
              <div
                key={n.id}
                className={cn(
                  'flex items-start gap-2 px-3 py-2 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 transition-colors',
                  !n.is_read && 'bg-primary/5',
                )}
                onClick={() => handleClick(n)}
              >
                <div className={cn('mt-1.5 h-2 w-2 rounded-full shrink-0', PRIORITY_COLOR[n.priority])} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn('text-sm truncate', !n.is_read ? 'font-medium' : 'font-normal')}>{n.title}</p>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground shrink-0">{n.category}</span>
                  </div>
                  {n.body && <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={(e) => { e.stopPropagation(); del.mutate(n.id); }}
                  aria-label="Dismiss"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </ScrollArea>
        <div className="px-3 py-2 border-t border-border">
          <Button variant="ghost" size="sm" className="w-full justify-center text-xs" onClick={() => navigate('/notifications')}>
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}