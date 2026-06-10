import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useChannels, useSearchMessages } from '@/hooks/chat';
import { highlightSnippet } from '@/lib/services/chat/api';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function Inner() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const initialQ = params.get('q') ?? '';
  const [q, setQ] = useState(initialQ);
  const [debounced, setDebounced] = useState(initialQ);
  const [channelFilter, setChannelFilter] = useState<string>('');
  const { data: channels = [] } = useChannels();

  useEffect(() => { const t = setTimeout(() => { setDebounced(q); setParams((p) => { p.set('q', q); return p; }); }, 250); return () => clearTimeout(t); }, [q, setParams]);

  const { data: results = [], isFetching } = useSearchMessages(debounced, channelFilter || null);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <h1 className="text-xl font-semibold">Search messages</h1>
        <div className="flex gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" autoFocus />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Label className="text-xs">Channel:</Label>
          <select
            className="border rounded px-2 py-1 text-sm bg-background"
            value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)}>
            <option value="">All</option>
            {channels.map((c) => <option key={c.id} value={c.id}>{c.name.replace(/^#\s*/, '')}</option>)}
          </select>
        </div>
        <div className="border rounded-md divide-y">
          {isFetching && <div className="p-4 text-sm text-muted-foreground">Searching…</div>}
          {!isFetching && debounced.length < 2 && (
            <div className="p-4 text-sm text-muted-foreground">Type at least 2 characters.</div>
          )}
          {!isFetching && debounced.length >= 2 && results.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground">No matches.</div>
          )}
          {results.map((r) => (
            <button key={r.message.id} type="button" className="w-full text-left p-3 hover:bg-muted"
              onClick={() => navigate(`/chat/channels/${r.message.channel_id}#message-${r.message.id}`)}>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {r.channel?.name?.replace(/^#\s*/, '') ?? 'Channel'} · {r.sender_name ?? 'User'} · {new Date(r.message.created_at).toLocaleString()}
              </div>
              <div className="text-sm mt-0.5">
                {highlightSnippet(r.snippet, debounced).map((p, i) =>
                  p.hit ? <mark key={i} className="bg-primary/20 text-foreground rounded px-0.5">{p.text}</mark> : <span key={i}>{p.text}</span>
                )}
              </div>
            </button>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>Back</Button>
      </div>
    </AppLayout>
  );
}

export default function ChatSearchPage() {
  return <ErrorBoundary label="ChatSearch"><Inner /></ErrorBoundary>;
}