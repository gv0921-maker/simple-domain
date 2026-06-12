import { useMemo, useState } from 'react';
import { formatDistanceToNow, format, parseISO } from 'date-fns';
import {
  ChevronDown, ChevronUp, MessageSquare, Trash2, Edit3, ArrowRight, Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  useActivityLog, useAddManualNote, useSoftDeleteLogEntry,
} from '@/hooks/useActivityLog';
import type {
  ActivityLogEntry, ActivityRecordType,
} from '@/lib/services/activityLog';
import { cn } from '@/lib/utils';

interface Props {
  recordType: ActivityRecordType;
  recordId: string | undefined;
  className?: string;
  defaultOpen?: boolean;
}

function initials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

function relativeTime(iso: string) {
  try {
    const d = parseISO(iso);
    const diff = Date.now() - d.getTime();
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return `${formatDistanceToNow(d)} ago`;
    }
    return format(d, 'MMM d, yyyy');
  } catch {
    return iso;
  }
}

function displayValue(v: string | null) {
  if (v == null || v === '') return '—';
  return v;
}

function EntryRow({
  entry, canDelete, onDelete, currentUserId, currentUserName,
}: {
  entry: ActivityLogEntry;
  canDelete: boolean;
  onDelete: (id: string) => void;
  currentUserId: string | undefined;
  currentUserName: string | undefined;
}) {
  const isSelf = entry.changed_by === currentUserId;
  const who = isSelf
    ? (currentUserName ?? 'You')
    : (entry.changed_by_name ?? 'A user');

  const meta = (
    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
      <span title={format(parseISO(entry.changed_at), 'PPpp')}>
        {relativeTime(entry.changed_at)}
      </span>
      {canDelete && (
        <Button
          variant="ghost" size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(entry.id)}
          aria-label="Delete entry"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );

  const body = (() => {
    switch (entry.action_type) {
      case 'created':
        return (
          <p className="text-sm">
            <span className="font-medium">{who}</span>{' '}
            <span className="text-muted-foreground">created this record</span>
          </p>
        );
      case 'status_change':
        return (
          <p className="text-sm flex flex-wrap items-center gap-1.5">
            <span className="font-medium">{who}</span>
            <span className="text-muted-foreground">changed status</span>
            <Badge variant="outline" className="text-[10px]">
              {displayValue(entry.old_value)}
            </Badge>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <Badge className="text-[10px]">
              {displayValue(entry.new_value)}
            </Badge>
          </p>
        );
      case 'field_change':
        return (
          <p className="text-sm">
            <span className="font-medium">{who}</span>{' '}
            <span className="text-muted-foreground">changed</span>{' '}
            <span className="font-medium">{entry.field_name}</span>{' '}
            <span className="text-muted-foreground">from</span>{' '}
            <span className="font-mono text-xs bg-muted px-1 rounded">
              {displayValue(entry.old_value)}
            </span>{' '}
            <span className="text-muted-foreground">to</span>{' '}
            <span className="font-mono text-xs bg-muted px-1 rounded">
              {displayValue(entry.new_value)}
            </span>
          </p>
        );
      case 'manual_note':
        return (
          <div className="text-sm">
            <p>
              <span className="font-medium">{who}</span>{' '}
              <span className="text-muted-foreground">added a note:</span>
            </p>
            <p className="mt-1 whitespace-pre-wrap">{entry.note_text}</p>
          </div>
        );
      case 'deleted':
        return (
          <p className="text-sm">
            <span className="font-medium">{who}</span>{' '}
            <span className="text-muted-foreground">deleted this record</span>
          </p>
        );
      default:
        return null;
    }
  })();

  const isNote = entry.action_type === 'manual_note';

  return (
    <div
      className={cn(
        'flex gap-3 p-3 rounded-md border',
        isNote
          ? 'bg-accent/40 border-accent'
          : 'bg-card border-border',
      )}
    >
      <Avatar className="h-8 w-8 mt-0.5 shrink-0">
        <AvatarFallback className="text-xs">{initials(who)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start gap-1.5">
          {isNote && <MessageSquare className="h-3.5 w-3.5 mt-1 text-muted-foreground shrink-0" />}
          <div className="flex-1 min-w-0">{body}</div>
        </div>
        {meta}
      </div>
    </div>
  );
}

export function LogNotesPanel({
  recordType, recordId, className, defaultOpen = true,
}: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(defaultOpen);
  const [limit, setLimit] = useState(20);
  const [note, setNote] = useState('');

  const isSuperAdmin = (user?.role ?? '').toLowerCase() === 'super_admin';

  const q = useActivityLog(recordType, recordId, limit);
  const addNote = useAddManualNote(recordType, recordId ?? '');
  const softDelete = useSoftDeleteLogEntry(recordType, recordId ?? '');

  const entries = q.data?.entries ?? [];
  const total = q.data?.total ?? 0;

  const handleAdd = async () => {
    const t = note.trim();
    if (!t || !recordId) return;
    try {
      await addNote.mutateAsync(t);
      setNote('');
    } catch (e: any) {
      toast({ title: 'Failed to add note', description: e?.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await softDelete.mutateAsync(id);
    } catch (e: any) {
      toast({ title: 'Failed to delete entry', description: e?.message, variant: 'destructive' });
    }
  };

  if (!recordId) return null;

  return (
    <Card className={className}>
      <CardHeader
        className="flex flex-row items-center justify-between cursor-pointer py-3"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">
            Activity Log <span className="text-muted-foreground">({total})</span>
          </h3>
        </div>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CardHeader>

      {open && (
        <CardContent className="space-y-4 pt-0">
          {/* Add note */}
          <div className="space-y-2">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder=""
              rows={2}
              className="resize-none"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={!note.trim() || addNote.isPending}
              >
                <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                {addNote.isPending ? 'Adding…' : 'Add Note'}
              </Button>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            {q.isLoading ? (
              <>
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </>
            ) : entries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No activity yet.
              </p>
            ) : (
              entries.map((e) => (
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
          </div>

          {/* Pagination */}
          {entries.length < total && (
            <div className="flex justify-center">
              <Button
                variant="outline" size="sm"
                onClick={() => setLimit((n) => n + 20)}
                disabled={q.isFetching}
              >
                {q.isFetching ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default LogNotesPanel;