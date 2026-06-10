import { useEffect, useMemo, useRef, useState } from 'react';
import {
  useMessages, useMarkChannelRead, useDirectory,
  useMessageAttachments, useMessageMentions, useMarkMessageRead,
  useMessageReads, useDeleteMessage, useEditMessage,
} from '@/hooks/chat';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageBody, bodyMentionsMe } from './MessageBody';
import { AttachmentList } from './AttachmentList';
import { Button } from '@/components/ui/button';
import { MessageSquare, Copy, Pencil, Trash2, Eye, Pin, PinOff } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { usePinMessage, useUnpinMessage } from '@/hooks/chat';
import { ResourceCard } from './ResourceCard';
import type { ResourceType } from '@/lib/services/chat/api';

function initials(name: string) {
  return name.split(' ').map((s) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageList({
  channelId, onOpenThread, activeThreadId,
}: { channelId: string; onOpenThread?: (parentMessageId: string) => void; activeThreadId?: string | null }) {
  const { user } = useAuth();
  const { data: allMessages = [], isLoading } = useMessages(channelId);
  const messages = useMemo(() => allMessages.filter((m) => !m.parent_message_id), [allMessages]);
  const { data: directory = [] } = useDirectory();
  const markRead = useMarkChannelRead();
  const markMessageRead = useMarkMessageRead();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const messageIds = useMemo(() => messages.map((m) => m.id), [messages]);
  const { data: attachmentsByMsg = {} } = useMessageAttachments(channelId, messageIds);
  useMessageMentions(channelId, messageIds); // ensures cache warm — render uses inline body parsing

  const editMessage = useEditMessage(channelId);
  const deleteMessage = useDeleteMessage(channelId);
  const pinMutation = usePinMessage();
  const unpinMutation = useUnpinMessage();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  // Jump-to-message via URL hash (#message-:id)
  useEffect(() => {
    const hash = window.location.hash;
    const m = hash.match(/^#message-(.+)$/);
    if (!m) return;
    const id = m[1];
    const el = scrollRef.current?.querySelector<HTMLElement>(`[data-message-id="${id}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-primary');
      setTimeout(() => el.classList.remove('ring-2', 'ring-primary'), 2000);
    }
  }, [messages.length]);

  useEffect(() => {
    if (channelId) markRead.mutate(channelId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, messages.length]);

  // Intersection observer to mark individual messages read when they enter viewport
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const seen = new Set<string>();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const id = (entry.target as HTMLElement).dataset.messageId;
        if (!id || seen.has(id)) return;
        if (entry.isIntersecting) {
          seen.add(id);
          markMessageRead.mutate(id);
        }
      });
    }, { root, threshold: 0.6 });
    root.querySelectorAll<HTMLElement>('[data-message-id]').forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const dirMap = useMemo(() => {
    const m = new Map<string, string>();
    directory.forEach((d) => m.set(d.user_id, d.name));
    return m;
  }, [directory]);

  type Group = { user_id: string | null; created_at: string; messages: typeof messages };
  const groups = useMemo<Group[]>(() => {
    const out: Group[] = [];
    for (const msg of messages) {
      const last = out[out.length - 1];
      if (last && last.user_id === msg.user_id &&
          new Date(msg.created_at).getTime() - new Date(last.created_at).getTime() < 5 * 60_000) {
        last.messages.push(msg);
      } else {
        out.push({ user_id: msg.user_id, created_at: msg.created_at, messages: [msg] });
      }
    }
    return out;
  }, [messages]);

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {groups.length === 0 && (
        <div className="text-center text-sm text-muted-foreground py-12">No messages yet. Say hello 👋</div>
      )}
      {groups.map((g, gi) => {
        const mine = g.user_id === user?.id;
        const name = g.user_id ? dirMap.get(g.user_id) ?? 'User' : 'System';
        return (
          <div key={gi} className={cn('flex gap-3', mine && 'flex-row-reverse')}>
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback className="text-xs">{initials(name)}</AvatarFallback>
            </Avatar>
            <div className={cn('flex-1 min-w-0', mine && 'flex flex-col items-end')}>
              <div className={cn('flex items-baseline gap-2 mb-1', mine && 'flex-row-reverse')}>
                <span className="text-sm font-medium">{mine ? 'You' : name}</span>
                <span className="text-[11px] text-muted-foreground">{formatTime(g.created_at)}</span>
              </div>
              <div className="space-y-1 max-w-[78%] w-full">
                {g.messages.map((m) => {
                  const atts = attachmentsByMsg[m.id] ?? [];
                  const mentionsMe = bodyMentionsMe(m.body, user?.name);
                  const isEditing = editingId === m.id;
                  const canEdit = mine && !m.is_deleted && (Date.now() - new Date(m.created_at).getTime() < 15 * 60_000);
                  const isThreadActive = activeThreadId === m.id;
                  return (
                    <div
                      key={m.id}
                      data-message-id={m.id}
                      className={cn(
                        'group relative rounded-lg px-3 py-2 text-sm',
                        mine ? 'bg-primary text-primary-foreground' : 'bg-muted',
                        m.is_deleted && 'italic opacity-60',
                        mentionsMe && !mine && 'border-l-4 border-primary',
                        isThreadActive && 'ring-2 ring-primary',
                      )}
                    >
                      {m.is_deleted ? (
                        <span>Message deleted</span>
                      ) : isEditing ? (
                        <div className="space-y-1">
                          <Textarea
                            autoFocus
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="min-h-[60px] text-sm text-foreground bg-background"
                          />
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                            <Button size="sm" onClick={async () => {
                              try {
                                await editMessage.mutateAsync({ id: m.id, body: editText.trim() });
                                setEditingId(null);
                              } catch (e: any) {
                                toast({ title: 'Failed to edit', description: e?.message, variant: 'destructive' });
                              }
                            }}>Save</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {m.is_pinned && (
                            <span className="absolute -left-5 top-1.5 text-primary" title="Pinned">
                              <Pin className="h-3.5 w-3.5" />
                            </span>
                          )}
                          <MessageBody body={m.body} />
                          {m.is_edited && !m.is_deleted && (
                            <span className={cn('ml-2 text-[10px]', mine ? 'text-primary-foreground/70' : 'text-muted-foreground')}>(edited)</span>
                          )}
                          {atts.length > 0 && <AttachmentList items={atts} />}
                          {m.linked_resource_type && m.linked_resource_id && (
                            <ResourceCard
                              resourceType={m.linked_resource_type as ResourceType}
                              resourceId={m.linked_resource_id}
                              fallbackLabel={m.linked_resource_label}
                            />
                          )}
                          <MessageFooter
                            messageId={m.id}
                            replyCount={m.thread_reply_count ?? 0}
                            mine={mine}
                            onOpenThread={onOpenThread ? () => onOpenThread(m.id) : undefined}
                          />
                        </>
                      )}

                      {!m.is_deleted && !isEditing && (
                        <div className={cn(
                          'absolute -top-3 opacity-0 group-hover:opacity-100 transition flex gap-0.5 rounded border bg-popover shadow-sm p-0.5',
                          mine ? 'left-2' : 'right-2',
                        )}>
                          {onOpenThread && (
                            <Button size="icon" variant="ghost" className="h-7 w-7" title="Reply in thread"
                              onClick={() => onOpenThread(m.id)}>
                              <MessageSquare className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" className="h-7 w-7" title="Copy"
                            onClick={() => { void navigator.clipboard.writeText(m.body); toast({ title: 'Copied' }); }}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" title={m.is_pinned ? 'Unpin' : 'Pin'}
                            onClick={async () => {
                              try {
                                if (m.is_pinned) { await unpinMutation.mutateAsync(m.id); toast({ title: 'Unpinned' }); }
                                else { await pinMutation.mutateAsync(m.id); toast({ title: 'Pinned' }); }
                              } catch (e: any) {
                                toast({ title: 'Failed', description: e?.message, variant: 'destructive' });
                              }
                            }}>
                            {m.is_pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                          </Button>
                          {canEdit && (
                            <Button size="icon" variant="ghost" className="h-7 w-7" title="Edit"
                              onClick={() => { setEditingId(m.id); setEditText(m.body); }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {mine && (
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" title="Delete"
                              onClick={async () => {
                                if (!confirm('Delete this message?')) return;
                                try { await deleteMessage.mutateAsync(m.id); } catch (e: any) {
                                  toast({ title: 'Failed to delete', description: e?.message, variant: 'destructive' });
                                }
                              }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MessageFooter({
  messageId, replyCount, mine, onOpenThread,
}: { messageId: string; replyCount: number; mine: boolean; onOpenThread?: () => void }) {
  const { data: reads = [] } = useMessageReads(messageId);
  const { data: directory = [] } = useDirectory();
  const nameMap = useMemo(() => {
    const m = new Map<string, string>();
    directory.forEach((d) => m.set(d.user_id, d.name));
    return m;
  }, [directory]);
  if (!replyCount && reads.length === 0) return null;
  return (
    <div className={cn('mt-1.5 flex items-center gap-3 text-[11px]', mine ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
      {replyCount > 0 && onOpenThread && (
        <button type="button" onClick={onOpenThread} className="flex items-center gap-1 hover:underline">
          <MessageSquare className="h-3 w-3" />
          {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
        </button>
      )}
      {reads.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="flex items-center gap-1 hover:underline">
              <Eye className="h-3 w-3" /> Seen by {reads.length}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 text-xs p-2">
            <div className="font-medium mb-1">Read by</div>
            <ul className="space-y-1">
              {reads.slice(0, 30).map((r) => (
                <li key={r.id} className="truncate">{nameMap.get(r.user_id) ?? 'User'}</li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}