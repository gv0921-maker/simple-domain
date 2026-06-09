import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { HR_NAV } from '@/lib/navigation/hr';
import { useHolidays, useCreateHoliday, useDeleteHoliday } from '@/hooks/hr';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

function blank() { return { holiday_date: '', name: '', type: 'national', is_optional: false }; }

export default function HolidaysPage() {
  const { data: holidays = [] } = useHolidays();
  const create = useCreateHoliday();
  const remove = useDeleteHoliday();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(blank());

  async function save() {
    if (!form.holiday_date || !form.name) { toast({ title: 'Date & name required', variant: 'destructive' }); return; }
    try { await create.mutateAsync(form); toast({ title: 'Holiday added' }); setOpen(false); setForm(blank()); }
    catch (e: any) { toast({ title: 'Failed', description: e?.message, variant: 'destructive' }); }
  }

  return (
    <AppLayout title="Attendance" subtitle="Holidays" moduleNav={HR_NAV}>
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold">Holidays</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> New Holiday</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Holiday</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Date</Label><Input type="date" value={form.holiday_date} onChange={(e) => setForm({ ...form, holiday_date: e.target.value })} /></div>
                <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div>
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="national">National</SelectItem>
                      <SelectItem value="regional">Regional</SelectItem>
                      <SelectItem value="company">Company</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_optional} onCheckedChange={(v) => setForm({ ...form, is_optional: v })} />
                  <Label className="m-0">Optional</Label>
                </div>
                <Button onClick={save} disabled={create.isPending}>Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <Card>
          {holidays.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground text-center">No holidays yet.</div>
          ) : (
            <ul className="divide-y">
              {holidays.map((h) => (
                <li key={h.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{h.name}</p>
                    <p className="text-xs text-muted-foreground">{h.holiday_date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">{h.type}</Badge>
                    {h.is_optional && <Badge variant="secondary">Optional</Badge>}
                    <Button size="icon" variant="ghost" className="text-destructive"
                      onClick={() => { if (confirm('Delete?')) remove.mutate(h.id); }}>
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