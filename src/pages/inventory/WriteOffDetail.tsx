import { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ActivityChatter } from '@/components/shared/ActivityChatter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Printer, Plus, Trash2, Upload, Check, X } from 'lucide-react';
import { INVENTORY_NAV } from '@/lib/navigation';
import { useToast } from '@/hooks/use-toast';
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';
import {
  useWriteOff, useUpdateWriteOffDraft, useAddItemsToWriteOff,
  useRemoveWriteOffItem, useUploadEvidencePhoto, useRemoveEvidencePhoto,
  useApproveWriteOff, useCancelWriteOff, useSubmitWriteOffForApproval,
  useEligibleWriteOffSerials,
} from '@/hooks/inventory/writeOffs';
import type { WriteOffType, WriteOffStatus } from '@/lib/services/inventory/writeOffs';
import { format, parseISO } from 'date-fns';

const TYPE_OPTIONS: Array<{ value: WriteOffType; label: string }> = [
  { value: 'damage', label: 'Damage' },
  { value: 'loss', label: 'Loss' },
  { value: 'theft', label: 'Theft' },
  { value: 'obsolete', label: 'Obsolete' },
  { value: 'scrap', label: 'Scrap' },
  { value: 'count_missing', label: 'Missing in Count' },
  { value: 'qc_unsalvageable', label: 'QC Unsalvageable' },
  { value: 'other', label: 'Other' },
];

const STATUS_STYLES: Record<WriteOffStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  approved: 'bg-success/20 text-success border-success',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/30',
};

