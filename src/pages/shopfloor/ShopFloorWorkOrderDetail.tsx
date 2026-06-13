import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { SHOPFLOOR_NAV } from '@/lib/navigation/shopfloor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Camera, Plus, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  useFactoryWO, useBomEntries, useStartWork, useEnterBOM,
  useStartPolishing, useCompleteFactoryWork, useUploadProgressPhoto,
} from '@/hooks/shopfloor';
import { useFactoryInventoryItems } from '@/hooks/factory-inventory';

interface BomDraft { factory_inventory_item_id: string; quantity_required: number; notes: string }

export default function ShopFloorWorkOrderDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const wo = useFactoryWO(id);
  const bom = useBomEntries(id);
  const items = useFactoryInventoryItems(false);
  const startWork = useStartWork();
  const enterBOM = useEnterBOM();
  const startPolishing = useStartPolishing();
  const complete = useCompleteFactoryWork();
  const upload = useUploadProgressPhoto();

  const [bomOpen, setBomOpen] = useState(false);
  const [polishOpen, setPolishOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [drafts, setDrafts] = useState<BomDraft[]>([{ factory_inventory_item_id: '', quantity_required: 0, notes: '' }]);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!wo.data) {
    return (
      <AppLayout title="Shop Floor" moduleNav={SHOPFLOOR_NAV}>
        <div className="p-6 text-muted-foreground">{wo.isLoading ? 'Loading…' : 'Work order not found.'}</div>
      </AppLayout>
    );
  }
  const w = wo.data;

  const handleStartWork = async () => {
    try { await startWork.mutateAsync(id); toast.success('Work started'); }
    catch (e) { toast.error((e as Error).message); }
  };
  const handleSaveBOM = async () => {
    const valid = drafts.filter((d) => d.factory_inventory_item_id && d.quantity_required > 0)
      .map((d) => ({ factory_inventory_item_id: d.factory_inventory_item_id, quantity_required: d.quantity_required, notes: d.notes || null }));
    if (valid.length === 0) { toast.error('Add at least one material'); return; }
    try { await enterBOM.mutateAsync({ woId: id, entries: valid }); toast.success('BOM saved'); setBomOpen(false); setDrafts([{ factory_inventory_item_id: '', quantity_required: 0, notes: '' }]); }
    catch (e) { toast.error((e as Error).message); }
  };
  const handleStartPolishing = async () => {
    try { await startPolishing.mutateAsync(id); toast.success('Polishing started — materials consumed'); setPolishOpen(false); }
    catch (e) { toast.error((e as Error).message); }
  };
  const handleComplete = async () => {
    try { await complete.mutateAsync(id); toast.success('Work order completed'); setCompleteOpen(false); }
    catch (e) { toast.error((e as Error).message); }
  };
  const handleUpload = async (file: File | null) => {
    if (!file) return;
    try { await upload.mutateAsync({ woId: id, file }); toast.success('Photo uploaded'); }
    catch (e) { toast.error((e as Error).message); }
  };

  const bomEntered = !!w.bom_entered_at && (bom.data?.length ?? 0) > 0;
  const materialsList = bom.data ?? [];

  // Insufficient check for polishing confirmation
  const insufficient = materialsList.filter((b) => (b.item?.current_stock ?? 0) < b.quantity_required);

  return (
    <AppLayout title="Shop Floor" subtitle={w.wo_number} moduleNav={SHOPFLOOR_NAV}>
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/shop-floor')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{w.wo_number}</span>
              <Badge>{w.current_stage}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Product:</span> <strong>{w.product?.name ?? '—'}</strong></div>
            <div><span className="text-muted-foreground">Quantity:</span> {w.quantity}</div>
            <div><span className="text-muted-foreground">ETA:</span> {w.eta_date ? new Date(w.eta_date).toLocaleDateString() : '—'}</div>
          </CardContent>
        </Card>

        {(w.size_spec || w.colour_polish_spec || w.fabric_spec || w.customization_notes) && (
          <Card>
            <CardHeader><CardTitle className="text-base">Specifications</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {w.size_spec && <div><span className="text-muted-foreground">Size:</span> {w.size_spec}</div>}
              {w.colour_polish_spec && <div><span className="text-muted-foreground">Colour/Polish:</span> {w.colour_polish_spec}</div>}
              {w.fabric_spec && <div><span className="text-muted-foreground">Fabric:</span> {w.fabric_spec}</div>}
              {w.customization_notes && <div><span className="text-muted-foreground">Notes:</span> {w.customization_notes}</div>}
            </CardContent>
          </Card>
        )}

        {w.reference_images && w.reference_images.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Reference Images</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {w.reference_images.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer">
                    <img src={url} alt="" className="w-full h-24 object-cover rounded-md" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stage actions */}
        <Card>
          <CardHeader><CardTitle className="text-base">Action</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {w.current_stage === 'placed' && (
              <Button size="lg" className="w-full" onClick={handleStartWork} disabled={startWork.isPending}>
                Start Work
              </Button>
            )}
            {w.current_stage === 'work_start' && !bomEntered && (
              <Button size="lg" className="w-full" onClick={() => setBomOpen(true)}>Enter BOM</Button>
            )}
            {w.current_stage === 'work_start' && bomEntered && (
              <Button size="lg" className="w-full" onClick={() => setPolishOpen(true)}>Begin Polishing</Button>
            )}
            {w.current_stage === 'polishing' && (
              <Button size="lg" className="w-full" onClick={() => setCompleteOpen(true)}>Mark Completed</Button>
            )}
            {w.current_stage === 'completed' && (
              <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium">
                <CheckCircle2 className="h-5 w-5" /> Factory work completed. Ready for transport.
              </div>
            )}
          </CardContent>
        </Card>

        {/* BOM */}
        {bomEntered && (
          <Card>
            <CardHeader><CardTitle className="text-base">Bill of Materials</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">Required</TableHead>
                    <TableHead className="text-right">Consumed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materialsList.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>{b.item?.name ?? '—'}</TableCell>
                      <TableCell className="text-right">{b.quantity_required} {b.item?.unit_of_measurement}</TableCell>
                      <TableCell className="text-right">{b.quantity_consumed}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Progress photos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Progress Photos</CardTitle>
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
              <Camera className="h-4 w-4 mr-2" /> Upload
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files?.[0] ?? null)}
            />
          </CardHeader>
          <CardContent>
            {w.progress_photos.length === 0 ? (
              <p className="text-sm text-muted-foreground">No photos yet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {w.progress_photos.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer">
                    <img src={url} alt="" className="w-full h-24 object-cover rounded-md" />
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* BOM dialog */}
      <Dialog open={bomOpen} onOpenChange={setBomOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enter Bill of Materials</DialogTitle>
            <DialogDescription>List the raw materials and quantities required for this work order.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {drafts.map((d, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-6">
                  <Label className="text-xs">Material</Label>
                  <Select value={d.factory_inventory_item_id} onValueChange={(v) => setDrafts((p) => p.map((r, i) => i === idx ? { ...r, factory_inventory_item_id: v } : r))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {(items.data ?? []).map((it) => (
                        <SelectItem key={it.id} value={it.id}>{it.name} ({it.unit_of_measurement})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Label className="text-xs">Qty</Label>
                  <Input type="number" min={0} step="any" value={d.quantity_required}
                    onChange={(e) => setDrafts((p) => p.map((r, i) => i === idx ? { ...r, quantity_required: Number(e.target.value) } : r))} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Notes</Label>
                  <Input value={d.notes} onChange={(e) => setDrafts((p) => p.map((r, i) => i === idx ? { ...r, notes: e.target.value } : r))} />
                </div>
                <div className="col-span-1">
                  <Button variant="ghost" size="icon" onClick={() => setDrafts((p) => p.filter((_, i) => i !== idx))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setDrafts((p) => [...p, { factory_inventory_item_id: '', quantity_required: 0, notes: '' }])}>
              <Plus className="h-4 w-4 mr-2" /> Add Row
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBomOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveBOM} disabled={enterBOM.isPending}>Save BOM</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Begin Polishing confirmation */}
      <Dialog open={polishOpen} onOpenChange={setPolishOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Begin Polishing</DialogTitle>
            <DialogDescription>The following materials will be consumed from factory stock.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-72 overflow-auto">
            {materialsList.map((b) => {
              const lacking = (b.item?.current_stock ?? 0) < b.quantity_required;
              return (
                <div key={b.id} className={`flex items-center justify-between text-sm border rounded p-2 ${lacking ? 'border-red-300 bg-red-50' : ''}`}>
                  <span>{b.item?.name}</span>
                  <span>
                    Need {b.quantity_required} · Have {b.item?.current_stock ?? 0} {b.item?.unit_of_measurement}
                    {lacking && <AlertTriangle className="h-4 w-4 text-red-600 inline ml-2" />}
                  </span>
                </div>
              );
            })}
          </div>
          {insufficient.length > 0 && (
            <p className="text-sm text-red-600">Insufficient stock — record inbound before proceeding.</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPolishOpen(false)}>Cancel</Button>
            <Button onClick={handleStartPolishing} disabled={insufficient.length > 0 || startPolishing.isPending}>
              Consume & Begin Polishing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete confirmation */}
      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Completed</DialogTitle>
            <DialogDescription>Confirms factory work is finished and notifies the office for transport.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteOpen(false)}>Cancel</Button>
            <Button onClick={handleComplete} disabled={complete.isPending}>Mark Completed</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}