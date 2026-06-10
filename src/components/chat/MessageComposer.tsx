import { useEffect, useMemo, useRef, useState, KeyboardEvent, ClipboardEvent, DragEvent } from 'react';
import { Send, Paperclip, X, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  useChannelMembers, useDirectory, useSendRichMessage, useSendThreadReply, useUploadAttachment,
} from '@/hooks/chat';
import { useToast } from '@/hooks/use-toast';
import { extractMentions, MAX_ATTACHMENT_BYTES, type PendingAttachment } from '@/lib/services/chat/api';
import { cn } from '@/lib/utils';

interface Props {
  channelId: string;
  parentMessageId?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

interface PendingFile {
  id: string;
  file: File;
  uploading: boolean;
  uploaded?: PendingAttachment;
  error?: string;
}

export function MessageComposer({ channelId, parentMessageId, placeholder, autoFocus }: Props) {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIdx, setMentionIdx] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const sendMain = useSendRichMessage(channelId);
  const sendThread = useSendThreadReply(parentMessageId, channelId);
  const upload = useUploadAttachment(channelId);
  const { data: directory = [] } = useDirectory();
  const { data: members = [] } = useChannelMembers(channelId);
  const { toast } = useToast();

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus, parentMessageId]);

  const memberDirectory = useMemo(() => {
    const memberIds = new Set(members.map((m) => m.user_id));
    return directory.filter((d) => memberIds.has(d.user_id));
  }, [directory, members]);

  const mentionCandidates = useMemo(() => {
    const q = mentionQuery.toLowerCase();
    return memberDirectory
      .filter((d) => d.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [memberDirectory, mentionQuery]);

  const handleTextChange = (val: string) => {
    setText(val);
    const ta = textareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart ?? val.length;
    const before = val.slice(0, pos);
    const m = /(^|\s)@([A-Za-z0-9._-]*)$/.exec(before);
    if (m) {
      setMentionOpen(true);
      setMentionQuery(m[2]);
      setMentionIdx(0);
    } else {
      setMentionOpen(false);
    }
  };

  const insertMention = (name: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart ?? text.length;
    const before = text.slice(0, pos);
    const after = text.slice(pos);
    const replaced = before.replace(/(^|\s)@([A-Za-z0-9._-]*)$/, `$1@${name} `);
    const next = replaced + after;
    setText(next);
    setMentionOpen(false);
    requestAnimationFrame(() => {
      ta.focus();
      const caret = replaced.length;
      ta.setSelectionRange(caret, caret);
    });
  };

  const handleFiles = async (list: FileList | File[]) => {
    const arr = Array.from(list);
    for (const f of arr) {
      if (f.size > MAX_ATTACHMENT_BYTES) {
        toast({ title: 'File too large', description: `${f.name} exceeds 25 MB`, variant: 'destructive' });
        continue;
      }
      const id = `${Date.now()}-${Math.random()}`;
      setFiles((prev) => [...prev, { id, file: f, uploading: true }]);
      try {
        const uploaded = await upload.mutateAsync(f);
        setFiles((prev) => prev.map((p) => p.id === id ? { ...p, uploading: false, uploaded } : p));
      } catch (e: any) {
        setFiles((prev) => prev.map((p) => p.id === id ? { ...p, uploading: false, error: e?.message ?? 'Upload failed' } : p));
        toast({ title: 'Upload failed', description: e?.message, variant: 'destructive' });
      }
    }
  };

  const removeFile = (id: string) => setFiles((p) => p.filter((f) => f.id !== id));

  const submit = async () => {
    const body = text.trim();
    const attachments = files.filter((f) => f.uploaded).map((f) => f.uploaded!) as PendingAttachment[];
    if (!body && attachments.length === 0) return;
    if (files.some((f) => f.uploading)) {
      toast({ title: 'Wait for uploads to finish' });
      return;
    }
    const mentionedUserIds = extractMentions(body, memberDirectory);
    try {
      const payload = { body, attachments, mentionedUserIds };
      if (parentMessageId) await sendThread.mutateAsync(payload);
      else await sendMain.mutateAsync(payload);
      setText('');
      setFiles([]);
    } catch (e: any) {
      toast({ title: 'Failed to send', description: e?.message, variant: 'destructive' });
    }
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionOpen && mentionCandidates.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIdx((i) => Math.min(i + 1, mentionCandidates.length - 1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIdx((i) => Math.max(i - 1, 0)); return; }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(mentionCandidates[mentionIdx].name);
        return;
      }
      if (e.key === 'Escape') { setMentionOpen(false); return; }
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void submit();
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.files;
    if (items && items.length > 0) {
      e.preventDefault();
      void handleFiles(items);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) void handleFiles(e.dataTransfer.files);
  };

  const isPending = sendMain.isPending || sendThread.isPending;

  return (
    <div
      className={cn(
        'relative border-t bg-card p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]',
        dragOver && 'ring-2 ring-primary ring-inset',
      )}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      {files.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-2 rounded border bg-muted/40 pl-2 pr-1 py-1 text-xs">
              {f.uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              <span className="max-w-[160px] truncate">{f.file.name}</span>
              <button type="button" className="rounded p-0.5 hover:bg-muted" onClick={() => removeFile(f.id)}>
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative flex items-end gap-2">
        <div className="flex flex-col gap-1">
          <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="md:hidden" onClick={() => cameraInputRef.current?.click()}>
            <Camera className="h-4 w-4" />
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files) void handleFiles(e.target.files); e.target.value = ''; }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => { if (e.target.files) void handleFiles(e.target.files); e.target.value = ''; }}
        />
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          onKeyDown={onKey}
          onPaste={onPaste}
          placeholder={placeholder ?? 'Type a message… (Ctrl/Cmd + Enter to send, @ to mention)'}
          className="min-h-[44px] max-h-40 resize-none"
        />
        <Button onClick={submit} disabled={isPending || (!text.trim() && files.filter((f) => f.uploaded).length === 0)} size="icon">
          <Send className="h-4 w-4" />
        </Button>

        {mentionOpen && mentionCandidates.length > 0 && (
          <div className="absolute bottom-full left-12 mb-2 w-64 rounded-md border bg-popover shadow-md z-20 max-h-60 overflow-auto">
            {mentionCandidates.map((c, i) => (
              <button
                key={c.user_id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); insertMention(c.name); }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm hover:bg-muted',
                  i === mentionIdx && 'bg-muted',
                )}
              >
                @{c.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}