export default function WriteOffDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin: isSuper } = useIsSuperAdmin();

  const { data } = useWriteOff(id);
  const updateMut = useUpdateWriteOffDraft(id);
  const addItemsMut = useAddItemsToWriteOff(id);
  const removeItemMut = useRemoveWriteOffItem(id);
  const uploadMut = useUploadEvidencePhoto(id);
  const removePhotoMut = useRemoveEvidencePhoto(id);
  const approveMut = useApproveWriteOff(id);
  const cancelMut = useCancelWriteOff(id);
  const submitMut = useSubmitWriteOffForApproval(id);

  const fileRef = useRef<HTMLInputElement>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [type, setType] = useState<WriteOffType | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [approveOpen, setApproveOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const record = data?.record;
  const items = data?.items ?? [];
  const isDraft = record?.status === 'draft';
  const total = useMemo(() => items.reduce((s, i) => s + Number(i.unit_cost_value || 0), 0), [items]);
  const photos = record?.evidence_photos ?? [];

  const { data: eligible = [] } = useEligibleWriteOffSerials(addOpen ? search : '');

  if (!record) {
    return <AppLayout title="Inventory" moduleNav={INVENTORY_NAV}><div className="p-6">Loading…</div></AppLayout>;
  }

  const currentReason = reason ?? record.reason;
  const currentType = type ?? record.write_off_type;

  const saveDraft = async () => {
    try {
      await updateMut.mutateAsync({ reason: currentReason, write_off_type: currentType });
      toast({ title: 'Saved' });
    } catch (e: any) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    }
  };

  const onUpload = async (f: File) => {
    try { await uploadMut.mutateAsync(f); } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    }
  };

  const submit = async () => {
    if (!currentReason.trim()) { toast({ title: 'Reason required', variant: 'destructive' }); return; }
    if (photos.length < 1) { toast({ title: 'At least one evidence photo required', variant: 'destructive' }); return; }
    if (items.length === 0) { toast({ title: 'Add at least one item', variant: 'destructive' }); return; }
    await saveDraft();
    await submitMut.mutateAsync();
    toast({ title: 'Submitted for super admin approval' });
  };

  const approve = async () => {
    try {
      const res = await approveMut.mutateAsync();
      toast({ title: 'Write-off approved', description: `₹ ${Number(res.total_value).toLocaleString('en-IN')} written off (${res.item_count} items)` });
      setApproveOpen(false);
    } catch (e: any) {
      toast({ title: 'Approval failed', description: e.message, variant: 'destructive' });
    }
  };

  const cancel = async () => {
    if (!cancelReason.trim()) return;
    try {
      await cancelMut.mutateAsync(cancelReason.trim());
      toast({ title: 'Cancelled' });
      setCancelOpen(false); setCancelReason('');
    } catch (e: any) {
      toast({ title: 'Cancel failed', description: e.message, variant: 'destructive' });
    }
  };

  const addSelected = async () => {
    const ids = Object.entries(selectedIds).filter(([, v]) => v).map(([k]) => k);
    if (ids.length === 0) return;
    try {
      await addItemsMut.mutateAsync({ serialIds: ids });
      setSelectedIds({}); setAddOpen(false); setSearch('');
    } catch (e: any) {
      toast({ title: 'Add failed', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <AppLayout title="Inventory" moduleNav={INVENTORY_NAV}>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/inventory/write-offs')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">Write-off</div>
            <div className="text-xl font-semibold font-mono">{record.wf_number}</div>
          </div>
          <Badge variant="outline" className={STATUS_STYLES[record.status]}>{record.status}</Badge>
          <Button variant="outline" size="sm" onClick={() => window.open(`/print/write_off/${id}`, '_blank')}>
            <Printer className="h-4 w-4 mr-1" /> Print
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase">Type</label>
                {isDraft ? (
                  <Select value={currentType} onValueChange={(v) => setType(v as WriteOffType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm capitalize mt-1">{record.write_off_type.replace(/_/g, ' ')}</div>
                )}
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase">Source</label>
                <div className="text-sm mt-1">{record.source_document_reference ?? record.source_type ?? '—'}</div>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase">Reason (required)</label>
              {isDraft ? (
                <Textarea
                  value={currentReason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  placeholder=""
                />
              ) : (
                <div className="text-sm whitespace-pre-wrap mt-1 border rounded p-3">{record.reason || '—'}</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Evidence Photos ({photos.length})</CardTitle>
            {isDraft && (
              <>
                <input
                  ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.currentTarget.value = ''; }}
                />
                <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-1" /> Upload Photo
                </Button>
              </>
            )}
          </CardHeader>
          <CardContent>
            {photos.length === 0 ? (
              <div className="text-sm text-muted-foreground">No photos uploaded yet</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {photos.map((url, i) => (
                  <div key={i} className="relative group">
                    <a href={url} target="_blank" rel="noreferrer">
                      <img src={url} alt={`Evidence ${i + 1}`} className="w-full h-32 object-cover border rounded" />
                    </a>
                    {isDraft && (
                      <Button
                        size="icon" variant="destructive"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={() => removePhotoMut.mutate(url)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Items ({items.length})</CardTitle>
            {isDraft && (
              <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add Items
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serial</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead>Notes</TableHead>
                  {isDraft && <TableHead />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 && (
                  <TableRow><TableCell colSpan={isDraft ? 5 : 4} className="text-center text-muted-foreground py-6">No items</TableCell></TableRow>
                )}
                {items.map(it => (
                  <TableRow key={it.id}>
                    <TableCell className="font-mono text-xs">{it.serial_number}</TableCell>
                    <TableCell>{it.product?.name ?? it.product_id}</TableCell>
                    <TableCell className="text-right">₹ {Number(it.unit_cost_value || 0).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-sm">{it.item_specific_notes ?? ''}</TableCell>
                    {isDraft && (
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => removeItemMut.mutate(it.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="text-right text-sm mt-3">
              <span className="text-muted-foreground">Total Value: </span>
              <span className="font-semibold">₹ {total.toLocaleString('en-IN')}</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          {isDraft && (
            <>
              <Button variant="outline" onClick={saveDraft}>Save Draft</Button>
              <Button onClick={submit}>Submit for Approval</Button>
              {isSuper && (
                <>
                  <Button variant="outline" onClick={() => setCancelOpen(true)}>Cancel</Button>
                  <Button onClick={() => setApproveOpen(true)}>
                    <Check className="h-4 w-4 mr-1" /> Approve
                  </Button>
                </>
              )}
            </>
          )}
          {record.status === 'approved' && record.approved_at && (
            <div className="text-xs text-muted-foreground">
              Approved {format(parseISO(record.approved_at), 'dd MMM yyyy HH:mm')}
            </div>
          )}
        </div>

        {id && <ActivityChatter recordType="write_off" recordId={id} />}

        {/* Add items dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Items to Write-off</DialogTitle>
              <DialogDescription>Choose serials from Available / Under Correction / Reserved stock</DialogDescription>
            </DialogHeader>
            <Input placeholder="Search serial…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="max-h-80 overflow-auto border rounded">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Serial</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eligible.map(s => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <Checkbox
                          checked={!!selectedIds[s.id]}
                          onCheckedChange={(v) => setSelectedIds(p => ({ ...p, [s.id]: !!v }))}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{s.serial_number}</TableCell>
                      <TableCell>{s.product_name ?? s.product_id}</TableCell>
                      <TableCell className="text-xs capitalize">{s.stock_status.replace(/_/g, ' ')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={addSelected}>Add Selected</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Approve dialog */}
        <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Write-off</DialogTitle>
              <DialogDescription>
                This will mark {items.length} serial(s) as written-off and impact stock by ₹ {total.toLocaleString('en-IN')}. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setApproveOpen(false)}>Cancel</Button>
              <Button onClick={approve}>Confirm Approval</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel dialog */}
        <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Write-off</DialogTitle>
              <DialogDescription>Provide a reason for cancelling this draft.</DialogDescription>
            </DialogHeader>
            <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={3} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelOpen(false)}>Keep Draft</Button>
              <Button variant="destructive" onClick={cancel}>Cancel Write-off</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
