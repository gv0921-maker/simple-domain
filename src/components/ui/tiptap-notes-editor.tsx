// Tiptap-powered rich notes editor with tables and Word-like formatting.
// Used on Opportunity / Contact detail pages where users need richer notes
// than the simple RichTextEditor (which is contentEditable-based).
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, Quote, Code, Link as LinkIcon,
  AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, Heading3,
  Table as TableIcon, Trash2, Plus, Minus, Undo, Redo,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TiptapNotesEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
}

export function TiptapNotesEditor({
  value,
  onChange,
  placeholder = 'Write your notes…',
  minHeight = '220px',
  className,
}: TiptapNotesEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary underline' },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true, HTMLAttributes: { class: 'tt-table' } }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'tiptap-notes prose prose-sm max-w-none focus:outline-none px-3 py-2',
      },
    },
  });

  // Sync external value changes (e.g. discard, navigation) without losing cursor while typing.
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value && !editor.isFocused) {
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className={cn('border border-border rounded-md bg-background overflow-hidden', className)}>
      <Toolbar editor={editor} />
      <div style={{ minHeight }} className="overflow-auto">
        <EditorContent editor={editor} />
      </div>
      <style>{`
        .tiptap-notes p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: hsl(var(--muted-foreground));
          pointer-events: none;
          height: 0;
        }
        .tiptap-notes table { border-collapse: collapse; margin: 0.5rem 0; table-layout: fixed; width: 100%; overflow: hidden; }
        .tiptap-notes table td, .tiptap-notes table th {
          border: 1px solid hsl(var(--border));
          padding: 6px 8px; vertical-align: top; min-width: 60px; position: relative;
        }
        .tiptap-notes table th { background: hsl(var(--muted)); font-weight: 600; text-align: left; }
        .tiptap-notes table .selectedCell::after {
          content: ''; position: absolute; inset: 0; background: hsl(var(--primary) / 0.1); pointer-events: none;
        }
        .tiptap-notes ul { list-style: disc; padding-left: 1.25rem; }
        .tiptap-notes ol { list-style: decimal; padding-left: 1.25rem; }
        .tiptap-notes blockquote {
          border-left: 3px solid hsl(var(--border)); padding-left: 0.75rem;
          color: hsl(var(--muted-foreground)); margin: 0.5rem 0;
        }
        .tiptap-notes h1 { font-size: 1.5rem; font-weight: 700; margin: 0.5rem 0; }
        .tiptap-notes h2 { font-size: 1.25rem; font-weight: 700; margin: 0.5rem 0; }
        .tiptap-notes h3 { font-size: 1.1rem; font-weight: 600; margin: 0.4rem 0; }
        .tiptap-notes code { background: hsl(var(--muted)); padding: 1px 4px; border-radius: 3px; font-size: 0.85em; }
      `}</style>
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const Btn = ({
    onClick, active, disabled, title, children,
  }: { onClick: () => void; active?: boolean; disabled?: boolean; title: string; children: React.ReactNode }) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      disabled={disabled}
      className={cn(
        'h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors',
        active && 'bg-muted text-foreground',
        disabled && 'opacity-40 cursor-not-allowed',
      )}
    >
      {children}
    </button>
  );
  const Sep = () => <div className="w-px h-4 bg-border mx-0.5" />;

  const insertLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Enter URL:', prev || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
  };

  return (
    <div className="flex items-center gap-0.5 border-b border-border bg-muted/30 px-1 py-1 flex-wrap">
      <Btn title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
        <Undo className="h-3.5 w-3.5" />
      </Btn>
      <Btn title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
        <Redo className="h-3.5 w-3.5" />
      </Btn>
      <Sep />
      <Btn title="Heading 1" active={editor.isActive('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
        <Heading1 className="h-3.5 w-3.5" />
      </Btn>
      <Btn title="Heading 2" active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 className="h-3.5 w-3.5" />
      </Btn>
      <Btn title="Heading 3" active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        <Heading3 className="h-3.5 w-3.5" />
      </Btn>
      <Sep />
      <Btn title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="h-3.5 w-3.5" />
      </Btn>
      <Btn title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="h-3.5 w-3.5" />
      </Btn>
      <Btn title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <UnderlineIcon className="h-3.5 w-3.5" />
      </Btn>
      <Btn title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough className="h-3.5 w-3.5" />
      </Btn>
      <Btn title="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
        <Code className="h-3.5 w-3.5" />
      </Btn>
      <Sep />
      <Btn title="Bulleted list" active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="h-3.5 w-3.5" />
      </Btn>
      <Btn title="Numbered list" active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="h-3.5 w-3.5" />
      </Btn>
      <Btn title="Quote" active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote className="h-3.5 w-3.5" />
      </Btn>
      <Sep />
      <Btn title="Align left" active={editor.isActive({ textAlign: 'left' })}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}>
        <AlignLeft className="h-3.5 w-3.5" />
      </Btn>
      <Btn title="Align center" active={editor.isActive({ textAlign: 'center' })}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}>
        <AlignCenter className="h-3.5 w-3.5" />
      </Btn>
      <Btn title="Align right" active={editor.isActive({ textAlign: 'right' })}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}>
        <AlignRight className="h-3.5 w-3.5" />
      </Btn>
      <Sep />
      <Btn title="Insert link" active={editor.isActive('link')} onClick={insertLink}>
        <LinkIcon className="h-3.5 w-3.5" />
      </Btn>
      <Sep />
      <Btn title="Insert table"
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
        <TableIcon className="h-3.5 w-3.5" />
      </Btn>
      {editor.isActive('table') && (
        <>
          <Btn title="Add column" onClick={() => editor.chain().focus().addColumnAfter().run()}>
            <Plus className="h-3.5 w-3.5" />
          </Btn>
          <Btn title="Delete column" onClick={() => editor.chain().focus().deleteColumn().run()}>
            <Minus className="h-3.5 w-3.5" />
          </Btn>
          <Btn title="Add row" onClick={() => editor.chain().focus().addRowAfter().run()}>
            <span className="text-[10px] font-bold">+R</span>
          </Btn>
          <Btn title="Delete row" onClick={() => editor.chain().focus().deleteRow().run()}>
            <span className="text-[10px] font-bold">-R</span>
          </Btn>
          <Btn title="Delete table" onClick={() => editor.chain().focus().deleteTable().run()}>
            <Trash2 className="h-3.5 w-3.5" />
          </Btn>
        </>
      )}
    </div>
  );
}

// Renderer for saved tiptap HTML (read-only)
export function TiptapNotesContent({ html, className }: { html?: string; className?: string }) {
  if (!html) return null;
  return (
    <div
      className={cn(
        'prose prose-sm max-w-none text-sm',
        '[&_table]:border-collapse [&_table]:my-2 [&_table]:w-full',
        '[&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_td]:align-top',
        '[&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_th]:bg-muted [&_th]:font-semibold [&_th]:text-left',
        '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5',
        '[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground',
        '[&_a]:text-primary [&_a]:underline [&_strong]:font-semibold',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}