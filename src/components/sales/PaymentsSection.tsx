import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CreditCard, Printer, Ban, Banknote, Landmark, Smartphone, FileText, Wallet } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useRoleCheck } from '@/hooks/auth/useRoleCheck';
import {
  usePaymentAccounts, usePaymentSummary, useSalesOrderPayments,
  useRecordPayment, useVoidPayment,
} from '@/hooks/sales/payments';
import type { PaymentMode, SalesOrderPayment } from '@/lib/services/sales/payments';
import { useCustomerActiveCreditNotes, useRedeemCreditNote } from '@/hooks/credit-notes';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

const fmtINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);

const MODES: { value: PaymentMode; label: string; refLabel: string }[] = [
  { value: 'cash', label: 'Cash', refLabel: 'Reference (optional)' },
  { value: 'bank_transfer', label: 'Bank Transfer', refLabel: 'Bank Ref' },
  { value: 'cheque', label: 'Cheque', refLabel: 'Cheque Number' },
  { value: 'card', label: 'Card', refLabel: 'Card Trans ID' },
  { value: 'upi', label: 'UPI', refLabel: 'UPI Ref' },
];

function modeIcon(mode: PaymentMode) {
  switch (mode) {
    case 'cash': return <Banknote className="h-3.5 w-3.5" />;
    case 'bank_transfer': return <Landmark className="h-3.5 w-3.5" />;
    case 'upi': return <Smartphone className="h-3.5 w-3.5" />;
    case 'cheque': return <FileText className="h-3.5 w-3.5" />;
    case 'card': return <CreditCard className="h-3.5 w-3.5" />;
    default: return null;
  }
}

interface Props {
  salesOrderId: string;
}

