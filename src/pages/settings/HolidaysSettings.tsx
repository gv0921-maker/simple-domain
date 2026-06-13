import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { SETTINGS_NAV } from '@/lib/navigation/settings';
import { useHolidaysList, useCreateHolidayX, useUpdateHolidayX, useDeactivateHoliday, useDeleteHolidayX } from '@/hooks/hr/holidaysX';
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';
import { toast } from '@/hooks/use-toast';
import type { Holiday } from '@/lib/services/hr/holidays';

function blank() {
  return { holiday_date: '', name: '', type: 'national', description: '', is_optional: false, is_active: true };
}

export default function HolidaysSettings() {
  const { isAdmin } = useIsSuperAdmin();
  const year = new Date().getFullYear();
  const { data: holidays = [] } = useHolidaysList();
  const create = useCreateHolidayX();
  const update = useUpdateHolidayX();
  const deactivate = useDeactivateHoliday();
  const del = useDeleteHolidayX();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [form, setForm] = useState<any>(blank());

  function openNew() { setEditing(null); setForm(blank()); setOpen(true); }
  function openEdit(h: Holiday) {
    setEditing(h);
    setForm({
      holiday_date: h.holiday_date, name: h.name,
      type: (h as any).type ?? 'national',
      description: (h as any).description ?? '',
      is_optional: h.is_optional, is_active: (h as any).is_active ?? true,
    });
    setOpen(true);
  }

  async function save() {
    if (!form.holiday_date || !form.name) {
      toast({ title: 'Date and name required', variant: 'destructive' }); return;
    }
    try {
      if (editing) await update.mutateAsync({ id: editing.id, patch: form });
      else await create.mutateAsync(form);
      toast({ title: editing ? 'Holiday updated' : 'Holiday created' });
      setOpen(false);
    } catch (e: any) {
      toast({ title: 'Failed', description: e?.message, variant: 'destructive' });
    }
  }

  if (!isAdmin) {
    return (
      <AppLayout title="Settings" subtitle="Holidays" moduleNav={SETTINGS_NAV}>
        <div className="p-6 text-sm text-muted-foreground">Super admin access required.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Settings" subtitle="Holidays" moduleNav={SETTINGS_NAV}>
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold">Public &amp; Company Holidays</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2" onClick={openNew}>
                <Plus className="h-4 w-4" /> Add Holiday
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Holiday</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Date</Label>
                  <Input type="date" value={form.holiday_date}
                    onChange={(e) => setForm({ ...form, holiday_date: e.target.value })} /></div>
                <div><Label>Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="national">Public / National</SelectItem>
                      <SelectItem value="regional">Regional / Optional</SelectItem>
                      <SelectItem value="company">Company</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Description</Label>
                  <Textarea value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <Button onClick={save} disabled={create.isPending || update.isPending}>Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          {holidays.length === 0 ? (
            <div className="p-8 text-sm text-muted-foreground text-center">No holidays configured.</div>
          ) : (
            <ul className="divide-y">
              {holidays.map((h) => (
                <li key={h.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      {h.name}
                      {!(h as any).is_active && <Badge variant="secondary">Inactive</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground">{h.holiday_date} • {(h as any).type}</p>
                    {(h as any).description && <p className="text-xs text-muted-foreground mt-1">{(h as any).description}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(h)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {(h as any).is_active && (
                      <Button size="sm" variant="outline" onClick={() => deactivate.mutate(h.id)}>
                        Deactivate
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="text-destructive"
                      onClick={() => { if (confirm('Delete this holiday?')) del.mutate(h.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}