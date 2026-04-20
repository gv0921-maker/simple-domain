// Rich composer for CRM chatter — formatting toolbar, file attachments (base64), @user mentions.
// Built on top of the lightweight contentEditable RichTextEditor pattern.
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon, Strikethrough, Paperclip, AtSign, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DEMO_USERS } from '@/lib/storage';

export interface ComposerAttachment {
  name: string;
  url: string; // base64 data URL or external URL
  type: string;
  size?: number;
}

export interface RichComposerSubmit {
  html: string;
  attachments: ComposerAttachment[];
  mentions: string[]; // user names mentioned via @
}

interface RichComposerProps {
  placeholder?: string;
  submitLabel?: string;
  submitClassName?: string;
  onSubmit: (payload: RichComposerSubmit) => void;
  className?: string;
  minHeight?: string;
  autoFocus?: boolean;
}

const MENTIONABLE_USERS = DEMO_USERS.map(u => u.name);

export function RichComposer({
  placeholder = 'Write something…',
  submitLabel = 'Send',
  submitClassName,
  onSubmit,
  className,
  minHeight = '80px',
  autoFocus = false,
}: RichComposerProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);

  useEffect(() => {
    if (autoFocus) editorRef.current?.focus();
  }, [autoFocus]);

  const exec = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    editorRef.current?.focus();
    handleInput();
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    setIsEmpty(!editorRef.current.textContent?.trim());

    // Detect "@<query>" at caret
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const node = range.startContainer;
      if (node.nodeType === Node.TEXT_NODE) {
        const text = (node.textContent || '').slice(0, range.startOffset);
        const match = text.match(/@(\w*)$/);
        if (match) {
          setMentionQuery(match[1].toLowerCase());
          setMentionIndex(0);
          return;
        }
      }
    }
    setMentionQuery(null);
  };

  const insertLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) exec('createLink', url);
  };

  const filteredMentions = mentionQuery !== null
    ? MENTIONABLE_USERS.filter(u => u.toLowerCase().includes(mentionQuery))
    : [];

  const completeMention = (name: string) => {
    if (!editorRef.current) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return;
    const text = node.textContent || '';
    const before = text.slice(0, range.startOffset);
    const after = text.slice(range.startOffset);
    const m = before.match(/@(\w*)$/);
    if (!m) return;
    const newBefore = before.slice(0, m.index);
    // Replace the @query with a mention chip span
    const span = document.createElement('span');
    span.contentEditable = 'false';
    span.dataset.mention = name;
    span.className = 'inline-block bg-primary/10 text-primary rounded px-1 mx-0.5 text-xs font-medium';
    span.textContent = `@${name}`;
    const spaceNode = document.createTextNode('\u00A0');
    const beforeNode = document.createTextNode(newBefore);
    const afterNode = document.createTextNode(after);
    const parent = node.parentNode;
    if (!parent) return;
    parent.replaceChild(afterNode, node);
    parent.insertBefore(spaceNode, afterNode);
    parent.insertBefore(span, spaceNode);
    parent.insertBefore(beforeNode, span);
    // Move caret after space
    const newRange = document.createRange();
    newRange.setStartAfter(spaceNode);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
    setMentionQuery(null);
    handleInput();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mentionQuery !== null && filteredMentions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(i => (i + 1) % filteredMentions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(i => (i - 1 + filteredMentions.length) % filteredMentions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        completeMention(filteredMentions[mentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setMentionQuery(null);
        return;
      }
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
      // Cap each file at 5 MB to keep localStorage manageable
      if (file.size > 5 * 1024 * 1024) {
        alert(`"${file.name}" exceeds 5 MB and was skipped.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments(prev => [...prev, {
          name: file.name,
          url: reader.result as string,
          type: file.type || 'application/octet-stream',
          size: file.size,
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const text = editorRef.current.textContent?.trim() || '';
    if (!text && attachments.length === 0) return;
    // Extract mentions
    const mentions = Array.from(editorRef.current.querySelectorAll('[data-mention]'))
      .map(el => (el as HTMLElement).dataset.mention || '')
      .filter(Boolean);
    onSubmit({ html, attachments, mentions });
    editorRef.current.innerHTML = '';
    setAttachments([]);
    setIsEmpty(true);
  };

  return (
    <div className={cn('border border-border rounded-md bg-background', className)}>
      <div className="flex items-center gap-0.5 border-b border-border bg-muted/30 px-1 py-1">
        <ToolbarButton icon={Bold} title="Bold" onClick={() => exec('bold')} />
        <ToolbarButton icon={Italic} title="Italic" onClick={() => exec('italic')} />
        <ToolbarButton icon={Underline} title="Underline" onClick={() => exec('underline')} />
        <ToolbarButton icon={Strikethrough} title="Strikethrough" onClick={() => exec('strikeThrough')} />
        <div className="w-px h-4 bg-border mx-0.5" />
        <ToolbarButton icon={List} title="Bulleted list" onClick={() => exec('insertUnorderedList')} />
        <ToolbarButton icon={ListOrdered} title="Numbered list" onClick={() => exec('insertOrderedList')} />
        <div className="w-px h-4 bg-border mx-0.5" />
        <ToolbarButton icon={LinkIcon} title="Insert link" onClick={insertLink} />
        <ToolbarButton icon={AtSign} title="Mention user" onClick={() => {
          // Insert "@" and trigger menu
          exec('insertText', '@');
        }} />
        <ToolbarButton icon={Paperclip} title="Attach file" onClick={() => fileInputRef.current?.click()} />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
        />
      </div>
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onBlur={handleInput}
          className="px-3 py-2 text-sm focus:outline-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-primary [&_a]:underline"
          style={{ minHeight }}
        />
        {isEmpty && (
          <div className="absolute top-2 left-3 text-sm text-muted-foreground pointer-events-none">
            {placeholder}
          </div>
        )}
        {/* Mention dropdown */}
        {mentionQuery !== null && filteredMentions.length > 0 && (
          <div className="absolute z-20 bg-popover border border-border rounded-md shadow-md left-3 mt-1 min-w-[180px]">
            {filteredMentions.map((name, i) => (
              <button
                key={name}
                onMouseDown={(e) => { e.preventDefault(); completeMention(name); }}
                className={cn(
                  'w-full text-left px-3 py-1.5 text-sm hover:bg-muted',
                  i === mentionIndex && 'bg-muted'
                )}
              >
                @{name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="px-3 py-2 border-t border-border flex flex-wrap gap-2">
          {attachments.map((a, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-muted rounded px-2 py-1 text-xs">
              <Paperclip className="h-3 w-3 text-muted-foreground" />
              <span className="truncate max-w-[160px]">{a.name}</span>
              <button
                onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}
                className="text-muted-foreground hover:text-destructive"
                title="Remove"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 px-2 py-1.5 border-t border-border">
        <Button size="sm" className={cn('h-7 text-xs px-3', submitClassName)} onClick={handleSubmit}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

function ToolbarButton({ icon: Icon, title, onClick }: { icon: any; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
