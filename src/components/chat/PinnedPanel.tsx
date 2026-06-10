import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePinnedMessages, useUnpinMessage, useDirectory } from '@/hooks/chat';
import { MessageBody } from './MessageBody';
import { useToast } from '@/hooks/use-toast';

export function PinnedPanel({
  channelId, onClose, onJump,
}: { channelId: string; onClose: () => void; onJump: (messageId: string) => void }) {
  const { data: pinned = [], isLoading } = usePinnedMessages(channelId);
  const { data: directory = [] } = useDirectory();
  const unpin = useUnpinMessage();
  const { toast } = useToast();
  const nameById = new Map(directory.map((d) => [d.user_id, d.name]));

  return (
    <aside className="w-full md:w-96 border-l bg-card flex flex-col h-full">
      <header className="h-14 border-b px-4 flex items-center justify-between flex-shrink-0">
        <div className="font-semibold text-sm">Pinned messages</div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
      </header>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
          {!isLoading && pinned.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-8">No pinned messages yet.</div>
          )}
          {pinned.map((m) => (
            <div key={m.id} className="rounded-md border p-3 text-sm space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs">
                  <span className="font-medium">{m.user_id ? nameById.get(m.user_id) ?? 'User' : 'System'}</span>
                  <span className="text-muted-foreground"> · {new Date(m.created_at).toLocaleString()}</span>
                </div>
              </div>
              <div className="text-sm"><MessageBody body={m.body} /></div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="ghost" onClick={() => onJump(m.id)}>Jump to message</Button>
                <Button size="sm" variant="ghost" onClick={async () => {
                  try { await unpin.mutateAsync(m.id); toast({ title: 'Unpinned' }); }
                  catch (e: any) { toast({ title: 'Failed', description: e?.message, variant: 'destructive' }); }
                }}>Unpin</Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}