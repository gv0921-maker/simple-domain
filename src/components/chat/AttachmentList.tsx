import { useState } from 'react';
import { FileText, Download, Image as ImageIcon, FileAudio, FileVideo } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { ChatAttachment } from '@/lib/services/chat/api';

function humanSize(bytes: number) {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0; let n = bytes;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n < 10 ? 1 : 0)} ${units[i]}`;
}

function iconFor(t: string) {
  if (t === 'image') return ImageIcon;
  if (t === 'audio') return FileAudio;
  if (t === 'video') return FileVideo;
  return FileText;
}

export function AttachmentList({ items }: { items: ChatAttachment[] }) {
  const [lightbox, setLightbox] = useState<ChatAttachment | null>(null);
  if (!items.length) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap gap-2">
        {items.filter((a) => a.file_type === 'image').map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setLightbox(a)}
            className="rounded border overflow-hidden bg-muted hover:opacity-90 transition"
          >
            <img
              src={a.thumbnail_url ?? a.file_url}
              alt={a.file_name}
              className="max-h-48 max-w-xs object-contain"
              loading="lazy"
            />
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        {items.filter((a) => a.file_type !== 'image').map((a) => {
          const Icon = iconFor(a.file_type);
          return (
            <a
              key={a.id}
              href={a.file_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded border bg-card px-3 py-2 hover:bg-muted/60 transition text-sm max-w-md"
            >
              <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="truncate font-medium">{a.file_name}</div>
                <div className="text-xs text-muted-foreground">{humanSize(a.file_size)}</div>
              </div>
              <Download className="h-4 w-4 text-muted-foreground" />
            </a>
          );
        })}
      </div>

      <Dialog open={!!lightbox} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="max-w-5xl w-[calc(100vw-2rem)] p-2 bg-background">
          <DialogTitle className="sr-only">{lightbox?.file_name ?? 'Image'}</DialogTitle>
          {lightbox && (
            <img
              src={lightbox.file_url}
              alt={lightbox.file_name}
              className="w-full max-h-[80vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}