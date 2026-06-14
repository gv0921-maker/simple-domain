import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { CREDIT_NOTES_NAV } from '@/lib/navigation/creditNotes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Printer, Ban } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { useCreditNote, useVoidCreditNote } from '@/hooks/credit-notes';
import { CN_STATUS_LABEL } from '@/lib/services/creditNotes';
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';
import { ActivityChatter } from '@/components/shared/ActivityChatter';

const fmtINR = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function CreditNoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useCreditNote(id);
  const { isAdmin } = useIsSuperAdmin();
  const voidMut = useVoidCreditNote();
  const [voidOpen, setVoidOpen] = useState(false);
  const [reason, setReason] = useState('');

  if (isLoading || !data?.cn) {
    return <AppLayout title="Credit Note" moduleNav={CREDIT_NOTES_NAV}><div className="p-6">{isLoading ? 'Loading…' : 'Not found'}</div></AppLayout>;
  }
  const cn = data.cn;
  const days = differenceInDays(parseISO(cn.expiry_date), new Date());

  return (
    <AppLayout title="Credit Note" subtitle={cn.cn_number} moduleNav={CREDIT_NOTES_NAV}>
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/credit-notes')}><ArrowLeft className="h-4 w-4" /></Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold">{cn.cn_number}</h1>
                <Badge variant="outline">{CN_STATUS_LABEL[cn.status]}</Badge>
                {(cn.status === 'active' || cn.status === 'partially_used') && days >= 0 && (
                  <Badge variant="outline" className={days <= 30 ? 'text-amber-700 border-amber-400' : ''}>Expires in {days}d</Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">{cn.customer_name_snapshot ?? cn.customer?.name ?? '—'}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.open(`/print/credit_note/${cn.id}`, '_blank')}>
              <Printer className="h-4 w-4 mr-2" />Print
            </Button>
            {isAdmin && cn.status !== 'voided' && cn.status !== 'fully_used' && (
              <Button variant="outline" className="border-destructive text-destructive" onClick={() => setVoidOpen(true)}>
                <Ban className="h-4 w-4 mr-2" />Void
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Stat label="Amount" value={fmtINR(cn.amount)} />
            <Stat label="Used" value={fmtINR(cn.amount_used)} />
            <Stat label="Remaining" value={fmtINR(cn.amount_remaining)} />
            <Stat label="Issued" value={format(parseISO(cn.issue_date), 'd MMM yyyy')} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Source</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            {cn.source_return?.rt_number && (
              <button className="underline mr-3" onClick={() => navigate(`/returns/${cn.source_return_request_id}`)}>
                Return {cn.source_return.rt_number}
              </button>
            )}
            {cn.source_invoice?.reference && (
              <button className="underline" onClick={() => navigate(`/invoicing/bills/${cn.source_invoice_id}`)}>
                Invoice {cn.source_invoice.reference}
              </button>
            )}
            {cn.notes && <div className="text-muted-foreground mt-2">{cn.notes}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Redemption History</CardTitle></CardHeader>
          <CardContent className="text-sm">
            {data.redemptions.length === 0 && <div className="text-muted-foreground">No redemptions yet.</div>}
            {data.redemptions.map((r) => (
              <div key={r.id} className="flex justify-between border-b py-2">
                <div>
                  {r.invoice?.reference && <span>Invoice {r.invoice.reference}</span>}
                  {r.sales_order?.reference && <span>Sales Order {r.sales_order.reference}</span>}
                  <div className="text-xs text-muted-foreground">{format(parseISO(r.applied_at), "d MMM yyyy 'at' HH:mm")}</div>
                </div>
                <div className="font-semibold">{fmtINR(r.amount_applied)}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        {cn.status === 'voided' && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="p-3 text-sm">
              <div className="font-medium text-destructive">Voided</div>
              <div>{cn.void_reason}</div>
            </CardContent>
          </Card>
        )}

        <ActivityChatter recordType="credit_note" recordId={cn.id} />
      </div>

      <Dialog open={voidOpen} onOpenChange={setVoidOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Void Credit Note</DialogTitle></DialogHeader>
          <Label>Reason *</Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoidOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!reason.trim() || voidMut.isPending}
              onClick={() => voidMut.mutate({ cnId: cn.id, reason: reason.trim() }, {
                onSuccess: () => { toast.success('Voided'); setVoidOpen(false); setReason(''); },
                onError: (e: any) => toast.error(e?.message ?? 'Failed'),
              })}
            >Void</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (<div><div className="text-xs text-muted-foreground">{label}</div><div className="font-semibold">{value}</div></div>);
}
