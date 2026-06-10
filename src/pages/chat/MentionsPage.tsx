import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AtSign, CheckCheck } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserMentions, useMarkMentionRead, useMarkAllMentionsRead, useDirectory } from '@/hooks/chat';
import { cn } from '@/lib/utils';
import { MessageBody } from '@/components/chat/MessageBody';

export default function MentionsPage() {
  const navigate = useNavigate();
  const [onlyUnread, setOnlyUnread] = useState(false);
  const { data: mentions = [], isLoading } = useUserMentions(onlyUnread ? false : undefined);
  const markRead = useMarkMentionRead();
  const markAll = useMarkAllMentionsRead();
  const { data: directory = [] } = useDirectory();
  const nameOf = (uid: string | null | undefined) =>
    uid ? directory.find((d) => d.user_id === uid)?.name ?? 'User' : 'User';

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <AtSign className="h-5 w-5" /> Mentions
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch id="unread" checked={onlyUnread} onCheckedChange={setOnlyUnread} />
              <Label htmlFor="unread" className="text-sm">Unread only</Label>
            </div>
            <Button size="sm" variant="outline" onClick={() => markAll.mutate()}>
              <CheckCheck className="h-4 w-4 mr-1" /> Mark all read
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-12rem)]">
          {isLoading && <div className="text-sm text-muted-foreground py-12 text-center">Loading…</div>}
          {!isLoading && mentions.length === 0 && (
            <div className="text-sm text-muted-foreground py-12 text-center">No mentions</div>
          )}
          <ul className="space-y-2">
            {mentions.map((row) => {
              const ch = row.channel;
              const msg = row.message;
              return (
                <li
                  key={row.id}
                  className={cn(
                    'rounded-md border p-3 cursor-pointer hover:bg-muted/40 transition',
                    !row.is_read && 'border-primary/40 bg-primary/5',
                  )}
                  onClick={() => {
                    if (!row.is_read) markRead.mutate(row.id);
                    if (ch) navigate(`/chat/channels/${ch.id}`);
                  }}
                >
                  <div className="flex items-center justify-between mb-1 text-xs text-muted-foreground">
                    <span>
                      <span className="font-medium text-foreground">{nameOf(msg?.user_id)}</span>
                      {ch ? <> in <span className="font-medium">#{ch.name.replace(/^#\s*/, '')}</span></> : null}
                    </span>
                    <span>{msg ? new Date(msg.created_at).toLocaleString() : ''}</span>
                  </div>
                  <div className="text-sm">
                    {msg ? <MessageBody body={msg.body} /> : <span className="italic text-muted-foreground">Message unavailable</span>}
                  </div>
                  {!row.is_read && (
                    <div className="mt-2 flex justify-end">
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); markRead.mutate(row.id); }}>
                        Mark read
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      </div>
    </AppLayout>
  );
}