import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { RETURNS_NAV } from '@/lib/navigation/returns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Printer, Check, X, Send, Camera, ScanLine } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import {
  useReturnRequest, useSubmitReturnForApproval, useApproveReturn,
  useRejectReturn, useCancelReturn, useRecordReturnQC, useUploadReturnPhoto,
} from '@/hooks/returns';
import { RT_STATUS_LABEL, type ReturnStatus, type ConditionGrade } from '@/lib/services/returns';
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';
import { LogNotesPanel } from '@/components/shared/LogNotesPanel';

const STATUS_COLORS: Record<ReturnStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  pending_approval: 'bg-orange-500 text-white',
  approved: 'bg-blue-500 text-white',
  rejected: 'bg-destructive text-destructive-foreground',
  awaiting_receipt: 'bg-amber-500 text-white',
  received: 'bg-blue-600 text-white',
  resolved: 'bg-emerald-600 text-white',
  closed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-muted text-muted-foreground',
};

const GRADE_LABEL: Record<ConditionGrade, string> = {
  like_new: 'Like New',
  minor_damage: 'Minor Damage',
  unsalvageable: 'Unsalvageable',
};

export default function ReturnDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: rt, isLoading } = useReturnRequest(id);
  const { isAdmin } = useIsSuperAdmin();
  const submit = useSubmitReturnForApproval();
  const approve = useApproveReturn();
  const reject = useRejectReturn();
  const cancel = useCancelReturn();
  const recordQC = useRecordReturnQC();
  const uploadPhoto = useUploadReturnPhoto();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [qcDrafts, setQcDrafts] = useState<Record<string, { grade?: ConditionGrade; notes: string; images: string[]; uploading?: boolean }>>({});

  if (isLoading || !rt) {
    return (
      <AppLayout title="Returns" moduleNav={RETURNS_NAV}>
        <div className="p-6">{isLoading ? 'Loading…' : 'Not found'}</div>
      </AppLayout>
    );
  }

  const setDraft = (itemId: string, patch: Partial<{ grade: ConditionGrade; notes: string; images: string[]; uploading: boolean }>) => {
    setQcDrafts((d) => ({ ...d, [itemId]: { grade: undefined, notes: '', images: [], ...d[itemId], ...patch } }));
  };

  const onUploadQC = async (itemId: string, file: File) => {
    setDraft(itemId, { uploading: true });
    try {
      const url = await uploadPhoto.mutateAsync({ rtId: rt.id, file, type: 'qc' });
      const cur = qcDrafts[itemId]?.images ?? [];
      setDraft(itemId, { images: [...cur, url], uploading: false });
    } catch (e: any) {
      toast.error(e?.message ?? 'Upload failed');
      setDraft(itemId, { uploading: false });
    }
  };

  const onRecordQC = async (itemId: string) => {
    const d = qcDrafts[itemId];
    if (!d?.grade) { toast.error('Pick a condition grade'); return; }
    try {
      await recordQC.mutateAsync({ itemId, conditionGrade: d.grade, notes: d.notes || null, images: d.images ?? [] });
      toast.success('QC recorded');
      setQcDrafts((all) => { const c = { ...all }; delete c[itemId]; return c; });
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to record QC');
    }
  };

  return (
    <AppLayout title="Returns" subtitle={rt.rt_number} moduleNav={RETURNS_NAV}>
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/returns')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold">{rt.rt_number}</h1>
                <Badge className={STATUS_COLORS[rt.request_status]}>{RT_STATUS_LABEL[rt.request_status]}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {rt.source_invoice?.reference && (
                  <button className="underline mr-3" onClick={() => navigate(`/invoicing/bills/${rt.source_invoice_id}`)}>
                    Invoice {rt.source_invoice.reference}
                  </button>
                )}
                {rt.source_sales_order?.reference && (
                  <button className="underline mr-3" onClick={() => navigate(`/sales/orders/${rt.source_sales_order_id}`)}>
                    SO {rt.source_sales_order.reference}
                  </button>
                )}
                <span>{rt.customer_name_snapshot ?? '—'}</span>
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={() => window.open(`/print/return_request/${rt.id}`, '_blank')}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
        </div>

        {/* Reason */}
        <Card>
          <CardHeader><CardTitle className="text-base">Reason</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Reason:</span> {rt.customer_reported_reason}</div>
            {rt.customer_reported_issue_description && (
              <div><span className="text-muted-foreground">Details:</span> {rt.customer_reported_issue_description}</div>
            )}
            {rt.customer_photos.length > 0 && (
              <div className="flex gap-2 flex-wrap pt-2">
                {rt.customer_photos.map((p) => (
                  <a key={p} href={p} target="_blank" rel="noreferrer" className="h-20 w-20 rounded border overflow-hidden block">
                    <img src={p} alt="Customer" className="h-full w-full object-cover" />
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action panel by status */}
        {rt.request_status === 'draft' && (
          <Card>
            <CardContent className="p-4 flex justify-between items-center">
              <div className="text-sm text-muted-foreground">Draft — not yet submitted</div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => cancel.mutate({ rtId: rt.id, reason: 'Cancelled by creator' })}>
                  Cancel
                </Button>
                <Button
                  onClick={() => submit.mutate(rt.id, {
                    onSuccess: () => toast.success('Submitted for super admin approval'),
                    onError: (e: any) => toast.error(e?.message ?? 'Submission failed'),
                  })}
                  disabled={submit.isPending}
                >
                  <Send className="h-4 w-4 mr-2" /> Submit for Approval
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {rt.request_status === 'pending_approval' && isAdmin && (
          <Card className="border-orange-300 bg-orange-50">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="text-sm font-medium">Awaiting your decision (super admin)</div>
              <div className="flex gap-2">
                <Button variant="outline" className="border-destructive text-destructive" onClick={() => setRejectOpen(true)}>
                  <X className="h-4 w-4 mr-2" /> Reject
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => approve.mutate(rt.id, {
                    onSuccess: () => toast.success('Return approved'),
                    onError: (e: any) => toast.error(e?.message ?? 'Approval failed'),
                  })}
                  disabled={approve.isPending}
                >
                  <Check className="h-4 w-4 mr-2" /> Approve Return
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {rt.request_status === 'awaiting_receipt' && (
          <Card className="border-amber-300 bg-amber-50">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="text-sm">Customer is bringing items back. Receive via Barcode Module.</div>
              <Button variant="outline" onClick={() => navigate(`/barcode/scan?ref=${rt.rt_number}`)}>
                <ScanLine className="h-4 w-4 mr-2" /> Open Scanner
              </Button>
            </CardContent>
          </Card>
        )}

        {rt.request_status === 'rejected' && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="p-4 text-sm">
              <div className="font-medium text-destructive">Rejected</div>
              <div>{rt.rejection_reason}</div>
              {rt.rejected_at && (
                <div className="text-xs text-muted-foreground mt-1">
                  {format(parseISO(rt.rejected_at), "d MMM yyyy 'at' HH:mm")}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Items */}
        <Card>
          <CardHeader><CardTitle className="text-base">Items</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serial</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Customization</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>QC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(rt.items ?? []).map((it) => (
                  <TableRow key={it.id}>
                    <TableCell>{it.serial_number}</TableCell>
                    <TableCell>{it.product?.name ?? it.product_id}</TableCell>
                    <TableCell className="text-right">₹{Number(it.original_unit_price).toLocaleString('en-IN')}</TableCell>
                    <TableCell>
                      {it.is_customized
                        ? <Badge variant="outline" className="text-destructive">Customized</Badge>
                        : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {it.condition_grade
                        ? <Badge variant="outline">{GRADE_LABEL[it.condition_grade]}</Badge>
                        : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {it.qc_status === 'completed'
                        ? <Badge className="bg-emerald-600 text-white">Done</Badge>
                        : <Badge variant="outline">Pending</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* QC workflow when received */}
        {rt.request_status === 'received' && (
          <Card>
            <CardHeader><CardTitle className="text-base">QC — Condition Grading</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {(rt.items ?? []).filter((i) => i.qc_status !== 'completed').length === 0 && (
                <div className="text-sm text-muted-foreground">All items have been QC'd. Resolution panel will be available in Phase 6 Batch 2.</div>
              )}
              {(rt.items ?? []).filter((i) => i.qc_status !== 'completed').map((it) => {
                const d = qcDrafts[it.id] ?? { notes: '', images: [] as string[] };
                return (
                  <div key={it.id} className="border rounded-md p-3 space-y-2">
                    <div className="font-medium text-sm">{it.product?.name} · {it.serial_number}</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Condition Grade *</Label>
                        <Select value={d.grade ?? ''} onValueChange={(v) => setDraft(it.id, { grade: v as ConditionGrade })}>
                          <SelectTrigger><SelectValue placeholder="" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="like_new">Like New</SelectItem>
                            <SelectItem value="minor_damage">Minor Damage</SelectItem>
                            <SelectItem value="unsalvageable">Unsalvageable</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-xs">Notes</Label>
                        <Textarea
                          value={d.notes}
                          rows={2}
                          onChange={(e) => setDraft(it.id, { notes: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="flex items-center gap-2 text-xs px-2 py-1 border rounded cursor-pointer hover:bg-muted">
                        <Camera className="h-3.5 w-3.5" /> Upload photo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) onUploadQC(it.id, f);
                          }}
                        />
                      </label>
                      {d.images?.map((u) => (
                        <a key={u} href={u} target="_blank" rel="noreferrer" className="h-10 w-10 rounded border overflow-hidden">
                          <img src={u} className="h-full w-full object-cover" />
                        </a>
                      ))}
                      <div className="ml-auto">
                        <Button size="sm" disabled={!d.grade || recordQC.isPending} onClick={() => onRecordQC(it.id)}>
                          Record QC
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <LogNotesPanel recordType="return_request" recordId={rt.id} />
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Return</DialogTitle></DialogHeader>
          <Label>Reason *</Label>
          <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || reject.isPending}
              onClick={() => {
                reject.mutate({ rtId: rt.id, reason: rejectReason.trim() }, {
                  onSuccess: () => { toast.success('Return rejected'); setRejectOpen(false); setRejectReason(''); },
                  onError: (e: any) => toast.error(e?.message ?? 'Rejection failed'),
                });
              }}
            >Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}