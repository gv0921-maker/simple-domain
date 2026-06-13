import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Check, Trash2, Settings as SettingsIcon } from 'lucide-react';
import {
  useNotificationsList,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  useNotificationsRealtime,
} from '@/hooks/notifications';
import type { AppNotification, NotificationCategory, NotificationPriority } from '@/lib/services/notifications';

const CATEGORIES: { value: NotificationCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'sales', label: 'Sales' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'hr', label: 'HR' },
  { value: 'returns', label: 'Returns' },
  { value: 'vendor_orders', label: 'Vendor Orders' },
  { value: 'chat', label: 'Chat' },
  { value: 'system', label: 'System' },
];

const PRIORITY_COLOR: Record<NotificationPriority, string> = {
  urgent: 'bg-destructive text-destructive-foreground',
  high: 'bg-warning text-warning-foreground',
  normal: 'bg-secondary text-secondary-foreground',
  low: 'bg-muted text-muted-foreground',
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  useNotificationsRealtime();

  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const [category, setCategory] = useState<string>('all');
  const [priority, setPriority] = useState<string>('all');

  const { data: notifs = [], isLoading } = useNotificationsList({
    unreadOnly: tab === 'unread',
    category: category === 'all' ? undefined : (category as NotificationCategory),
    priority: priority === 'all' ? undefined : (priority as NotificationPriority),
    limit: 200,
  });

  const markOne = useMarkAsRead();
  const markAll = useMarkAllAsRead();
  const del = useDeleteNotification();

  const handleClick = async (n: AppNotification) => {
    if (!n.is_read) await markOne.mutateAsync(n.id);
    if (n.link_url) navigate(n.link_url);
  };

  return (
    <AppLayout title="Notifications">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => markAll.mutate()}>
            <Check className="h-4 w-4 mr-1" /> Mark all read
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/settings/notifications')}>
            <SettingsIcon className="h-4 w-4 mr-1" /> Settings
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'all' | 'unread')}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border border-border rounded-md bg-card divide-y divide-border">
          {isLoading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Loading...</div>
          ) : notifs.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No notifications.</div>
          ) : (
            notifs.map((n) => (
              <div
                key={n.id}
                className={cn(
                  'flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors',
                  !n.is_read && 'bg-primary/5',
                )}
                onClick={() => handleClick(n)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn('text-sm', !n.is_read ? 'font-semibold' : 'font-normal')}>{n.title}</span>
                    <Badge variant="outline" className="text-[10px] uppercase">{n.category}</Badge>
                    <Badge className={cn('text-[10px] uppercase', PRIORITY_COLOR[n.priority])}>{n.priority}</Badge>
                  </div>
                  {n.body && <p className="text-sm text-muted-foreground mt-1">{n.body}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={(e) => { e.stopPropagation(); del.mutate(n.id); }}
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}