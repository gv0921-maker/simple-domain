import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Printer, Check, Send, Truck, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { VENDOR_ORDERS_NAV } from '@/lib/navigation/vendorOrders';
import {
  useVendorOrder, useUpdateVODraft, useSubmitVOForApproval,
  useApproveVO, usePlaceVO, useCancelVO, useRecordVOReceipt, useGRsForVO,
} from '@/hooks/vendor-orders';
import { VO_STATUS_LABEL, type VOStatus } from '@/lib/services/vendor-orders';
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';
import { useToast } from '@/hooks/use-toast';

const STATUS_STYLES: Record<VOStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  pending_approval: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-blue-50 text-blue-700 border-blue-200',
  placed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  partial: 'bg-purple-50 text-purple-700 border-purple-200',
  received: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/30',
};

export default function VendorOrderDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin: isSuper } = useIsSuperAdmin();

  const { data } = useVendorOrder(id);
  const { data: grs = [] } = useGRsForVO(id);
  const updateMut = useUpdateVODraft();
  const submitMut = useSubmitVOForApproval();
  const approveMut = useApproveVO();
  const placeMut = usePlaceVO();
  const cancelMut = useCancelVO();
  const receiptMut = useRecordVOReceipt();

  const [eta, setEta] = useState<string | null>(null);
  const [notes, setNotes] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptQty, setReceiptQty] = useState<Record<string, number>>({});

  const vo = data?.vo;
  const lines = data?.lines ?? [];
  const isDraft = vo?.status === 'draft';
  const canReceive = vo && ['placed', 'partial'].includes(vo.status);

  const totalQty = useMemo(() => lines.reduce((s, l) => s + l.quantity_ordered, 0), [lines]);
  const totalReceived = useMemo(() => lines.reduce((s, l) => s + l.quantity_received, 0), [lines]);

  if (!vo) {
    return <AppLayout title="Vendor Orders" moduleNav={VENDOR_ORDERS_NAV}><div className="p-6">Loading…</div></AppLayout>;
  }

  const currentEta = eta ?? vo.eta_date;
  const currentNotes = notes ?? vo.notes ?? '';

  const saveDraft = async () => {
    try {
      await updateMut.mutateAsync({ voId: id, input: { eta_date: currentEta, notes: currentNotes || null } });
      toast({ title: 'Saved' });
    } catch (e: any) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    }
  };
  const submit = async () => {
    if (lines.length === 0) { toast({ title: 'Add at least one line', variant: 'destructive' }); return; }
    await saveDraft();
    try { await submitMut.mutateAsync(id); toast({ title: 'Submitted for approval' }); }
    catch (e: any) { toast({ title: 'Submit failed', description: e.message, variant: 'destructive' }); }
  };
  const approve = async () => {
    try { await approveMut.mutateAsync(id); toast({ title: 'Approved' }); }
    catch (e: any) { toast({ title: 'Approve failed', description: e.message, variant: 'destructive' }); }
  };
  const place = async () => {
    try { await placeMut.mutateAsync(id); toast({ title: 'Order placed with vendor' }); }
    catch (e: any) { toast({ title: 'Place failed', description: e.message, variant: 'destructive' }); }
  };
  const cancel = async () => {
    if (!cancelReason.trim()) return;
    try {
      await cancelMut.mutateAsync({ voId: id, reason: cancelReason.trim() });
      toast({ title: 'Cancelled' });
      setCancelOpen(false); setCancelReason('');
    } catch (e: any) {
      toast({ title: 'Cancel failed', description: e.message, variant: 'destructive' });
    }
  };
  const recordReceipt = async () => {
    const lineReceipts = Object.entries(receiptQty)
      .map(([line_id, q]) => ({ line_id, quantity_received: Math.max(0, Math.floor(q)) }))
      .filter(r => r.quantity_received > 0);
    if (lineReceipts.length === 0) { toast({ title: 'Enter received quantities', variant: 'destructive' }); return; }
    try {
      const grId = await receiptMut.mutateAsync({ voId: id, lineReceipts });
      toast({ title: 'Receipt recorded', description: `Goods Receipt created` });
      setReceiptOpen(false); setReceiptQty({});
      navigate(`/inventory/goods-receipts/${grId}`);
    } catch (e: any) {
      toast({ title: 'Receipt failed', description: e.message, variant: 'destructive' });
    }
  };

  const v = vo.vendor;

  return (
    <AppLayout title="Vendor Orders" moduleNav={VENDOR_ORDERS_NAV}>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/vendor-orders')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">Vendor Order</div>
            <div className="text-xl font-semibold font-mono">{vo.vo_number}</div>
          </div>
          <Badge variant="outline" className={STATUS_STYLES[vo.status]}>{VO_STATUS_LABEL[vo.status]}</Badge>
          <Button variant="outline" size="sm" onClick={() => window.open(`/print/vendor_order/${id}`, '_blank')}>
            <Printer className="h-4 w-4 mr-1" /> Print
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Vendor</Label>
                <div className="text-sm mt-1">
                  <div className="font-semibold">{v?.name ?? '—'}</div>
                  {v?.contact_person && <div className="text-muted-foreground">{v.contact_person}</div>}
                  {v?.phone && <div className="text-muted-foreground">{v.phone}</div>}
                  {v?.gstin && <div className="text-muted-foreground">GSTIN: {v.gstin}</div>}
                </div>
              </div>
              <div>
                <Label>Mode</Label>
                <div className="text-sm mt-1 capitalize">{vo.order_mode}</div>
                {vo.linked_sales_order?.reference && (
                  <div className="text-xs text-muted-foreground mt-1">Linked SO: <span className="font-mono">{vo.linked_sales_order.reference}</span></div>
                )}
              </div>
              <div>
                <Label>ETA</Label>
                {isDraft ? (
                  <Input type="date" value={currentEta} onChange={(e) => setEta(e.target.value)} />
                ) : (
                  <div className="text-sm mt-1">{vo.eta_date}</div>
                )}
              </div>
              <div>
                <Label>Created</Label>
                <div className="text-sm mt-1">{format(parseISO(vo.created_at), 'dd MMM yyyy HH:mm')}</div>
              </div>
            </div>
            <div>
              <Label>Notes / Terms</Label>
              {isDraft ? (
                <Textarea rows={3} value={currentNotes} onChange={(e) => setNotes(e.target.value)} placeholder="" />
              ) : (
                <div className="text-sm whitespace-pre-wrap mt-1 border rounded p-3 min-h-[3rem]">{vo.notes || '—'}</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Lines ({lines.length})</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Specifications</TableHead>
                  <TableHead className="text-right">Ordered</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No lines</TableCell></TableRow>
                )}
                {lines.map(l => (
                  <TableRow key={l.id}>
                    <TableCell>{l.product?.name ?? l.product_id}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {l.size_spec && <div>Size: {l.size_spec}</div>}
                      {l.colour_polish_spec && <div>Colour: {l.colour_polish_spec}</div>}
                      {l.fabric_spec && <div>Fabric: {l.fabric_spec}</div>}
                      {l.customization_notes && <div>{l.customization_notes}</div>}
                    </TableCell>
                    <TableCell className="text-right">{l.quantity_ordered}</TableCell>
                    <TableCell className="text-right">{l.quantity_received}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="text-right text-sm mt-3">
              <span className="text-muted-foreground">Total: </span>
              <span className="font-semibold">{totalReceived} / {totalQty}</span>
            </div>
          </CardContent>
        </Card>

        {grs.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Goods Receipts</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>GR Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grs.map(g => (
                    <TableRow key={g.id} className="cursor-pointer" onClick={() => navigate(`/inventory/goods-receipts/${g.id}`)}>
                      <TableCell className="font-mono">{g.gr_number}</TableCell>
                      <TableCell className="capitalize">{g.status}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(parseISO(g.created_at), 'dd MMM yyyy')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          {isDraft && (
            <>
              <Button variant="outline" onClick={saveDraft}>Save Draft</Button>
              <Button onClick={submit}><Send className="h-4 w-4 mr-1" /> Submit for Approval</Button>
            </>
          )}
          {vo.status === 'pending_approval' && isSuper && (
            <Button onClick={approve}><Check className="h-4 w-4 mr-1" /> Approve</Button>
          )}
          {vo.status === 'approved' && (
            <Button onClick={place}><Truck className="h-4 w-4 mr-1" /> Mark as Placed</Button>
          )}
          {canReceive && (
            <Button onClick={() => setReceiptOpen(true)}>Record Receipt</Button>
          )}
          {!['received', 'cancelled'].includes(vo.status) && (
            <Button variant="outline" onClick={() => setCancelOpen(true)}>
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
          )}
        </div>

        <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Vendor Order</DialogTitle>
              <DialogDescription>Provide a reason for cancellation.</DialogDescription>
            </DialogHeader>
            <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={3} placeholder="" />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelOpen(false)}>Keep</Button>
              <Button variant="destructive" onClick={cancel}>Cancel Order</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Record Receipt</DialogTitle>
              <DialogDescription>Enter the quantity received for each line. A Goods Receipt will be created.</DialogDescription>
            </DialogHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Ordered</TableHead>
                  <TableHead className="text-right">Already Received</TableHead>
                  <TableHead className="text-right">Receiving Now</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map(l => {
                  const remaining = Math.max(0, l.quantity_ordered - l.quantity_received);
                  return (
                    <TableRow key={l.id}>
                      <TableCell>{l.product?.name ?? l.product_id}</TableCell>
                      <TableCell className="text-right">{l.quantity_ordered}</TableCell>
                      <TableCell className="text-right">{l.quantity_received}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number" min={0} max={remaining}
                          value={receiptQty[l.id] ?? 0}
                          onChange={(e) => setReceiptQty(p => ({ ...p, [l.id]: Number(e.target.value) || 0 }))}
                          className="w-24 inline-block text-right"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReceiptOpen(false)}>Cancel</Button>
              <Button onClick={recordReceipt} disabled={receiptMut.isPending}>
                {receiptMut.isPending ? 'Saving…' : 'Create Goods Receipt'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}