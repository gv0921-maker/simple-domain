import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Settings, Hash, Lock, Users, MessageCircle, Search, Pin } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useChannel, useChannelMembers, useChannels, usePinnedMessages } from '@/hooks/chat';
import { ChatSidebar, ChatSidebarTrigger } from '@/components/chat/ChatSidebar';
import { MessageList } from '@/components/chat/MessageList';
import { MessageComposer } from '@/components/chat/MessageComposer';
import { ChannelSettingsDialog } from '@/components/chat/ChannelSettingsDialog';
import { ThreadPanel } from '@/components/chat/ThreadPanel';
import { PinnedPanel } from '@/components/chat/PinnedPanel';
import { useSearchMessages } from '@/hooks/chat';
import { highlightSnippet } from '@/lib/services/chat/api';
import { Input } from '@/components/ui/input';

function ChatPageInner() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: channels = [] } = useChannels();
  const { data: channel } = useChannel(id);
  const { data: members = [] } = useChannelMembers(id);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [inChanSearch, setInChanSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const { data: pinnedList = [] } = usePinnedMessages(channel?.id);
  const { data: chanSearch = [] } = useSearchMessages(inChanSearch, channel?.id ?? null);

  useEffect(() => { setThreadId(null); setPinnedOpen(false); setSearchOpen(false); setInChanSearch(''); }, [id]);

  useEffect(() => {
    if (!id && channels.length > 0) {
      navigate(`/chat/channels/${channels[0].id}`, { replace: true });
    }
  }, [id, channels, navigate]);

  const Icon = !channel ? Hash
    : channel.type === 'dm' ? MessageCircle
    : channel.is_private ? Lock
    : channel.type === 'group' ? Users : Hash;

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        <div className="hidden md:block h-full">
          <ChatSidebar />
        </div>
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent side="left" className="p-0 w-80 max-w-[85vw]">
            <SheetTitle className="sr-only">Conversations</SheetTitle>
            <ChatSidebar onPick={() => setDrawerOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex-1 flex flex-col min-w-0">
          {channel ? (
            <>
              <header className="h-14 border-b px-4 flex items-center justify-between bg-card flex-shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <ChatSidebarTrigger onClick={() => setDrawerOpen(true)} />
                  <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <h1 className="font-semibold truncate">{channel.name.replace(/^#\s*/, '')}</h1>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    · {members.length} {members.length === 1 ? 'member' : 'members'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setSearchOpen((v) => !v)} title="Search in channel">
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setPinnedOpen((v) => !v)} title="Pinned messages" className="relative">
                    <Pin className="h-4 w-4" />
                    {pinnedList.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
                        {pinnedList.length}
                      </span>
                    )}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)}>
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </header>
              {searchOpen && (
                <div className="border-b p-2 bg-card">
                  <Input
                    autoFocus placeholder="Search in this channel…"
                    value={inChanSearch} onChange={(e) => setInChanSearch(e.target.value)}
                  />
                  {inChanSearch.trim().length >= 2 && (
                    <div className="mt-2 max-h-48 overflow-auto border rounded">
                      {chanSearch.length === 0 && <div className="p-2 text-xs text-muted-foreground">No matches</div>}
                      {chanSearch.map((r) => (
                        <button key={r.message.id} type="button"
                          onClick={() => {
                            window.location.hash = `message-${r.message.id}`;
                            setSearchOpen(false);
                          }}
                          className="block w-full text-left px-2 py-1.5 text-xs hover:bg-muted">
                          <div className="text-muted-foreground">{r.sender_name ?? 'User'} · {new Date(r.message.created_at).toLocaleString()}</div>
                          <div>{highlightSnippet(r.snippet, inChanSearch).map((p, i) => p.hit ? <mark key={i} className="bg-primary/20 rounded px-0.5">{p.text}</mark> : <span key={i}>{p.text}</span>)}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <MessageList channelId={channel.id} onOpenThread={setThreadId} activeThreadId={threadId} />
              <MessageComposer channelId={channel.id} />
              <ChannelSettingsDialog channelId={channel.id} open={settingsOpen} onOpenChange={setSettingsOpen} />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <ChatSidebarTrigger onClick={() => setDrawerOpen(true)} />
              <p className="text-sm">Select a conversation to start chatting</p>
            </div>
          )}
        </div>

        {channel && threadId && (
          <div className="fixed inset-0 z-40 md:static md:z-auto md:flex">
            <ThreadPanel channelId={channel.id} parentMessageId={threadId} onClose={() => setThreadId(null)} />
          </div>
        )}

        {channel && pinnedOpen && (
          <div className="fixed inset-0 z-40 md:static md:z-auto md:flex">
            <PinnedPanel channelId={channel.id} onClose={() => setPinnedOpen(false)}
              onJump={(mid) => { window.location.hash = `message-${mid}`; setPinnedOpen(false); }} />
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function ChatPage() {
  return (
    <ErrorBoundary label="ChatPage">
      <ChatPageInner />
    </ErrorBoundary>
  );
}