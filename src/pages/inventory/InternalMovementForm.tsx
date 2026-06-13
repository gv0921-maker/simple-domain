import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { INVENTORY_NAV } from '@/lib/navigation';
import { useCreateInternalMovement } from '@/hooks/inventory/internalMovements';
import { MOVEMENT_TYPE_LABEL, type MovementType, type LocationType, type CreateMovementItemInput } from '@/lib/services/inventory/internalMovements';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const LOCATION_TYPES: LocationType[] = ['warehouse','store_display','under_correction','packaging','vendor','scrap'];

export default function InternalMovementForm() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [movementType, setMovementType] = useState<MovementType>(
    (params.get('type') as MovementType) ?? 'rearrangement',
  );
  const [fromType, setFromType] = useState<LocationType>('warehouse');
  const [toType, setToType] = useState<LocationType>('store_display');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [serialInput, setSerialInput] = useState('');
  const [items, setItems] = useState<CreateMovementItemInput[]>([]);
  const createMut = useCreateInternalMovement();

  const addSerial = async () => {
    const code = serialInput.trim();
    if (!code) return;
    const { data, error } = await (supabase as any)
      .from('goods_receipt_serials')
      .select('id, product_id, serial_number, barcode_value')
      .or(`serial_number.eq.${code},barcode_value.eq.${code}`)
      .limit(1)
      .maybeSingle();
    if (error || !data) {
      toast({ title: 'Serial not found', variant: 'destructive' });
      return;
    }
    if (items.some((i) => i.goods_receipt_serial_id === data.id)) {
      toast({ title: 'Already added' });
      return;
    }
    setItems((prev) => [...prev, {
      goods_receipt_serial_id: data.id,
      product_id: data.product_id,
      serial_number: data.serial_number,
    }]);
    setSerialInput('');
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.goods_receipt_serial_id !== id));

  const save = async () => {
    if (items.length === 0) {
      toast({ title: 'Add at least one item', variant: 'destructive' });
      return;
    }
    if ((movementType === 'damage_quarantine' || movementType === 'return_to_vendor') && !reason.trim()) {
      toast({ title: 'Reason is required for this movement type', variant: 'destructive' });
      return;
    }
    try {
      const id = await createMut.mutateAsync({
        movementType,
        fromLocationType: fromType,
        toLocationType: toType,
        reason: reason || undefined,
        notes: notes || undefined,
        items,
      });
      toast({ title: 'Movement created' });
      navigate(`/inventory/internal-movements/${id}`);
    } catch (e: any) {
      toast({ title: 'Could not create', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <AppLayout title="Inventory" moduleNav={INVENTORY_NAV}>
      <div className="p-6 space-y-6 max-w-4xl">
        <Button variant="ghost" size="sm" onClick={() => navigate('/inventory/internal-movements')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />Back
        </Button>

        <Card>
          <CardHeader><CardTitle>New Internal Movement</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Movement Type</Label>
                <Select value={movementType} onValueChange={(v) => setMovementType(v as MovementType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(MOVEMENT_TYPE_LABEL).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>From</Label>
                <Select value={fromType} onValueChange={(v) => setFromType(v as LocationType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LOCATION_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t.replace('_',' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>To</Label>
                <Select value={toType} onValueChange={(v) => setToType(v as LocationType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LOCATION_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t.replace('_',' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Reason {(movementType === 'damage_quarantine' || movementType === 'return_to_vendor') && <span className="text-destructive">*</span>}</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Items</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                value={serialInput}
                onChange={(e) => setSerialInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSerial(); } }}
                placeholder=""
                className="max-w-md"
              />
              <Button onClick={addSerial} className="gap-2"><Plus className="h-4 w-4" />Add Serial</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serial</TableHead>
                  <TableHead>Product ID</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No items added</TableCell></TableRow>
                ) : items.map((it) => (
                  <TableRow key={it.goods_receipt_serial_id}>
                    <TableCell className="font-mono text-xs">{it.serial_number}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{it.product_id}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeItem(it.goods_receipt_serial_id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2">
          <Button onClick={save} disabled={createMut.isPending}>Save as Draft</Button>
          <Button variant="outline" onClick={() => navigate('/inventory/internal-movements')}>Cancel</Button>
        </div>
      </div>
    </AppLayout>
  );
}