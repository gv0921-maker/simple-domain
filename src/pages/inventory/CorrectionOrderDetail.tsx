import { useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ActivityChatter } from '@/components/shared/ActivityChatter';
import { INVENTORY_NAV } from '@/lib/navigation';
import {
  useCorrectionOrder,
  useUpdateCorrectionOrderHeader,
  useSendCorrectionOrder,
  useRecordItemReturnedToVendor,
  useRecordItemReceivedBack,
  useCompleteCorrectionQCCycle,
  useRecordVendorRefund,
  useCloseCorrectionOrder,
  useCancelCorrectionOrder,
} from '@/hooks/inventory/correctionOrders';
import { usePaymentAccounts } from '@/hooks/sales/payments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronDown, ChevronRight, Printer, Send, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';
import { format, parseISO } from 'date-fns';
import type { COCorrectionType, COAddressedToType } from '@/lib/services/inventory/correctionOrders';

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-primary/15 text-primary',
  in_progress: 'bg-accent text-accent-foreground',
  completed: 'bg-success/15 text-success-foreground',
  closed: 'bg-success/15 text-success-foreground',
  cancelled: 'bg-destructive/15 text-destructive',
};

const ITEM_STATUS_STYLES: Record<string, string> = {
  awaiting_correction: 'bg-warning/15 text-warning',
  returned_to_vendor: 'bg-accent text-accent-foreground',
  received_back: 'bg-primary/15 text-primary',
  qc_passed: 'bg-success/15 text-success-foreground',
  qc_failed_again: 'bg-destructive/15 text-destructive',
  refunded_by_vendor: 'bg-muted text-muted-foreground',
  closed: 'bg-muted text-muted-foreground',
};

