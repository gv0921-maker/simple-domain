import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  getNotifications, markRead, markAllRead, dismissNotification,
  generateReminders, type CRMNotification,
} from '@/lib/crm/notifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, parseISO } from 'date-fns';

export function NotificationsBell() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<CRMNotification[]>([]);
  const [open, setOpen] = useState(false);

  const refresh = () => setNotifications(getNotifications());

  useEffect(() => {
    generateReminders();
    refresh();
    const iv = setInterval(() => { generateReminders(); refresh(); }, 60_000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => { if (open) refresh(); }, [open]);

  const unread = notifications.filter(n => !n.read).length;

  const handleClick = (n: CRMNotification) => {
    markRead(n.id);
    if (n.link) navigate(n.link);
    refresh();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-medium">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 max-h-96 overflow-hidden flex flex-col">
        <div className="px-3 py-2 border-b border-border flex items-center justify-between">
          <span className="text-sm font-medium">Notifications</span>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => { markAllRead(); refresh(); }}>
              <Check className="h-3 w-3 mr-1" /> Mark all read
            </Button>
          )}
        </div>
        <div className="overflow-y-auto flex-1">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
          ) : (
            notifications.slice(0, 20).map(n => (
              <div
                key={n.id}
                className={cn(
                  'flex items-start gap-2 px-3 py-2 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 transition-colors',
                  !n.read && 'bg-primary/5'
                )}
                onClick={() => handleClick(n)}
              >
                <div className={cn(
                  'mt-1 h-2 w-2 rounded-full shrink-0',
                  n.type === 'reminder' && 'bg-warning',
                  n.type === 'mention' && 'bg-info',
                  n.type === 'automation' && 'bg-primary',
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{n.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(parseISO(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <Button
                  variant="ghost" size="icon" className="h-6 w-6 shrink-0"
                  onClick={e => { e.stopPropagation(); dismissNotification(n.id); refresh(); }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}