export function PaymentsSection({ salesOrderId }: Props) {
  const { toast } = useToast();
  const { isSuperAdmin } = useRoleCheck();

  const { data: summary } = usePaymentSummary(salesOrderId);
  const { data: payments = [] } = useSalesOrderPayments(salesOrderId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [cnDialogOpen, setCnDialogOpen] = useState(false);
  const [voidTarget, setVoidTarget] = useState<SalesOrderPayment | null>(null);

  const balance = summary?.balance_remaining ?? 0;
  const totalPaid = summary?.total_paid ?? 0;
  const advancePct = summary?.advance_percent ?? 0;

  const gate = !summary
    ? null
    : summary.is_fully_paid
      ? { label: 'Fully Paid', cls: 'bg-muted text-muted-foreground' }
      : summary.is_advance_met
        ? { label: 'Advance Met', cls: 'bg-success/15 text-success border-success/30' }
        : { label: 'Advance Pending', cls: 'bg-destructive/15 text-destructive border-destructive/30' };

  return (
    <>
      <Card>
        <CardHeader className="pb-3 p-4 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Payments</CardTitle>
          {balance > 0 && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setCnDialogOpen(true)}>
                <Wallet className="h-4 w-4 mr-2" />Use Credit Note
              </Button>
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                <CreditCard className="h-4 w-4 mr-2" />Record Payment
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <SummaryStat label="Order Value" value={fmtINR(summary?.total_amount ?? 0)} />
            <SummaryStat
              label={`Total Paid${summary?.payment_count ? ` · ${summary.payment_count}` : ''}`}
              value={fmtINR(totalPaid)} accent="text-success"
            />
            <SummaryStat label="Balance" value={fmtINR(balance)} accent={balance > 0 ? 'text-foreground' : 'text-muted-foreground'} />
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Advance %</div>
              <div className="font-semibold">{advancePct.toFixed(2)}% / {(summary?.advance_percent_required ?? 0).toFixed(0)}%</div>
              {gate && <Badge variant="outline" className={cn('mt-1 font-normal', gate.cls)}>{gate.label}</Badge>}
            </div>
          </div>

          {/* Ledger */}
          {payments.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center border border-dashed rounded">
              No payments recorded yet.
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PR Number</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="w-32 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p) => (
                      <PaymentRow
                        key={p.id}
                        payment={p}
                        isSuperAdmin={isSuperAdmin}
                        onVoid={() => setVoidTarget(p)}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Mobile cards */}
              <div className="md:hidden space-y-2">
                {payments.map((p) => (
                  <PaymentCard
                    key={p.id}
                    payment={p}
                    isSuperAdmin={isSuperAdmin}
                    onVoid={() => setVoidTarget(p)}
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <RecordPaymentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        salesOrderId={salesOrderId}
        defaultAmount={balance}
        onSuccess={(paymentId) => {
          toast({ title: 'Payment recorded' });
          window.open(`/print/payment_receipt/${paymentId}`, '_blank');
        }}
      />

      <VoidPaymentDialog
        target={voidTarget}
        onClose={() => setVoidTarget(null)}
      />

      <RedeemCreditNoteDialog
        open={cnDialogOpen}
        onOpenChange={setCnDialogOpen}
        salesOrderId={salesOrderId}
        balance={balance}
      />
    </>
  );
}

function SummaryStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn('font-semibold', accent)}>{value}</div>
    </div>
  );
}

function PaymentRow({ payment, isSuperAdmin, onVoid }: {
  payment: SalesOrderPayment; isSuperAdmin: boolean; onVoid: () => void;
}) {
  const voided = payment.is_voided;
  return (
    <TableRow className={voided ? 'opacity-60' : undefined}>
      <TableCell className={cn('font-mono text-xs', voided && 'line-through')}>
        {payment.payment_number}
        {voided && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="destructive" className="ml-2 font-normal">VOIDED</Badge>
              </TooltipTrigger>
              <TooltipContent>{payment.void_reason ?? 'No reason'}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </TableCell>
      <TableCell className="text-xs">{format(parseISO(payment.payment_date), 'MMM d, yyyy HH:mm')}</TableCell>
      <TableCell className={cn('text-right font-medium', voided && 'line-through')}>{fmtINR(payment.amount)}</TableCell>
      <TableCell>
        <Badge variant="outline" className="font-normal gap-1">
          {modeIcon(payment.payment_mode)}
          {payment.payment_mode.replace('_', ' ')}
        </Badge>
      </TableCell>
      <TableCell className="text-xs">{payment.payment_account?.account_name ?? '—'}</TableCell>
      <TableCell className="text-xs">{payment.reference_number ?? '—'}</TableCell>
      <TableCell className="text-right">
        <Button size="sm" variant="ghost"
          onClick={() => window.open(`/print/payment_receipt/${payment.id}`, '_blank')}>
          <Printer className="h-3.5 w-3.5" />
        </Button>
        {isSuperAdmin && !voided && (
          <Button size="sm" variant="ghost" onClick={onVoid} title="Void payment">
            <Ban className="h-3.5 w-3.5 text-destructive" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

function PaymentCard({ payment, isSuperAdmin, onVoid }: {
  payment: SalesOrderPayment; isSuperAdmin: boolean; onVoid: () => void;
}) {
  const voided = payment.is_voided;
  return (
    <div className={cn('border rounded p-3 space-y-1.5 text-sm', voided && 'opacity-60')}>
      <div className="flex items-center justify-between">
        <span className={cn('font-mono text-xs', voided && 'line-through')}>{payment.payment_number}</span>
        {voided ? <Badge variant="destructive" className="font-normal">VOIDED</Badge> : (
          <span className={cn('font-semibold', voided && 'line-through')}>{fmtINR(payment.amount)}</span>
        )}
      </div>
      <div className="text-xs text-muted-foreground">{format(parseISO(payment.payment_date), 'MMM d, yyyy HH:mm')}</div>
      <div className="flex items-center gap-2 text-xs">
        <Badge variant="outline" className="font-normal gap-1">
          {modeIcon(payment.payment_mode)}{payment.payment_mode.replace('_', ' ')}
        </Badge>
        <span className="text-muted-foreground">{payment.payment_account?.account_name ?? '—'}</span>
      </div>
      {payment.reference_number && <div className="text-xs">Ref: {payment.reference_number}</div>}
      {voided && payment.void_reason && <div className="text-xs text-destructive">Reason: {payment.void_reason}</div>}
      <div className="flex justify-end gap-1">
        <Button size="sm" variant="ghost"
          onClick={() => window.open(`/print/payment_receipt/${payment.id}`, '_blank')}>
          <Printer className="h-3.5 w-3.5 mr-1" />Receipt
        </Button>
        {isSuperAdmin && !voided && (
          <Button size="sm" variant="ghost" onClick={onVoid}>
            <Ban className="h-3.5 w-3.5 mr-1 text-destructive" />Void
          </Button>
        )}
      </div>
    </div>
  );
}

// ---------------- Record Payment Dialog ----------------

function RecordPaymentDialog({ open, onOpenChange, salesOrderId, defaultAmount, onSuccess }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  salesOrderId: string;
  defaultAmount: number;
  onSuccess?: (paymentId: string) => void;
}) {
  const { toast } = useToast();
  const { data: accounts = [] } = usePaymentAccounts(true);
  const recordMut = useRecordPayment();

  const [amount, setAmount] = useState(defaultAmount);
  const [mode, setMode] = useState<PaymentMode>('cash');
  const [accountId, setAccountId] = useState<string>('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  // Filter accounts to match selected mode
  const filteredAccounts = useMemo(() => {
    const wantType = mode === 'cash' ? 'cash' : 'bank';
    return accounts.filter((a) => a.account_type === wantType);
  }, [accounts, mode]);

  // Reset when opening / mode change
  useMemo(() => {
    if (open) {
      setAmount(defaultAmount);
      setMode('cash');
      setReference('');
      setNotes('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useMemo(() => {
    // Auto-select first matching account when mode changes
    const first = filteredAccounts[0];
    if (first && !filteredAccounts.find((a) => a.id === accountId)) {
      setAccountId(first.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, filteredAccounts.length]);

  const refLabel = MODES.find((m) => m.value === mode)?.refLabel ?? 'Reference';

  const submit = async () => {
    if (!amount || amount <= 0) {
      toast({ title: 'Enter a valid amount', variant: 'destructive' });
      return;
    }
    if (!accountId) {
      toast({ title: 'Select a payment account', variant: 'destructive' });
      return;
    }
    try {
      const p = await recordMut.mutateAsync({
        salesOrderId,
        amount,
        paymentMode: mode,
        paymentAccountId: accountId,
        referenceNumber: reference || null,
        notes: notes || null,
      });
      onOpenChange(false);
      onSuccess?.(p.id);
    } catch (e: any) {
      toast({ title: 'Failed to record payment', description: e?.message ?? String(e), variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>Date and PR number are stamped automatically.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Amount (₹) *</Label>
            <Input
              type="number" min={0} step="0.01" value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1">
            <Label>Payment Mode *</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as PaymentMode)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MODES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Payment Account *</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
              <SelectContent>
                {filteredAccounts.length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">No {mode === 'cash' ? 'cash' : 'bank'} accounts configured</div>
                )}
                {filteredAccounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.account_name}
                    {a.account_number_last4 ? ` · ****${a.account_number_last4}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>{refLabel}</Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="" />
          </div>
          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={recordMut.isPending}>Cancel</Button>
          <Button onClick={submit} disabled={recordMut.isPending}>
            {recordMut.isPending ? 'Recording…' : 'Confirm Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VoidPaymentDialog({ target, onClose }: {
  target: SalesOrderPayment | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const voidMut = useVoidPayment();
  const [reason, setReason] = useState('');

  useMemo(() => { if (target) setReason(''); }, [target]);

  const submit = async () => {
    if (!target) return;
    if (reason.trim().length < 3) {
      toast({ title: 'Reason required (min 3 chars)', variant: 'destructive' });
      return;
    }
    try {
      await voidMut.mutateAsync({ paymentId: target.id, reason });
      toast({ title: 'Payment voided' });
      onClose();
    } catch (e: any) {
      toast({ title: 'Failed to void', description: e?.message ?? String(e), variant: 'destructive' });
    }
  };

  return (
    <Dialog open={!!target} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Void Payment</DialogTitle>
          <DialogDescription>
            {target ? `${target.payment_number} — ${fmtINR(target.amount)}` : ''}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          <Label>Reason *</Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={voidMut.isPending}>Cancel</Button>
          <Button variant="destructive" onClick={submit} disabled={voidMut.isPending}>
            {voidMut.isPending ? 'Voiding…' : 'Void Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
// ---------------- Redeem Credit Note Dialog ----------------

function RedeemCreditNoteDialog({ open, onOpenChange, salesOrderId, balance }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  salesOrderId: string;
  balance: number;
}) {
  const { toast } = useToast();
  const redeemMut = useRedeemCreditNote();

  const { data: so } = useQuery({
    queryKey: ['so-customer', salesOrderId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('sales_orders').select('customer_id').eq('id', salesOrderId).maybeSingle();
      if (error) throw error;
      return data as { customer_id: string | null } | null;
    },
    enabled: open,
  });

  const { data: cns = [] } = useCustomerActiveCreditNotes(so?.customer_id);

  const [selectedCn, setSelectedCn] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);

  const selected = cns.find((c) => c.id === selectedCn);
  const maxApply = Math.min(selected?.amount_remaining ?? 0, balance);

  useMemo(() => {
    if (open) { setSelectedCn(''); setAmount(0); }
  }, [open]);
  useMemo(() => {
    if (selected) setAmount(Math.min(selected.amount_remaining, balance));
  }, [selectedCn]);

  const submit = async () => {
    if (!selectedCn) {
      toast({ title: 'Select a credit note', variant: 'destructive' }); return;
    }
    if (!amount || amount <= 0 || amount > maxApply) {
      toast({ title: `Amount must be between 0 and ${fmtINR(maxApply)}`, variant: 'destructive' }); return;
    }
    try {
      await redeemMut.mutateAsync({ cnId: selectedCn, salesOrderId, amount });
      toast({ title: 'Credit note applied' });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Failed to apply credit note', description: e?.message ?? String(e), variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Use Credit Note</DialogTitle>
          <DialogDescription>
            Outstanding balance: {fmtINR(balance)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {cns.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center border border-dashed rounded">
              No active credit notes for this customer.
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <Label>Credit Note *</Label>
                <Select value={selectedCn} onValueChange={setSelectedCn}>
                  <SelectTrigger><SelectValue placeholder="Select credit note" /></SelectTrigger>
                  <SelectContent>
                    {cns.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.cn_number} · {fmtINR(c.amount_remaining)} remaining · expires {format(parseISO(c.expiry_date), 'MMM d, yyyy')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Amount to Apply (₹) *</Label>
                <Input
                  type="number" min={0} max={maxApply} step="0.01" value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                />
                <div className="text-xs text-muted-foreground">Max: {fmtINR(maxApply)}</div>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={redeemMut.isPending}>Cancel</Button>
          <Button onClick={submit} disabled={redeemMut.isPending || cns.length === 0}>
            {redeemMut.isPending ? 'Applying…' : 'Apply Credit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
