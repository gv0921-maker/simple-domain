import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useNotifications, useMarkAllNotificationsRead, useMarkNotificationRead, useDirectory } from '@/hooks/chat';
import { cn } from '@/lib/utils';

const TYPES = [
  { value: '', label: 'All' },
  { value: 'mention', label: 'Mentions' },
  { value: 'thread_reply', label: 'Thread Replies' },
  { value: 'pin', label: 'Pins' },
  { value: 'added_to_channel', label: 'Channel Activity' },
];

function Inner() {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { data: all = [], isLoading } = useNotifications(unreadOnly ? false : undefined);
  const { data: directory = [] } = useDirectory();
  const markOne = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const nameById = new Map(directory.map((d) => [d.user_id, d.name]));

  const filtered = typeFilter ? all.filter((n) => n.type === typeFilter) : all;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Notifications</h1>
          <Button size="sm" variant="outline" onClick={() => markAll.mutate()}>Mark all read</Button>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <select className="border rounded px-2 py-1 bg-background" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <label className="flex items-center gap-1 ml-2">
            <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} /> Unread only
          </label>
        </div>
        <div className="border rounded-md divide-y">
          {isLoading && <div className="p-4 text-sm text-muted-foreground">Loading…</div>}
          {!isLoading && filtered.length === 0 && <div className="p-6 text-sm text-muted-foreground text-center">No notifications</div>}
          {filtered.map((n) => (
            <button key={n.id} type="button" onClick={async () => {
              if (!n.is_read) await markOne.mutateAsync(n.id);
              if (n.channel_id) navigate(n.message_id ? `/chat/channels/${n.channel_id}#message-${n.message_id}` : `/chat/channels/${n.channel_id}`);
            }}
            className={cn('w-full text-left p-3 hover:bg-muted', !n.is_read && 'bg-primary/5')}>
              <div className="text-xs">
                <span className="font-medium">{n.actor_user_id ? nameById.get(n.actor_user_id) ?? 'Someone' : 'System'}</span>
                <span className="text-muted-foreground"> · {n.type.replace('_', ' ')} · {new Date(n.created_at).toLocaleString()}</span>
              </div>
              {n.body_preview && <div className="text-sm mt-1">{n.body_preview}</div>}
            </button>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

export default function ChatNotificationsPage() {
  return <ErrorBoundary label="ChatNotifications"><Inner /></ErrorBoundary>;
}