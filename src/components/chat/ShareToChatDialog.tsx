import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hash, Lock, MessageCircle, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChannels, useSendMessageWithResource } from '@/hooks/chat';
import { useToast } from '@/hooks/use-toast';
import type { ResourceType } from '@/lib/services/chat/api';

export function ShareToChatDialog({
  open, onOpenChange, resourceType, resourceId, resourceLabel,
}: {
  open: boolean; onOpenChange: (o: boolean) => void;
  resourceType: ResourceType; resourceId: string; resourceLabel: string;
}) {
  const navigate = useNavigate();
  const { data: channels = [] } = useChannels();
  const send = useSendMessageWithResource();
  const [filter, setFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const { toast } = useToast();

  const filtered = channels.filter((c) => c.name.toLowerCase().includes(filter.toLowerCase()));

  const handleSend = async () => {
    if (!selectedId) return;
    try {
      await send.mutateAsync({
        channelId: selectedId, body: note.trim(),
        resourceType, resourceId, resourceLabel,
      });
      toast({ title: 'Shared to chat' });
      onOpenChange(false);
      navigate(`/chat/channels/${selectedId}`);
    } catch (e: any) {
      toast({ title: 'Failed', description: e?.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Share to chat</DialogTitle></DialogHeader>
        <div className="text-xs text-muted-foreground">Sharing: <span className="font-medium">{resourceLabel}</span></div>
        <Input placeholder="Filter conversations…" value={filter} onChange={(e) => setFilter(e.target.value)} />
        <ScrollArea className="h-60 border rounded-md">
          {filtered.length === 0 && <div className="p-3 text-sm text-muted-foreground">No conversations</div>}
          {filtered.map((c) => {
            const Icon = c.type === 'dm' ? MessageCircle : c.is_private ? Lock : c.type === 'group' ? Users : Hash;
            return (
              <button key={c.id} type="button" onClick={() => setSelectedId(c.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted ${selectedId === c.id ? 'bg-muted' : ''}`}>
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{c.name.replace(/^#\s*/, '')}</span>
              </button>
            );
          })}
        </ScrollArea>
        <Textarea placeholder="Add a message (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSend} disabled={!selectedId || send.isPending}>Send</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ShareToChatButton(props: {
  resourceType: ResourceType; resourceId: string; resourceLabel: string;
  size?: 'default' | 'sm'; variant?: 'default' | 'outline' | 'ghost';
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size={props.size ?? 'sm'} variant={props.variant ?? 'outline'} onClick={() => setOpen(true)}>
        <MessageCircle className="h-4 w-4 mr-1" /> Share to Chat
      </Button>
      <ShareToChatDialog
        open={open} onOpenChange={setOpen}
        resourceType={props.resourceType} resourceId={props.resourceId} resourceLabel={props.resourceLabel}
      />
    </>
  );
}