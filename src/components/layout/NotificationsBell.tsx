// Top-nav bell — surfaces overdue/due-today CRM activities as in-app reminders.
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { getReminders, dismissReminder, type ReminderItem } from '@/lib/crm/notifications';
import { completeActivity } from '@/lib/data/crm';
import { downloadICS } from '@/lib/crm/ics';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

export function NotificationsBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ReminderItem[]>([]);

  const refresh = useCallback(() => {
    setItems(getReminders(user?.id));
  }, [user?.id]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60_000);
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', refresh);
    };
  }, [refresh]);

  const dueCount = items.filter(i => i.status !== 'upcoming').length;

  const handleOpen = (item: ReminderItem) => {
    setOpen(false);
    if (item.activity.relatedTo === 'opportunity') {
      navigate(`/crm/opportunities/${item.activity.relatedId}`);
    } else if (item.activity.relatedTo === 'contact') {
      navigate(`/crm/contacts/${item.activity.relatedId}`);
    }
  };

  const handleDismiss = (id: string) => {
    dismissReminder(id);
    refresh();
  };

  const handleComplete = (id: string) => {
    completeActivity(id);
    refresh();
  };

  const handleExportAll = () => {
    if (items.length === 0) return;
    downloadICS(items.map(i => i.activity), 'crm-reminders.ics');
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {dueCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center rounded-full"
            >
              {dueCount > 9 ? '9+' : dueCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-3 py-2 border-b border-border flex items-center justify-between">
          <span className="text-sm font-semibold">Reminders</span>
          {items.length > 0 && (
            <button
              onClick={handleExportAll}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              title="Export all to .ics"
            >
              <Calendar className="h-3 w-3" /> Export
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No upcoming reminders
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.activity.id}
                className={cn(
                  'px-3 py-2 border-b border-border last:border-0 hover:bg-muted/40 cursor-pointer group',
                  item.status === 'overdue' && 'bg-destructive/5',
                )}
                onClick={() => handleOpen(item)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          'text-[10px] uppercase font-semibold tracking-wide',
                          item.status === 'overdue' && 'text-destructive',
                          item.status === 'today' && 'text-amber-600',
                          item.status === 'upcoming' && 'text-muted-foreground',
                        )}
                      >
                        {item.status}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {item.activity.dueDate ? format(parseISO(item.activity.dueDate), 'MMM d, HH:mm') : ''}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground line-clamp-2">
                      {item.activity.subject}
                    </p>
                    <p className="text-[11px] text-muted-foreground capitalize">
                      {item.activity.type} · {item.activity.relatedTo}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleComplete(item.activity.id); }}
                      className="h-6 w-6 rounded hover:bg-success/10 text-muted-foreground hover:text-success flex items-center justify-center"
                      title="Mark complete"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDismiss(item.activity.id); }}
                      className="h-6 w-6 rounded hover:bg-muted text-muted-foreground flex items-center justify-center"
                      title="Dismiss"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
