import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Settings, Hash, Lock, Users, MessageCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useChannel, useChannelMembers, useChannels } from '@/hooks/chat';
import { ChatSidebar, ChatSidebarTrigger } from '@/components/chat/ChatSidebar';
import { MessageList } from '@/components/chat/MessageList';
import { MessageComposer } from '@/components/chat/MessageComposer';
import { ChannelSettingsDialog } from '@/components/chat/ChannelSettingsDialog';

function ChatPageInner() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: channels = [] } = useChannels();
  const { data: channel } = useChannel(id);
  const { data: members = [] } = useChannelMembers(id);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
                <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)}>
                  <Settings className="h-4 w-4" />
                </Button>
              </header>
              <MessageList channelId={channel.id} />
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