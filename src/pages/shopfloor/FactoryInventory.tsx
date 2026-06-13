import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SHOPFLOOR_NAV } from '@/lib/navigation/shopfloor';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Package, AlertTriangle, ArrowDownToLine } from 'lucide-react';
import { toast } from 'sonner';
import {
  useFactoryInventoryItems, useFactoryStockMovements, useLowStockItems,
  useCreateFactoryItem, useRecordInbound, useRecordAdjustment, useUpdateFactoryItem, useDeleteFactoryItem,
} from '@/hooks/factory-inventory';
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';
import type { FactoryInventoryItem, ItemInput } from '@/lib/services/factory-inventory';

export default function FactoryInventoryPage() {
  const { isAdmin } = useIsSuperAdmin();
  const items = useFactoryInventoryItems(isAdmin);
  const movements = useFactoryStockMovements({ limit: 100 });
  const low = useLowStockItems();

  const create = useCreateFactoryItem();
  const update = useUpdateFactoryItem();
  const del = useDeleteFactoryItem();
  const inbound = useRecordInbound();
  const adjust = useRecordAdjustment();

  const [itemOpen, setItemOpen] = useState(false);
  const [editing, setEditing] = useState<FactoryInventoryItem | null>(null);
  const [draft, setDraft] = useState<ItemInput>({ name: '', unit_of_measurement: 'pieces', category: 'other', min_stock_level: 0 });

  const [inboundOpen, setInboundOpen] = useState<{ item: FactoryInventoryItem | null }>({ item: null });
  const [inboundQty, setInboundQty] = useState(0);
  const [inboundNotes, setInboundNotes] = useState('');

  const [adjustOpen, setAdjustOpen] = useState<{ item: FactoryInventoryItem | null }>({ item: null });
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustNotes, setAdjustNotes] = useState('');

  const openCreate = () => { setEditing(null); setDraft({ name: '', unit_of_measurement: 'pieces', category: 'other', min_stock_level: 0 }); setItemOpen(true); };
  const openEdit = (it: FactoryInventoryItem) => {
    setEditing(it);
    setDraft({ name: it.name, unit_of_measurement: it.unit_of_measurement, category: it.category, description: it.description, image_url: it.image_url, min_stock_level: it.min_stock_level, is_active: it.is_active });
    setItemOpen(true);
  };
  const saveItem = async () => {
    try {
      if (editing) { await update.mutateAsync({ id: editing.id, input: draft }); toast.success('Updated'); }
      else { await create.mutateAsync(draft); toast.success('Created'); }
      setItemOpen(false);
    } catch (e) { toast.error((e as Error).message); }
  };
  const submitInbound = async () => {
    if (!inboundOpen.item || inboundQty <= 0) return;
    try { await inbound.mutateAsync({ itemId: inboundOpen.item.id, quantity: inboundQty, notes: inboundNotes || null }); toast.success('Inbound recorded'); setInboundOpen({ item: null }); setInboundQty(0); setInboundNotes(''); }
    catch (e) { toast.error((e as Error).message); }
  };
  const submitAdjust = async () => {
    if (!adjustOpen.item || adjustQty === 0) return;
    try { await adjust.mutateAsync({ itemId: adjustOpen.item.id, quantity: adjustQty, notes: adjustNotes || null }); toast.success('Adjustment recorded'); setAdjustOpen({ item: null }); setAdjustQty(0); setAdjustNotes(''); }
    catch (e) { toast.error((e as Error).message); }
  };

  return (
    <AppLayout title="Shop Floor" subtitle="Factory Inventory" moduleNav={SHOPFLOOR_NAV}>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Factory Inventory</h1>
          {isAdmin && (
            <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Add Item</Button>
          )}
        </div>

        <Tabs defaultValue="items">
          <TabsList>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="movements">Movements</TabsTrigger>
            <TabsTrigger value="low">Low Stock {low.data && low.data.length > 0 ? <Badge variant="destructive" className="ml-2">{low.data.length}</Badge> : null}</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="text-right">Min</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(items.data ?? []).map((it) => {
                      const lowStock = Number(it.current_stock) < Number(it.min_stock_level);
                      return (
                        <TableRow key={it.id}>
                          <TableCell>
                            <div className="font-medium">{it.name}</div>
                            <div className="text-xs text-muted-foreground">{it.category}</div>
                          </TableCell>
                          <TableCell>{it.unit_of_measurement}</TableCell>
                          <TableCell className="text-right">
                            {it.current_stock}
                            {lowStock && <Badge variant="destructive" className="ml-2">Low</Badge>}
                          </TableCell>
                          <TableCell className="text-right">{it.min_stock_level}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button size="sm" variant="outline" onClick={() => { setInboundOpen({ item: it }); }}>
                              <ArrowDownToLine className="h-4 w-4 mr-1" /> Inbound
                            </Button>
                            {isAdmin && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => { setAdjustOpen({ item: it }); }}>Adjust</Button>
                                <Button size="sm" variant="ghost" onClick={() => openEdit(it)}>Edit</Button>
                                <Button size="sm" variant="ghost" onClick={async () => { await del.mutateAsync(it.id); toast.success('Deactivated'); }}>Delete</Button>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(items.data ?? []).length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No items</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="movements" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(movements.data ?? []).map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>{new Date(m.recorded_at).toLocaleString()}</TableCell>
                        <TableCell>{m.item?.name ?? '—'}</TableCell>
                        <TableCell><Badge variant="outline">{m.movement_type}</Badge></TableCell>
                        <TableCell className="text-right">{m.quantity}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{m.notes ?? ''}</TableCell>
                      </TableRow>
                    ))}
                    {(movements.data ?? []).length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No movements</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="low" className="mt-4">
            <div className="space-y-2">
              {(low.data ?? []).length === 0 && (
                <Card><CardContent className="py-10 text-center text-muted-foreground">All stock above minimum.</CardContent></Card>
              )}
              {(low.data ?? []).map((it) => (
                <Card key={it.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 font-medium">
                        <AlertTriangle className="h-4 w-4 text-amber-600" /> {it.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Current: {it.current_stock} / Min: {it.min_stock_level} {it.unit_of_measurement}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => setInboundOpen({ item: it })}>
                      <Package className="h-4 w-4 mr-2" /> Record Inbound
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Item editor */}
      <Dialog open={itemOpen} onOpenChange={setItemOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Item' : 'New Item'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category</Label><Input value={draft.category ?? ''} onChange={(e) => setDraft({ ...draft, category: e.target.value })} /></div>
              <div><Label>Unit</Label><Input value={draft.unit_of_measurement} onChange={(e) => setDraft({ ...draft, unit_of_measurement: e.target.value })} /></div>
            </div>
            <div><Label>Min stock level</Label><Input type="number" min={0} value={draft.min_stock_level ?? 0} onChange={(e) => setDraft({ ...draft, min_stock_level: Number(e.target.value) })} /></div>
            <div><Label>Description</Label><Textarea value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
            <div><Label>Image URL</Label><Input value={draft.image_url ?? ''} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemOpen(false)}>Cancel</Button>
            <Button onClick={saveItem}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inbound */}
      <Dialog open={!!inboundOpen.item} onOpenChange={(o) => { if (!o) setInboundOpen({ item: null }); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Inbound — {inboundOpen.item?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Quantity received ({inboundOpen.item?.unit_of_measurement})</Label><Input type="number" min={0} step="any" value={inboundQty} onChange={(e) => setInboundQty(Number(e.target.value))} /></div>
            <div><Label>Notes</Label><Textarea value={inboundNotes} onChange={(e) => setInboundNotes(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInboundOpen({ item: null })}>Cancel</Button>
            <Button onClick={submitInbound} disabled={inboundQty <= 0}>Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust (admin only) */}
      <Dialog open={!!adjustOpen.item} onOpenChange={(o) => { if (!o) setAdjustOpen({ item: null }); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adjust — {adjustOpen.item?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Quantity (+/-)</Label><Input type="number" step="any" value={adjustQty} onChange={(e) => setAdjustQty(Number(e.target.value))} /></div>
            <div><Label>Reason / notes</Label><Textarea value={adjustNotes} onChange={(e) => setAdjustNotes(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustOpen({ item: null })}>Cancel</Button>
            <Button onClick={submitAdjust} disabled={adjustQty === 0}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}