import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ATTENDANCE_NAV } from '@/lib/navigation/attendance';
import { useLocations, useCreateLocation, useUpdateLocation, useDeleteLocation } from '@/hooks/hr';
import { getCurrentPosition, type AttendanceLocation } from '@/lib/services/hr/api';
import { toast } from '@/hooks/use-toast';
import { MapPin, Plus, Trash2, Crosshair } from 'lucide-react';

function blank() { return { name: '', latitude: 0, longitude: 0, radius_meters: 100, is_active: true }; }

export default function LocationsPage() {
  const { data: locations = [] } = useLocations();
  const create = useCreateLocation();
  const update = useUpdateLocation();
  const remove = useDeleteLocation();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank());

  async function useGPS() {
    try {
      const pos = await getCurrentPosition();
      setForm({ ...form, latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    } catch (e: any) { toast({ title: 'GPS failed', description: e?.message, variant: 'destructive' }); }
  }

  async function handleSave() {
    if (!form.name) { toast({ title: 'Name required', variant: 'destructive' }); return; }
    try {
      await create.mutateAsync(form);
      toast({ title: 'Location created' });
      setOpen(false); setForm(blank());
    } catch (e: any) { toast({ title: 'Failed', description: e?.message, variant: 'destructive' }); }
  }

  return (
    <AppLayout title="Attendance" subtitle="Geofence Locations" moduleNav={ATTENDANCE_NAV}>
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold">Locations</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> New Location</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Location</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Latitude</Label><Input type="number" step="0.0000001" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })} /></div>
                  <div><Label>Longitude</Label><Input type="number" step="0.0000001" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })} /></div>
                </div>
                <Button variant="outline" size="sm" className="gap-2" onClick={useGPS}><Crosshair className="h-4 w-4" /> Use my GPS</Button>
                <div><Label>Radius (meters)</Label><Input type="number" value={form.radius_meters} onChange={(e) => setForm({ ...form, radius_meters: Number(e.target.value) })} /></div>
                <Button onClick={handleSave} disabled={create.isPending}>Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <Card>
          {locations.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground text-center">No locations yet.</div>
          ) : (
            <ul className="divide-y">
              {locations.map((l: AttendanceLocation) => (
                <li key={l.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium flex items-center gap-2"><MapPin className="h-4 w-4" />{l.name}</p>
                    <p className="text-xs text-muted-foreground">{Number(l.latitude).toFixed(5)}, {Number(l.longitude).toFixed(5)} · {l.radius_meters}m radius</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={l.is_active} onCheckedChange={(v) => update.mutate({ id: l.id, patch: { is_active: v } })} />
                    <Button size="icon" variant="ghost" className="text-destructive"
                      onClick={() => { if (confirm('Delete this location?')) remove.mutate(l.id); }}>
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