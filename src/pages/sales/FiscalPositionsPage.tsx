import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SALES_NAV } from '@/lib/navigation/sales';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, Globe, X } from 'lucide-react';
import {
  useFiscalPositions, useSaveFiscalPosition, useDeleteFiscalPosition,
} from '@/hooks/sales';
import type { FiscalPosition, TaxRule } from '@/lib/services/sales/types';
import { useToast } from '@/hooks/use-toast';

// Static GST tax rules used for fiscal position mappings. Tax rules are not
// yet table-backed; this list mirrors the previous defaults.
const TAX_RULES: TaxRule[] = [
  { id: 'tax_18', name: 'GST 18%', code: 'GST18', rate: 18, type: 'exclusive', isActive: true },
  { id: 'tax_12', name: 'GST 12%', code: 'GST12', rate: 12, type: 'exclusive', isActive: true },
  { id: 'tax_5', name: 'GST 5%', code: 'GST5', rate: 5, type: 'exclusive', isActive: true },
  { id: 'tax_0', name: 'Zero Rate', code: 'ZERO', rate: 0, type: 'exclusive', isActive: true },
  { id: 'tax_exempt', name: 'Exempt', code: 'EXEMPT', rate: 0, type: 'exclusive', isActive: true },
];

export default function FiscalPositionsPage() {
  const { toast } = useToast();
  const { data: items = [] } = useFiscalPositions();
  const saveFp = useSaveFiscalPosition();
  const deleteFp = useDeleteFiscalPosition();
  const taxes = TAX_RULES;
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FiscalPosition | null>(null);

  const startNew = () => {
    setEditing({ id: '', name: '', code: '', countryCode: '', taxMappings: [], isActive: true });
    setOpen(true);
  };
  const startEdit = (fp: FiscalPosition) => { setEditing({ ...fp }); setOpen(true); };

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.name.trim() || !editing.code.trim()) {
      toast({ title: 'Name and code are required', variant: 'destructive' });
      return;
    }
    try {
      const { id, ...rest } = editing;
      await saveFp.mutateAsync(id ? editing : (rest as any));
      setOpen(false);
      toast({ title: 'Fiscal position saved' });
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message ?? String(e), variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFp.mutateAsync(id);
      toast({ title: 'Fiscal position deleted' });
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e?.message ?? String(e), variant: 'destructive' });
    }
  };

  const addMapping = () => {
    if (!editing) return;
    setEditing({
      ...editing,
      taxMappings: [...editing.taxMappings, { fromTaxId: '', toTaxId: '' }],
    });
  };
  const updateMapping = (i: number, key: 'fromTaxId' | 'toTaxId', val: string) => {
    if (!editing) return;
    const next = [...editing.taxMappings];
    next[i] = { ...next[i], [key]: val };
    setEditing({ ...editing, taxMappings: next });
  };
  const removeMapping = (i: number) => {
    if (!editing) return;
    setEditing({ ...editing, taxMappings: editing.taxMappings.filter((_, idx) => idx !== i) });
  };

  return (
    <AppLayout title="Sales" moduleNav={SALES_NAV}>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Fiscal Positions</h1>
            <p className="text-muted-foreground">Map taxes by region (export, SEZ, intra-state, etc.)</p>
          </div>
          <Button onClick={startNew}><Plus className="h-4 w-4 mr-2" />New Fiscal Position</Button>
        </div>

        <Card>
          <CardHeader><CardTitle>All Fiscal Positions</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Tax Mappings</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <Globe className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      No fiscal positions yet
                    </TableCell>
                  </TableRow>
                ) : items.map((fp) => (
                  <TableRow key={fp.id}>
                    <TableCell className="font-medium">{fp.name}</TableCell>
                    <TableCell><Badge variant="outline">{fp.code}</Badge></TableCell>
                    <TableCell>{fp.countryCode || '—'}</TableCell>
                    <TableCell>{fp.taxMappings.length}</TableCell>
                    <TableCell>
                      <Badge className={fp.isActive ? 'bg-success/20 text-success' : 'bg-muted'}>
                        {fp.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => startEdit(fp)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(fp.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit' : 'New'} Fiscal Position</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="" />
                </div>
                <div className="space-y-2">
                  <Label>Code *</Label>
                  <Input value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} placeholder="" />
                </div>
                <div className="space-y-2">
                  <Label>Country Code</Label>
                  <Input value={editing.countryCode || ''} onChange={(e) => setEditing({ ...editing, countryCode: e.target.value.toUpperCase() })} placeholder="" maxLength={2} />
                </div>
                <div className="space-y-2 flex items-end gap-2">
                  <Switch checked={editing.isActive} onCheckedChange={(v) => setEditing({ ...editing, isActive: v })} />
                  <Label>Active</Label>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Tax Mappings</Label>
                  <Button variant="outline" size="sm" onClick={addMapping}>
                    <Plus className="h-3.5 w-3.5 mr-1" />Add
                  </Button>
                </div>
                {editing.taxMappings.length === 0 && (
                  <p className="text-sm text-muted-foreground">No tax mappings. Add a row to remap taxes.</p>
                )}
                {editing.taxMappings.map((m, i) => (
                  <div key={i} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2">
                    <Select value={m.fromTaxId} onValueChange={(v) => updateMapping(i, 'fromTaxId', v)}>
                      <SelectTrigger><SelectValue placeholder="From tax" /></SelectTrigger>
                      <SelectContent>
                        {taxes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <span className="text-muted-foreground">→</span>
                    <Select value={m.toTaxId} onValueChange={(v) => updateMapping(i, 'toTaxId', v)}>
                      <SelectTrigger><SelectValue placeholder="To tax" /></SelectTrigger>
                      <SelectContent>
                        {taxes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={() => removeMapping(i)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}