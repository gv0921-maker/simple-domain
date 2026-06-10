import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSearchMessages } from '@/hooks/chat';
import { highlightSnippet } from '@/lib/services/chat/api';

export function ChatSearchDropdown({ onResultClick }: { onResultClick?: () => void }) {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  useEffect(() => { const t = setTimeout(() => setDebounced(q), 250); return () => clearTimeout(t); }, [q]);

  const { data: results = [], isFetching } = useSearchMessages(debounced, null);

  return (
    <div className="relative">
      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      <Input
        className="pl-7 h-8"
        placeholder="Search messages…"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && debounced.length >= 2 && (
        <div className="absolute left-0 right-0 top-full mt-1 max-h-80 overflow-auto rounded-md border bg-popover shadow-md z-30">
          {isFetching && <div className="p-3 text-xs text-muted-foreground">Searching…</div>}
          {!isFetching && results.length === 0 && (
            <div className="p-3 text-xs text-muted-foreground">No matches</div>
          )}
          {results.slice(0, 10).map((r) => (
            <button key={r.message.id} type="button" className="w-full text-left px-3 py-2 hover:bg-muted text-sm border-b last:border-0"
              onMouseDown={(e) => {
                e.preventDefault();
                navigate(`/chat/channels/${r.message.channel_id}#message-${r.message.id}`);
                onResultClick?.();
                setOpen(false);
              }}>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {r.channel?.name?.replace(/^#\s*/, '') ?? 'Channel'} · {r.sender_name ?? 'User'} · {new Date(r.message.created_at).toLocaleDateString()}
              </div>
              <div className="text-xs">
                {highlightSnippet(r.snippet, debounced).map((p, i) =>
                  p.hit ? <mark key={i} className="bg-primary/20 text-foreground rounded px-0.5">{p.text}</mark> : <span key={i}>{p.text}</span>
                )}
              </div>
            </button>
          ))}
          {results.length > 10 && (
            <button type="button" className="w-full text-center px-3 py-2 text-xs text-primary hover:bg-muted"
              onMouseDown={(e) => { e.preventDefault(); navigate(`/chat/search?q=${encodeURIComponent(debounced)}`); setOpen(false); }}>
              View all {results.length} results
            </button>
          )}
        </div>
      )}
    </div>
  );
}