export default function CorrectionOrderDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin: isSuperAdmin } = useIsSuperAdmin();
  const { data, isLoading } = useCorrectionOrder(id);
  const co = data?.co;
  const items = data?.items ?? [];
  const cycles = data?.cycles ?? [];

  const updateHeader = useUpdateCorrectionOrderHeader(id);
  const sendCO = useSendCorrectionOrder(id);
  const returnedToVendor = useRecordItemReturnedToVendor(id);
  const receivedBack = useRecordItemReceivedBack(id);
  const completeQC = useCompleteCorrectionQCCycle(id);
  const recordRefund = useRecordVendorRefund(id);
  const closeCO = useCloseCorrectionOrder(id);
  const cancelCO = useCancelCorrectionOrder(id);

  const [expanded, setExpanded] = useState<string | null>(null);
  const [qcDialog, setQcDialog] = useState<{ open: boolean; itemId?: string }>({ open: false });
  const [refundDialog, setRefundDialog] = useState<{ open: boolean; itemId?: string }>({ open: false });

  const isDraft = co?.status === 'draft';
  const isClosed = co?.status === 'closed' || co?.status === 'cancelled';

  if (isLoading || !co) {
    return (
      <AppLayout title="Correction Order" moduleNav={INVENTORY_NAV}>
        <div className="p-6 text-muted-foreground">Loading…</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={co.co_number} moduleNav={INVENTORY_NAV}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{co.co_number}</h1>
            <Badge className={STATUS_STYLES[co.status] ?? ''}>{co.status.replace('_', ' ')}</Badge>
          </div>
          <div className="flex gap-2">
            {isDraft && (
              <Button onClick={async () => { await sendCO.mutateAsync(); toast({ title: 'Correction order sent' }); }}>
                <Send className="h-4 w-4 mr-2" /> Send
              </Button>
            )}
            <Button variant="outline" onClick={() => window.open(`/print/correction_order/${id}`, '_blank')}>
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
            {!isClosed && (
              <Button
                variant="outline"
                onClick={async () => {
                  const r = await closeCO.mutateAsync();
                  if (r.success) toast({ title: 'Correction order closed' });
                  else toast({ title: 'Cannot close', description: r.reason, variant: 'destructive' });
                }}
              >
                Close
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle>Header</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Source</div>
                <div className="text-sm">
                  {co.source_type === 'goods_receipt' && co.source_document_id ? (
                    <Link
                      to={`/inventory/goods-receipts/${co.source_document_id}`}
                      className="text-primary underline inline-flex items-center gap-1"
                    >
                      {co.source_document_reference ?? co.source_document_id}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : (
                    <span>{co.source_document_reference ?? '—'}</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Addressed To</div>
                <div className="flex gap-2">
                  <Select
                    disabled={!isDraft}
                    value={co.addressed_to_type}
                    onValueChange={(v) => updateHeader.mutate({ addressedToType: v as COAddressedToType })}
                  >
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vendor">Vendor</SelectItem>
                      <SelectItem value="factory">Factory</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    disabled={!isDraft}
                    defaultValue={co.addressed_to_name ?? ''}
                    onBlur={(e) => {
                      if (e.target.value !== (co.addressed_to_name ?? '')) {
                        updateHeader.mutate({ addressedToName: e.target.value });
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-2">Correction Type</div>
              <RadioGroup
                disabled={!isDraft}
                value={co.correction_type}
                onValueChange={(v) => updateHeader.mutate({ correctionType: v as COCorrectionType })}
                className="flex gap-6"
              >
                {(['replace', 'exchange', 'repair', 'refund'] as COCorrectionType[]).map(t => (
                  <label key={t} className="flex items-center gap-2 text-sm capitalize">
                    <RadioGroupItem value={t} disabled={!isDraft} /> {t}
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-1">Notes</div>
              <Textarea
                disabled={!isDraft}
                defaultValue={co.notes ?? ''}
                onBlur={(e) => {
                  if (e.target.value !== (co.notes ?? '')) {
                    updateHeader.mutate({ notes: e.target.value });
                  }
                }}
              />
            </div>

            {isSuperAdmin && !isClosed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  const reason = prompt('Cancellation reason?') || '';
                  if (!reason) return;
                  await cancelCO.mutateAsync(reason);
                  toast({ title: 'Correction order cancelled' });
                }}
              >
                Cancel Order
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Items ({items.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Serial</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Original QC</TableHead>
                  <TableHead>Cycle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it: any) => {
                  const itemCycles = cycles.filter(c => c.correction_order_item_id === it.id);
                  const isOpen = expanded === it.id;
                  return (
                    <>
                      <TableRow key={it.id}>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpanded(isOpen ? null : it.id)}>
                            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{it.serial_number}</TableCell>
                        <TableCell>{it.product?.name ?? '—'}</TableCell>
                        <TableCell className="max-w-xs truncate text-xs text-muted-foreground" title={it.original_qc_notes ?? ''}>
                          {it.original_qc_notes ?? '—'}
                        </TableCell>
                        <TableCell>#{it.latest_qc_cycle}</TableCell>
                        <TableCell>
                          <Badge className={ITEM_STATUS_STYLES[it.current_status] ?? ''}>
                            {it.current_status.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="space-x-2">
                          {it.current_status === 'awaiting_correction' && (
                            <Button size="sm" variant="outline" onClick={() => returnedToVendor.mutate({ coItemId: it.id })}>
                              Sent to Vendor
                            </Button>
                          )}
                          {it.current_status === 'returned_to_vendor' && (
                            <Button size="sm" variant="outline" onClick={() => receivedBack.mutate(it.id)}>
                              Received Back
                            </Button>
                          )}
                          {(it.current_status === 'received_back' || it.current_status === 'qc_failed_again') && (
                            <Button size="sm" onClick={() => setQcDialog({ open: true, itemId: it.id })}>
                              Re-QC Now
                            </Button>
                          )}
                          {it.current_status === 'qc_passed' && (
                            <span className="inline-flex items-center text-xs text-success-foreground">
                              <CheckCircle2 className="h-4 w-4 mr-1" /> Passed
                            </span>
                          )}
                          {!['refunded_by_vendor', 'closed'].includes(it.current_status) && (
                            <Button size="sm" variant="ghost" onClick={() => setRefundDialog({ open: true, itemId: it.id })}>
                              Refund
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                      {isOpen && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-muted/30">
                            <div className="text-xs space-y-1">
                              <div className="font-semibold">QC History</div>
                              {itemCycles.length === 0 && <div className="text-muted-foreground">No re-QC cycles yet.</div>}
                              {itemCycles.map(c => (
                                <div key={c.id} className="flex items-start gap-2">
                                  <span className="font-mono">#{c.cycle_number}</span>
                                  {c.qc_status === 'passed'
                                    ? <CheckCircle2 className="h-4 w-4 text-success-foreground" />
                                    : <XCircle className="h-4 w-4 text-destructive" />}
                                  <span className="capitalize font-medium">{c.qc_status}</span>
                                  <span className="text-muted-foreground">{format(parseISO(c.qc_checked_at), 'dd MMM yyyy HH:mm')}</span>
                                  {c.qc_notes && <span className="text-muted-foreground">— {c.qc_notes}</span>}
                                </div>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
                {items.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No items</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <ActivityChatter recordType="correction_order" recordId={id} />
      </div>

      <QCDialog
        open={qcDialog.open}
        itemId={qcDialog.itemId}
        onClose={() => setQcDialog({ open: false })}
        onSubmit={async (passed, notes) => {
          if (!qcDialog.itemId) return;
          await completeQC.mutateAsync({ coItemId: qcDialog.itemId, passed, notes });
          toast({ title: passed ? 'Item passed QC' : 'Item failed re-QC' });
          setQcDialog({ open: false });
        }}
      />

      <RefundDialog
        open={refundDialog.open}
        itemId={refundDialog.itemId}
        onClose={() => setRefundDialog({ open: false })}
        onSubmit={async (input) => {
          if (!refundDialog.itemId) return;
          await recordRefund.mutateAsync({ ...input, coItemId: refundDialog.itemId });
          toast({ title: 'Refund recorded' });
          setRefundDialog({ open: false });
        }}
      />
    </AppLayout>
  );
}

function QCDialog({
  open, onClose, onSubmit,
}: { open: boolean; itemId?: string; onClose: () => void; onSubmit: (passed: boolean, notes: string) => Promise<void> }) {
  const [passed, setPassed] = useState(true);
  const [notes, setNotes] = useState('');
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Re-QC Item</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <RadioGroup value={passed ? 'pass' : 'fail'} onValueChange={(v) => setPassed(v === 'pass')} className="flex gap-6">
            <label className="flex items-center gap-2"><RadioGroupItem value="pass" /> Pass</label>
            <label className="flex items-center gap-2"><RadioGroupItem value="fail" /> Fail</label>
          </RadioGroup>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Notes</div>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSubmit(passed, notes)}>Record QC</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RefundDialog({
  open, onClose, onSubmit,
}: {
  open: boolean;
  itemId?: string;
  onClose: () => void;
  onSubmit: (input: { amount: number; method: 'cash' | 'bank_transfer' | 'cheque' | 'adjustment'; reference?: string; accountId?: string | null; notes?: string }) => Promise<void>;
}) {
  const { data: accounts = [] } = usePaymentAccounts(true);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'cash' | 'bank_transfer' | 'cheque' | 'adjustment'>('bank_transfer');
  const [reference, setReference] = useState('');
  const [accountId, setAccountId] = useState<string>('');
  const [notes, setNotes] = useState('');

  const filtered = useMemo(() => accounts, [accounts]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Record Vendor Refund</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Amount (₹)</div>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Method</div>
            <Select value={method} onValueChange={(v) => setMethod(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="adjustment">Adjustment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Reference</div>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Receiving Account</div>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
              <SelectContent>
                {filtered.length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">No accounts configured</div>
                )}
                {filtered.map((a: any) => (
                  <SelectItem key={a.id} value={a.id}>{a.account_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Notes</div>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => {
              const n = Number(amount);
              if (!Number.isFinite(n) || n <= 0) return;
              onSubmit({ amount: n, method, reference: reference || undefined, accountId: accountId || null, notes: notes || undefined });
            }}
          >
            Record Refund
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}