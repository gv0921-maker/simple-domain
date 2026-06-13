import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowRightLeft, Receipt, BadgeIndianRupee, CheckCircle2, Printer } from 'lucide-react';
import type { ReturnRequest, ReturnRequestItem } from '@/lib/services/returns';
import {
  useExchangesForReturn, useEligibleReplacementProducts, useAvailableReplacementSerials,
  useProcessExchange, useSelectExchangeSerial, useSettleExchangeDifference, useCompleteExchange,
  useProcessCreditNoteResolution, useProcessRefundResolution,
  useApplyStockAction, useCompleteReturnRequest,
} from '@/hooks/returns/resolution';
import { getAllowedResolutionsForGrade, type AllowedResolution } from '@/lib/services/returns/resolution';
import { usePaymentAccounts } from '@/hooks/sales/payments';
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';

const fmtINR = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

interface Props { rt: ReturnRequest }

export function ResolutionSection({ rt }: Props) {
  const { data: exchanges = [] } = useExchangesForReturn(rt.id);
  const { isAdmin: isSuperAdmin } = useIsSuperAdmin();

  const items = rt.items ?? [];
  const allQCDone = items.length > 0 && items.every((i) => i.qc_status === 'completed');
  const allResolved = items.length > 0 && items.every((i) => i.resolution_status === 'completed');

  if (!allQCDone || rt.request_status === 'resolved' || rt.request_status === 'closed') {
    return null;
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Resolution</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {items.map((it) => (
          <ItemResolutionCard
            key={it.id}
            item={it}
            rt={rt}
            isSuperAdmin={isSuperAdmin}
            exchange={exchanges.find((e) => e.return_request_item_id === it.id)}
          />
        ))}
        {allResolved && (
          <FinalizeReturnPanel rtId={rt.id} />
        )}
      </CardContent>
    </Card>
  );
}

function ItemResolutionCard({
  item, rt, isSuperAdmin, exchange,
}: { item: ReturnRequestItem; rt: ReturnRequest; isSuperAdmin: boolean; exchange?: any }) {
  const allowed = useMemo(() => getAllowedResolutionsForGrade(item.condition_grade), [item.condition_grade]);
  const [picked, setPicked] = useState<AllowedResolution | ''>('');
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [cnOpen, setCnOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);

  const completed = item.resolution_status === 'completed';

  return (
    <div className="border rounded-md p-3 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm">
          <div className="font-medium">{item.product?.name} · {item.serial_number}</div>
          <div className="text-xs text-muted-foreground">Original: {fmtINR(item.original_unit_price)}</div>
        </div>
        <div className="flex items-center gap-2">
          {item.condition_grade && <Badge variant="outline">{item.condition_grade.replace('_',' ')}</Badge>}
          {completed
            ? <Badge className="bg-emerald-600 text-white capitalize">{item.resolution_type ?? 'done'}</Badge>
            : item.resolution_status === 'in_progress'
              ? <Badge className="bg-amber-500 text-white">In Progress</Badge>
              : <Badge variant="outline">Pending</Badge>}
        </div>
      </div>

      {!completed && item.resolution_status !== 'in_progress' && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[200px]">
            <Label className="text-xs">Resolution</Label>
            <Select value={picked} onValueChange={(v) => setPicked(v as AllowedResolution)}>
              <SelectTrigger><SelectValue placeholder="Pick…" /></SelectTrigger>
              <SelectContent>
                {allowed.includes('exchange') && <SelectItem value="exchange">Exchange (same/higher value)</SelectItem>}
                {allowed.includes('credit_note') && <SelectItem value="credit_note">Credit Note (6-month expiry)</SelectItem>}
                {allowed.includes('refund') && <SelectItem value="refund">Cash/Bank Refund</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          <Button
            size="sm"
            disabled={!picked}
            onClick={() => {
              if (picked === 'exchange') setExchangeOpen(true);
              if (picked === 'credit_note') {
                if (!isSuperAdmin) { toast.error('Only super admins can issue credit notes'); return; }
                setCnOpen(true);
              }
              if (picked === 'refund') {
                if (!isSuperAdmin) { toast.error('Only super admins can process refunds'); return; }
                setRefundOpen(true);
              }
            }}
          >
            Process
          </Button>
        </div>
      )}

      {item.resolution_type === 'exchange' && exchange && (
        <ExchangeWorkflowPanel exchange={exchange} item={item} />
      )}

      <ExchangeWizard open={exchangeOpen} onOpenChange={setExchangeOpen} item={item} />
      <CreditNoteDialog open={cnOpen} onOpenChange={setCnOpen} item={item} rt={rt} />
      <RefundDialog open={refundOpen} onOpenChange={setRefundOpen} item={item} />
    </div>
  );
}

