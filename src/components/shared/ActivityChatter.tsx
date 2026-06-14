// Canonical activity panel — chatter-style UI backed by activity_log.
// Three tabs: Send message (stub), Log note, Activity (field/status changes).
// Used across every detail page (CRM, Sales, Manufacturing, Returns, etc.).
import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { MessageSquare, Edit3, Activity as ActivityIcon, Trash2, Send } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  useActivityLog, useAddManualNote, useSoftDeleteLogEntry,
} from '@/hooks/useActivityLog';
import type { ActivityLogEntry, ActivityRecordType } from '@/lib/services/activityLog';
import { cn } from '@/lib/utils';

interface Props {
  recordType: ActivityRecordType;
  recordId: string | undefined;
  className?: string;
}

type TabKey = 'message' | 'note' | 'activity';

function initials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

function fmtStamp(iso: string): string {
  try { return format(parseISO(iso), 'dd-MM-yyyy h:mm a'); } catch { return iso; }
}

function friendlyField(name: string | null): string {
  if (!name) return 'field';
  return name
    .replace(/_id$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function displayValue(v: string | null): string {
  if (v == null || v === '') return '—';
  return v;
}

function EntryRow({
  entry, canDelete, onDelete, currentUserId, currentUserName,
}: {
  entry: ActivityLogEntry;
  canDelete: boolean;
  onDelete: (id: string) => void;
  currentUserId?: string;
  currentUserName?: string;
}) {
  const isSelf = entry.changed_by === currentUserId;
  const who = isSelf
    ? (currentUserName ?? 'You')
    : (entry.changed_by_name ?? 'A user');

  const isNote = entry.action_type === 'manual_note';

  const body = (() => {
    switch (entry.action_type) {
      case 'created':
        return <span className="text-muted-foreground">created this record</span>;
      case 'deleted':
        return <span className="text-muted-foreground">deleted this record</span>;
      case 'status_change': {
        const label = entry.field_name === 'stage_id' ? 'Stage changed' : 'Status changed';
        return (
          <span>
            <span className="text-muted-foreground">{label}: </span>
            <span className="font-medium">{displayValue(entry.old_value)}</span>
            <span className="text-muted-foreground"> → </span>
            <span className="font-medium">{displayValue(entry.new_value)}</span>
          </span>
        );
      }
      case 'field_change':
        return (
          <span>
            <span className="font-medium">{friendlyField(entry.field_name)}</span>
            <span className="text-muted-foreground">: </span>
            <span>{displayValue(entry.old_value)}</span>
            <span className="text-muted-foreground"> → </span>
            <span>{displayValue(entry.new_value)}</span>
          </span>
        );
      case 'manual_note':
        return <span className="whitespace-pre-wrap">{entry.note_text}</span>;
      default:
        return null;
    }
  })();

  return (
    <div
      className={cn(
        'flex gap-3 p-3 rounded-md border',
        isNote ? 'bg-accent/40 border-accent' : 'bg-card border-border',
      )}
    >
      <Avatar className="h-8 w-8 mt-0.5 shrink-0">
        <AvatarFallback className="text-xs">{initials(who)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{who}</span>
            <span className="text-xs text-muted-foreground">{fmtStamp(entry.changed_at)}</span>
          </div>
          {isNote && canDelete && (
            <Button
              variant="ghost" size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(entry.id)}
              aria-label="Delete note"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <div className="text-sm">{body}</div>
      </div>
    </div>
  );
}

export function ActivityChatter({ recordType, recordId, className }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<TabKey>('note');
  const [limit, setLimit] = useState(20);
  const [draft, setDraft] = useState('');

  const isSuperAdmin = (user?.role ?? '').toLowerCase() === 'super_admin';

  const q = useActivityLog(recordType, recordId, limit);
  const addNote = useAddManualNote(recordType, recordId ?? '');
  const softDelete = useSoftDeleteLogEntry(recordType, recordId ?? '');

  const entries = q.data?.entries ?? [];
  const total = q.data?.total ?? 0;

  const filtered = useMemo(() => {
    if (tab === 'note') return entries;
    if (tab === 'activity') return entries.filter(e => e.action_type !== 'manual_note');
    return [];
  }, [entries, tab]);

  const handleSubmit = async () => {
    const t = draft.trim();
    if (!t || !recordId) return;
    if (tab === 'message') {
      toast({ title: 'Messaging not yet enabled', description: 'This will send to the customer/team once configured.' });
      return;
    }
    try {
      await addNote.mutateAsync(t);
      setDraft('');
    } catch (e: any) {
      toast({ title: 'Failed to add note', description: e?.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try { await softDelete.mutateAsync(id); }
    catch (e: any) {
      toast({ title: 'Failed to delete', description: e?.message, variant: 'destructive' });
    }
  };

  if (!recordId) return null;

  const tabBtn = (key: TabKey, label: string, Icon: any) => (
    <button
      type="button"
      onClick={() => setTab(key)}
      className={cn(
        'flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 -mb-px transition-colors',
        tab === key
          ? 'border-primary text-foreground font-medium'
          : 'border-transparent text-muted-foreground hover:text-foreground',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );

  return (
    <Card className={cn('p-0 overflow-hidden', className)}>
      {/* Tabs */}
      <div className="flex items-center border-b px-2 pt-1">
        {tabBtn('message', 'Send message', Send)}
        {tabBtn('note', 'Log note', MessageSquare)}
        {tabBtn('activity', 'Activity', ActivityIcon)}
        <span className="ml-auto pr-2 text-xs text-muted-foreground">{total}</span>
      </div>

      {/* Composer */}
      {tab !== 'activity' && (
        <div className="p-3 border-b space-y-2">
          <div className="flex gap-2">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="text-xs">{initials(user?.name)}</AvatarFallback>
            </Avatar>
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={tab === 'message' ? 'Send a message…' : 'Log an internal note…'}
              rows={2}
              className="resize-none flex-1"
            />
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!draft.trim() || addNote.isPending}
            >
              {tab === 'message' ? <Send className="h-3.5 w-3.5 mr-1.5" /> : <Edit3 className="h-3.5 w-3.5 mr-1.5" />}
              {tab === 'message' ? 'Send' : addNote.isPending ? 'Logging…' : 'Log'}
            </Button>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="p-3 space-y-2 max-h-[640px] overflow-y-auto">
        {q.isLoading ? (
          <>
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            {tab === 'activity' ? 'No activity yet.' : 'No notes yet.'}
          </p>
        ) : (
          filtered.map((e) => (
            <EntryRow
              key={e.id}
              entry={e}
              canDelete={isSuperAdmin}
              onDelete={handleDelete}
              currentUserId={user?.id}
              currentUserName={user?.name}
            />
          ))
        )}

        {entries.length < total && (
          <div className="flex justify-center pt-1">
            <Button
              variant="outline" size="sm"
              onClick={() => setLimit((n) => n + 20)}
              disabled={q.isFetching}
            >
              {q.isFetching ? 'Loading…' : 'Load more'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

export default ActivityChatter;