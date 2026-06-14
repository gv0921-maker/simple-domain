import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useRoleCheck } from '@/hooks/auth/useRoleCheck';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSave: (args: { name: string; isDefault: boolean; isSystemDefault: boolean }) => void;
}

export function SaveFilterDialog({ open, onOpenChange, onSave }: Props) {
  const { isSuperAdmin } = useRoleCheck();
  const [name, setName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isSystemDefault, setIsSystemDefault] = useState(false);

  const submit = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), isDefault, isSystemDefault });
    setName(''); setIsDefault(false); setIsSystemDefault(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Save current filters</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid gap-1">
            <Label className="text-xs">Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. My Hot Leads" />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={isDefault} onCheckedChange={c => setIsDefault(!!c)} />
            Set as my default
          </label>
          {isSuperAdmin && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={isSystemDefault} onCheckedChange={c => setIsSystemDefault(!!c)} />
              Set as default for everyone
            </label>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!name.trim()}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
