// Rich composer = RichTextEditor + file attachments (base64) + @mentions autocomplete.
// Stays 100% client-side, no extra dependencies.
import { useRef, useState, useCallback, useEffect } from 'react';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Button } from '@/components/ui/button';
import { Paperclip, X, AtSign, Send, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEMO_USERS } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import DOMPurify from 'dompurify';

const SANITIZE_CONFIG = {
  ALLOWED_TAGS: ['p','b','i','ul','ol','li','strong','em','br','span','a','s','u','div'],
  ALLOWED_ATTR: ['href','class','target','data-user-id','contenteditable'],
};

export interface RichAttachment {
  name: string;
  type: string;
  size?: number;
  dataUrl?: string;
  url?: string;
}

export interface RichComposerValue {
  html: string;
  mentions: string[]; // user IDs
  attachments: RichAttachment[];
}

interface RichComposerProps {
  placeholder?: string;
  submitLabel?: string;
  onSubmit: (value: RichComposerValue) => void;
  className?: string;
  compact?: boolean;
}

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB

export function RichComposer({
  placeholder = 'Type your message…',
  submitLabel = 'Send',
  onSubmit,
  className,
  compact = false,
}: RichComposerProps) {
  const { toast } = useToast();
  const [html, setHtml] = useState('');
  const [attachments, setAttachments] = useState<RichAttachment[]>([]);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList) => {
    const next: RichAttachment[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_BYTES) {
        toast({ title: `${file.name} exceeds 5MB`, variant: 'destructive' });
        continue;
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      next.push({ name: file.name, type: file.type, size: file.size, dataUrl });
    }
    setAttachments(prev => [...prev, ...next]);
  }, [toast]);

  const removeAttachment = (idx: number) =>
    setAttachments(prev => prev.filter((_, i) => i !== idx));

  // Detect @ at end-of-text to open the mention menu
  useEffect(() => {
    const text = stripHtml(html);
    const match = text.match(/@(\w*)$/);
    if (match) {
      setMentionQuery(match[1].toLowerCase());
      setShowMentionMenu(true);
    } else {
      setShowMentionMenu(false);
    }
  }, [html]);

  const filteredUsers = DEMO_USERS.filter(u =>
    u.name.toLowerCase().includes(mentionQuery) || u.email.toLowerCase().includes(mentionQuery)
  );

  const insertMention = (user: { id: string; name: string }) => {
    // Replace trailing @query with mention chip
    const replaced = html.replace(
      /@(\w*)(?!.*@)/,
      `<span class="mention" data-user-id="${user.id}" contenteditable="false">@${user.name}</span>&nbsp;`
    );
    setHtml(replaced);
    setShowMentionMenu(false);
  };

  const extractMentions = (htmlContent: string): string[] => {
    const matches = htmlContent.match(/data-user-id="([^"]+)"/g) || [];
    return Array.from(new Set(matches.map(m => m.replace(/data-user-id="|"/g, ''))));
  };

  const handleSubmit = () => {
    const text = stripHtml(html).trim();
    if (!text && attachments.length === 0) return;
    onSubmit({
      html,
      mentions: extractMentions(html),
      attachments,
    });
    setHtml('');
    setAttachments([]);
  };

  return (
    <div className={cn('relative', className)}>
      <RichTextEditor
        value={html}
        onChange={setHtml}
        placeholder={placeholder}
        minHeight={compact ? '80px' : '120px'}
      />

      {/* Mention menu */}
      {showMentionMenu && filteredUsers.length > 0 && (
        <div className="absolute z-50 mt-1 left-2 bg-popover border border-border rounded-md shadow-lg w-64 max-h-56 overflow-y-auto">
          {filteredUsers.map(u => (
            <button
              key={u.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); insertMention(u); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
            >
              <AtSign className="h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <div className="font-medium">{u.name}</div>
                <div className="text-xs text-muted-foreground">{u.email}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {attachments.map((a, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-muted rounded-md px-2 py-1 text-xs">
              <FileText className="h-3 w-3" />
              <span className="max-w-[160px] truncate">{a.name}</span>
              {a.size !== undefined && (
                <span className="text-muted-foreground">({Math.round(a.size / 1024)}KB)</span>
              )}
              <button
                type="button"
                onClick={() => removeAttachment(i)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1">
          <input
            type="file"
            ref={fileInputRef}
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-3.5 w-3.5" />
            Attach
          </Button>
          <span className="text-xs text-muted-foreground">Type @ to mention</span>
        </div>
        <Button
          type="button"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={handleSubmit}
        >
          <Send className="h-3.5 w-3.5" />
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || '';
}

// Reusable renderer for rich content with mentions + attachments
export function RichContent({
  html,
  attachments,
  className,
}: {
  html?: string;
  attachments?: RichAttachment[];
  className?: string;
}) {
  return (
    <div className={className}>
      {html && (
        <div
          className="prose prose-sm max-w-none text-sm [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-primary [&_a]:underline [&_strong]:font-semibold [&_.mention]:bg-primary/10 [&_.mention]:text-primary [&_.mention]:px-1 [&_.mention]:rounded [&_.mention]:font-medium"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html, SANITIZE_CONFIG) }}
        />
      )}
      {attachments && attachments.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {attachments.map((a, i) => (
            <a
              key={i}
              href={a.dataUrl || a.url || '#'}
              download={a.name}
              className="flex items-center gap-1.5 bg-muted hover:bg-muted/70 rounded-md px-2 py-1 text-xs transition-colors"
            >
              <FileText className="h-3 w-3" />
              <span className="max-w-[180px] truncate">{a.name}</span>
              {a.size !== undefined && (
                <span className="text-muted-foreground">({Math.round(a.size / 1024)}KB)</span>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
