import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateChannel, useDirectory } from '@/hooks/chat';
import { findOrCreateDM } from '@/lib/services/chat/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Users } from 'lucide-react';

type ChatType = 'channel' | 'group' | 'dm';

export function NewChatDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { user } = useAuth();
  const { data: directory = [] } = useDirectory();
  const create = useCreateChannel();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [type, setType] = useState<ChatType>('channel');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return directory.filter((d) => d.user_id !== user?.id && (!q || d.name.toLowerCase().includes(q)));
  }, [directory, search, user?.id]);

  const noOtherUsers = directory.filter((d) => d.user_id !== user?.id).length === 0;

  const reset = () => { setType('channel'); setName(''); setDescription(''); setSelected([]); setSearch(''); };

  const toggle = (uid: string) => {
    if (type === 'dm') setSelected([uid]);
    else setSelected((s) => (s.includes(uid) ? s.filter((x) => x !== uid) : [...s, uid]));
  };

  const submit = async () => {
    try {
      if (type === 'dm') {
        if (selected.length !== 1) return toast({ title: 'Select one person' });
        const ch = await findOrCreateDM(selected[0]);
        onOpenChange(false); reset();
        navigate(`/chat/channels/${ch.id}`);
        return;
      }
      if (!name.trim()) return toast({ title: 'Name required' });
      const ch = await create.mutateAsync({
        name: name.trim(),
        type,
        memberUserIds: selected,
        description: description.trim() || undefined,
        isPrivate: type === 'group',
      });
      onOpenChange(false); reset();
      navigate(`/chat/channels/${ch.id}`);
    } catch (e: any) {
      toast({ title: 'Failed to create', description: e?.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New conversation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {(['channel', 'group', 'dm'] as ChatType[]).map((t) => (
              <Button
                key={t}
                type="button"
                variant={type === t ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setType(t); setSelected([]); }}
              >
                {t === 'dm' ? 'DM' : t.charAt(0).toUpperCase() + t.slice(1)}
              </Button>
            ))}
          </div>

          {type !== 'dm' && (
            <>
              <div>
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[60px]" />
              </div>
            </>
          )}

          <div>
            <Label>{type === 'dm' ? 'Select person' : 'Add members'}</Label>
            <Input placeholder="Search people" value={search} onChange={(e) => setSearch(e.target.value)} className="mt-1" />
            <ScrollArea className="h-48 mt-2 border rounded-md">
              <div className="p-2 space-y-1">
                {!noOtherUsers && filtered.map((d) => (
                  <label key={d.user_id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer">
                    <Checkbox checked={selected.includes(d.user_id)} onCheckedChange={() => toggle(d.user_id)} />
                    <span className="text-sm">{d.name}</span>
                  </label>
                ))}
                {noOtherUsers ? (
                  <div className="p-4 text-center space-y-3">
                    <Users className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      You need to add employees first or have other users sign up. Go to Employees → Directory to add team members.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => { onOpenChange(false); reset(); navigate('/employees/directory'); }}
                    >
                      Open Employees Directory
                    </Button>
                  </div>
                ) : filtered.length === 0 && (
                  <div className="text-sm text-muted-foreground p-3 text-center">No people found</div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}