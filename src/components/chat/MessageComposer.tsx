import { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSendMessage } from '@/hooks/chat';
import { useToast } from '@/hooks/use-toast';

export function MessageComposer({ channelId }: { channelId: string }) {
  const [text, setText] = useState('');
  const send = useSendMessage(channelId);
  const { toast } = useToast();

  const submit = async () => {
    const body = text.trim();
    if (!body) return;
    try {
      await send.mutateAsync(body);
      setText('');
    } catch (e: any) {
      toast({ title: 'Failed to send', description: e?.message });
    }
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void submit();
    }
  };

  return (
    <div className="border-t bg-card p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <div className="flex items-end gap-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          placeholder="Type a message… (Ctrl/Cmd + Enter to send)"
          className="min-h-[44px] max-h-40 resize-none"
        />
        <Button onClick={submit} disabled={send.isPending || !text.trim()} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}