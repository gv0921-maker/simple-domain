import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Hash, Lock, Users, MessageCircle, Plus, Menu, Search, AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChannels, useUnreadMentionCount } from '@/hooks/chat';
import { cn } from '@/lib/utils';
import { NewChatDialog } from './NewChatDialog';

export function ChatSidebar({ onPick }: { onPick?: () => void }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: channels = [] } = useChannels();
  const { data: unreadMentions = 0 } = useUnreadMentionCount();
  const [search, setSearch] = useState('');
  const [newOpen, setNewOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return channels;
    return channels.filter((c) => c.name.toLowerCase().includes(q));
  }, [channels, search]);

  const channelList = filtered.filter((c) => c.type === 'channel');
  const dms = filtered.filter((c) => c.type === 'dm');
  const groups = filtered.filter((c) => c.type === 'group');

  const renderItem = (c: typeof channels[number]) => {
    const Icon = c.type === 'dm' ? MessageCircle : c.is_private ? Lock : c.type === 'group' ? Users : Hash;
    const active = c.id === id;
    return (
      <button
        key={c.id}
        onClick={() => { navigate(`/chat/channels/${c.id}`); onPick?.(); }}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted/60 transition text-left',
          active && 'bg-muted font-medium'
        )}
      >
        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="truncate flex-1">{c.name.replace(/^#\s*/, '')}</span>
      </button>
    );
  };

  const section = (label: string, items: typeof channels) =>
    items.length > 0 && (
      <div className="mb-4">
        <div className="px-3 mb-1 text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</div>
        <div className="space-y-0.5">{items.map(renderItem)}</div>
      </div>
    );

  return (
    <aside className="w-full md:w-80 border-r bg-card flex flex-col h-full">
      <div className="p-3 border-b space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Chat</h2>
          <Button size="sm" onClick={() => setNewOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> New
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input className="pl-7 h-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="py-3">
          <button
            onClick={() => { navigate('/chat/mentions'); onPick?.(); }}
            className="w-full flex items-center gap-2 px-3 py-2 mb-2 rounded-md text-sm hover:bg-muted/60 transition text-left"
          >
            <AtSign className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1">Mentions</span>
            {unreadMentions > 0 && (
              <span className="text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 font-medium">
                {unreadMentions}
              </span>
            )}
          </button>
          {section('Channels', channelList)}
          {section('Direct Messages', dms)}
          {section('Groups', groups)}
          {channels.length === 0 && (
            <div className="px-4 py-8 text-sm text-muted-foreground text-center">No conversations yet</div>
          )}
        </div>
      </ScrollArea>
      <NewChatDialog open={newOpen} onOpenChange={setNewOpen} />
    </aside>
  );
}

export function ChatSidebarTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="icon" className="md:hidden" onClick={onClick}>
      <Menu className="h-5 w-5" />
    </Button>
  );
}