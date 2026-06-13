import { useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ModuleNav } from '@/components/layout/ModuleNav';
import { SETTINGS_NAV } from '@/lib/navigation/settings';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search } from 'lucide-react';
import { useVendors, useCreateVendor, useUpdateVendor, useDeactivateVendor } from '@/hooks/vendors';
import type { Vendor, VendorInput } from '@/lib/services/vendors';
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';

const emptyInput: VendorInput = {
  name: '', contact_person: '', phone: '', email: '', address: '', gstin: '', notes: '', is_active: true,
};

export default function VendorsSettings() {
  const { toast } = useToast();
  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [form, setForm] = useState<VendorInput>(emptyInput);

  const vendors = useVendors(!showInactive);
  const createMut = useCreateVendor();
  const updateMut = useUpdateVendor();
  const deactivateMut = useDeactivateVendor();
  const { isAdmin: isSuperAdmin } = useIsSuperAdmin();

  const filtered = useMemo(() => {
    const list = vendors.data ?? [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((v) => v.name.toLowerCase().includes(q) || (v.contact_person ?? '').toLowerCase().includes(q));
  }, [vendors.data, search]);

  const openCreate = () => { setEditing(null); setForm(emptyInput); setDialogOpen(true); };
  const openEdit = (v: Vendor) => {
    setEditing(v);
    setForm({
      name: v.name, contact_person: v.contact_person ?? '', phone: v.phone ?? '',
      email: v.email ?? '', address: v.address ?? '', gstin: v.gstin ?? '',
      notes: v.notes ?? '', is_active: v.is_active,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Name required', variant: 'destructive' });
      return;
    }
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, input: form });
        toast({ title: 'Vendor updated' });
      } else {
        await createMut.mutateAsync(form);
        toast({ title: 'Vendor created' });
      }
      setDialogOpen(false);
    } catch (e) {
      toast({ title: 'Save failed', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const deactivate = async (v: Vendor) => {
    if (!confirm(`Deactivate vendor "${v.name}"?`)) return;
    try {
      await deactivateMut.mutateAsync(v.id);
      toast({ title: 'Vendor deactivated' });
    } catch (e) {
      toast({ title: 'Failed', description: (e as Error).message, variant: 'destructive' });
    }
  };

  return (
    <AppLayout>
      <ModuleNav items={SETTINGS_NAV} />
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Vendors</h1>
            <p className="text-sm text-muted-foreground">Reusable vendor master for purchase orders.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Add Vendor</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit Vendor' : 'New Vendor'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Name *</label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Contact Person</label>
                    <Input value={form.contact_person ?? ''} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Phone</label>
                    <Input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Email</label>
                  <Input type="email" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Address</label>
                  <Textarea rows={2} value={form.address ?? ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">GSTIN</label>
                  <Input value={form.gstin ?? ''} onChange={(e) => setForm({ ...form, gstin: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Notes</label>
                  <Textarea rows={2} value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                {editing && isSuperAdmin && (
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.is_active ?? true} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                    Active
                  </label>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={save} disabled={createMut.isPending || updateMut.isPending}>
                  {editing ? 'Save Changes' : 'Create Vendor'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" placeholder="Search by name or contact" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
                Show inactive
              </label>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>GSTIN</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.name}</TableCell>
                    <TableCell>{v.contact_person ?? '—'}</TableCell>
                    <TableCell>{v.phone ?? '—'}</TableCell>
                    <TableCell className="font-mono text-xs">{v.gstin ?? '—'}</TableCell>
                    <TableCell>
                      {v.is_active
                        ? <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
                        : <Badge variant="outline">Inactive</Badge>}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(v)}>Edit</Button>
                      {v.is_active && (
                        <Button size="sm" variant="outline" onClick={() => deactivate(v)}>Deactivate</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No vendors</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}