function ExchangeWizard({ open, onOpenChange, item }: {
  open: boolean; onOpenChange: (b: boolean) => void; item: ReturnRequestItem;
}) {
  const [query, setQuery] = useState('');
  const { data: products = [], isLoading } = useEligibleReplacementProducts(item.original_unit_price, query, open);
  const processMut = useProcessExchange();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Exchange — Pick Replacement Product</DialogTitle>
          <DialogDescription>
            Replacement price must be ≥ {fmtINR(item.original_unit_price)} (original). Customer pays the difference.
          </DialogDescription>
        </DialogHeader>
        <Input placeholder="Search product…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="max-h-72 overflow-y-auto border rounded">
          {isLoading && <div className="p-3 text-xs text-muted-foreground">Loading…</div>}
          {!isLoading && products.length === 0 && (
            <div className="p-3 text-xs text-muted-foreground">No eligible products found.</div>
          )}
          {products.map((p) => {
            const diff = Number(p.sale_price) - Number(item.original_unit_price);
            return (
              <button
                key={p.id}
                className="w-full text-left p-3 border-b hover:bg-muted text-sm flex justify-between items-center"
                onClick={() => {
                  processMut.mutate(
                    { itemId: item.id, replacementProductId: p.id },
                    {
                      onSuccess: () => {
                        toast.success(`Exchange created. Difference: ${fmtINR(diff)}`);
                        onOpenChange(false);
                      },
                      onError: (e: any) => toast.error(e?.message ?? 'Failed'),
                    },
                  );
                }}
              >
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.sku ?? '—'}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono">{fmtINR(p.sale_price)}</div>
                  <div className="text-xs text-muted-foreground">
                    Diff: {fmtINR(diff)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExchangeWorkflowPanel({ exchange, item }: { exchange: any; item: ReturnRequestItem }) {
  const navigate = useNavigate();
  const { data: serials = [] } = useAvailableReplacementSerials(exchange.replacement_product_id);
  const { data: accounts = [] } = usePaymentAccounts(true);
  const selectSerial = useSelectExchangeSerial();
  const settle = useSettleExchangeDifference();
  const complete = useCompleteExchange();

  const [serialId, setSerialId] = useState('');
  const [settleOpen, setSettleOpen] = useState(false);
  const [mode, setMode] = useState<'cash'|'bank_transfer'|'cheque'|'card'|'upi'>('cash');
  const [acctId, setAcctId] = useState('');
  const [refNum, setRefNum] = useState('');

  const diff = Number(exchange.price_difference || 0);

  return (
    <div className="mt-2 p-3 bg-muted/30 rounded space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <ArrowRightLeft className="h-4 w-4" />
        <span className="font-medium">Exchange {exchange.exchange_number}</span>
        <Badge variant="outline" className="capitalize">{exchange.status.replace('_',' ')}</Badge>
        <Button size="sm" variant="ghost" className="ml-auto" onClick={() => window.open(`/print/exchange/${exchange.id}`,'_blank')}>
          <Printer className="h-3.5 w-3.5 mr-1" />Print
        </Button>
      </div>
      <div className="text-xs text-muted-foreground">
        {fmtINR(exchange.original_unit_price)} → {fmtINR(exchange.replacement_unit_price)} ·
        Difference: <span className="font-semibold text-foreground">{fmtINR(diff)}</span>
      </div>

      {/* Step: pick serial */}
      {exchange.status === 'pending' && (
        <div className="flex items-end gap-2">
          <div className="flex-1 min-w-[180px]">
            <Label className="text-xs">Available Serial</Label>
            <Select value={serialId} onValueChange={setSerialId}>
              <SelectTrigger><SelectValue placeholder={serials.length ? 'Pick a serial' : 'None available'} /></SelectTrigger>
              <SelectContent>
                {serials.map((s) => <SelectItem key={s.id} value={s.id}>{s.serial_number}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button
            size="sm"
            disabled={!serialId || selectSerial.isPending}
            onClick={() => selectSerial.mutate({ exchangeId: exchange.id, serialId }, {
              onSuccess: () => toast.success('Replacement serial reserved'),
              onError: (e: any) => toast.error(e?.message ?? 'Failed'),
            })}
          >Reserve</Button>
        </div>
      )}

      {/* Step: settle difference */}
      {exchange.status === 'item_selected' && diff > 0 && !exchange.price_difference_settled && (
        <Button size="sm" onClick={() => setSettleOpen(true)}>Collect Difference {fmtINR(diff)}</Button>
      )}
      {exchange.status === 'item_selected' && diff <= 0 && (
        <Button size="sm" onClick={() => settle.mutate({ exchangeId: exchange.id, paymentMode: 'cash', paymentAccountId: '' }, {
          onSuccess: () => toast.success('No difference — marked settled'),
          onError: (e: any) => toast.error(e?.message ?? 'Failed'),
        })}>Mark Settled (no difference)</Button>
      )}

      {/* Step: complete (creates DN-equivalent + marks sold) */}
      {exchange.status === 'price_settled' && (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => complete.mutate(exchange.id, {
            onSuccess: () => toast.success('Exchange completed — replacement delivered'),
            onError: (e: any) => toast.error(e?.message ?? 'Failed'),
          })}>
            <CheckCircle2 className="h-4 w-4 mr-1" />Complete Exchange
          </Button>
        </div>
      )}

      <Dialog open={settleOpen} onOpenChange={setSettleOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Collect Price Difference — {fmtINR(diff)}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <Label>Mode</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Account</Label>
              <Select value={acctId} onValueChange={setAcctId}>
                <SelectTrigger><SelectValue placeholder="Account" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.account_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Reference</Label>
              <Input value={refNum} onChange={(e) => setRefNum(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettleOpen(false)}>Cancel</Button>
            <Button
              disabled={!acctId || settle.isPending}
              onClick={() => settle.mutate(
                { exchangeId: exchange.id, paymentMode: mode, paymentAccountId: acctId, referenceNumber: refNum || null },
                { onSuccess: () => { toast.success('Difference collected'); setSettleOpen(false); },
                  onError: (e: any) => toast.error(e?.message ?? 'Failed') },
              )}
            >Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreditNoteDialog({ open, onOpenChange, item, rt }: {
  open: boolean; onOpenChange: (b: boolean) => void; item: ReturnRequestItem; rt: ReturnRequest;
}) {
  const [notes, setNotes] = useState('');
  const process = useProcessCreditNoteResolution();
  const issueDate = new Date();
  const expiryDate = new Date(); expiryDate.setMonth(expiryDate.getMonth() + 6);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Issue Credit Note</DialogTitle></DialogHeader>
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Amount</Label><div className="font-semibold text-lg">{fmtINR(item.original_unit_price)}</div></div>
            <div><Label>Customer</Label><div className="font-semibold">{rt.customer_name_snapshot ?? '—'}</div></div>
            <div><Label>Issue Date</Label><div>{issueDate.toLocaleDateString('en-IN')}</div></div>
            <div><Label>Expiry</Label><div>{expiryDate.toLocaleDateString('en-IN')}</div></div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={process.isPending}
            onClick={() => process.mutate(
              { itemId: item.id, notes: notes || null },
              {
                onSuccess: (cnId) => {
                  toast.success('Credit Note issued');
                  onOpenChange(false);
                  window.open(`/print/credit_note/${cnId}`, '_blank');
                },
                onError: (e: any) => toast.error(e?.message ?? 'Failed'),
              },
            )}
          ><Receipt className="h-4 w-4 mr-1" />Issue Credit Note</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RefundDialog({ open, onOpenChange, item }: {
  open: boolean; onOpenChange: (b: boolean) => void; item: ReturnRequestItem;
}) {
  const [amount, setAmount] = useState(String(item.original_unit_price));
  const [mode, setMode] = useState<'cash'|'bank_transfer'|'cheque'|'upi'>('cash');
  const [acctId, setAcctId] = useState('');
  const [refNum, setRefNum] = useState('');
  const [notes, setNotes] = useState('');
  const { data: accounts = [] } = usePaymentAccounts(true);
  const process = useProcessRefundResolution();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Process Refund</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <Label>Amount *</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label>Mode *</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label>Payment Account *</Label>
            <Select value={acctId} onValueChange={setAcctId}>
              <SelectTrigger><SelectValue placeholder="Account paying out" /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.account_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label>Reference</Label>
            <Input value={refNum} onChange={(e) => setRefNum(e.target.value)} placeholder="Cheque#, UPI ref, etc." />
          </div>
          <div className="col-span-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!acctId || !amount || process.isPending}
            onClick={() => process.mutate(
              { itemId: item.id, amount: Number(amount), mode, paymentAccountId: acctId, referenceNumber: refNum || null },
              {
                onSuccess: (rid) => {
                  toast.success('Refund processed');
                  onOpenChange(false);
                  window.open(`/print/refund_voucher/${rid}`, '_blank');
                },
                onError: (e: any) => toast.error(e?.message ?? 'Failed'),
              },
            )}
          ><BadgeIndianRupee className="h-4 w-4 mr-1" />Process Refund</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FinalizeReturnPanel({ rtId }: { rtId: string }) {
  const apply = useApplyStockAction();
  const complete = useCompleteReturnRequest();
  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState<string[]>([]);

  const onApply = async () => {
    setRunning(true);
    const lines: string[] = [];
    try {
      const { data: items } = await (await import('@/integrations/supabase/client')).supabase
        .from('return_request_items')
        .select('id, condition_grade')
        .eq('return_request_id', rtId);
      for (const it of (items ?? []) as any[]) {
        const res = await apply.mutateAsync(it.id);
        lines.push(`${it.condition_grade}: ${res.action}`);
      }
      setSummary(lines);
      toast.success('Stock actions applied');
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to apply stock actions');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="border rounded p-3 bg-emerald-50/50 border-emerald-200 space-y-2">
      <div className="text-sm font-medium">All items resolved.</div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={running} onClick={onApply}>
          Apply Stock Actions
        </Button>
        <Button
          size="sm"
          disabled={complete.isPending}
          onClick={() => complete.mutate(rtId, {
            onSuccess: () => toast.success('Return resolved'),
            onError: (e: any) => toast.error(e?.message ?? 'Failed'),
          })}
        >
          <CheckCircle2 className="h-4 w-4 mr-1" />Complete Return
        </Button>
      </div>
      {summary.length > 0 && (
        <ul className="text-xs text-muted-foreground list-disc pl-5">
          {summary.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      )}
    </div>
  );
}
