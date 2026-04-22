// Lightweight contentEditable-based rich text editor (no extra deps)
// Supports: bold, italic, underline, bulleted list, numbered list, link
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon, Strikethrough } from 'lucide-react';
import DOMPurify from 'dompurify';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start typing…',
  className,
  minHeight = '120px',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(!value);

  // Sync external value into editor only when it differs (avoids cursor jump while typing)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = DOMPurify.sanitize(value || '', {
        ALLOWED_TAGS: ['p','b','i','ul','ol','li','strong','em','br','span','a','s','u','div'],
        ALLOWED_ATTR: ['href','class','target','data-user-id','contenteditable'],
      });
      setIsEmpty(!value);
    }
  }, [value]);

  const exec = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    editorRef.current?.focus();
    handleInput();
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    setIsEmpty(!editorRef.current.textContent?.trim());
    onChange(html);
  };

  const insertLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) exec('createLink', url);
  };

  const ToolbarButton = ({ icon: Icon, command, arg, title }: { icon: any; command: string; arg?: string; title: string }) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); exec(command, arg); }}
      title={title}
      className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );

  return (
    <div className={cn('border border-border rounded-md bg-background overflow-hidden', className)}>
      <div className="flex items-center gap-0.5 border-b border-border bg-muted/30 px-1 py-1">
        <ToolbarButton icon={Bold} command="bold" title="Bold (Ctrl+B)" />
        <ToolbarButton icon={Italic} command="italic" title="Italic (Ctrl+I)" />
        <ToolbarButton icon={Underline} command="underline" title="Underline (Ctrl+U)" />
        <ToolbarButton icon={Strikethrough} command="strikeThrough" title="Strikethrough" />
        <div className="w-px h-4 bg-border mx-0.5" />
        <ToolbarButton icon={List} command="insertUnorderedList" title="Bulleted list" />
        <ToolbarButton icon={ListOrdered} command="insertOrderedList" title="Numbered list" />
        <div className="w-px h-4 bg-border mx-0.5" />
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); insertLink(); }}
          title="Insert link"
          className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onBlur={handleInput}
          className="prose prose-sm max-w-none px-3 py-2 text-sm focus:outline-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-primary [&_a]:underline"
          style={{ minHeight }}
        />
        {isEmpty && (
          <div className="absolute top-2 left-3 text-sm text-muted-foreground pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}
