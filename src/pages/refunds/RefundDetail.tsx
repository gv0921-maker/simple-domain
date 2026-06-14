import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { REFUNDS_NAV } from '@/lib/navigation/refunds';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useRefund } from '@/hooks/refunds';
import { REFUND_MODE_LABEL } from '@/lib/services/refunds';
import { ActivityChatter } from '@/components/shared/ActivityChatter';

const fmtINR = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function RefundDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: r, isLoading } = useRefund(id);

  if (isLoading || !r) {
    return <AppLayout title="Refund" moduleNav={REFUNDS_NAV}><div className="p-6">{isLoading ? 'Loading…' : 'Not found'}</div></AppLayout>;
  }

  return (
    <AppLayout title="Refund" subtitle={r.refund_number} moduleNav={REFUNDS_NAV}>
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/refunds')}><ArrowLeft className="h-4 w-4" /></Button>
            <div>
              <h1 className="text-2xl font-semibold">{r.refund_number}</h1>
              <div className="text-sm text-muted-foreground">{r.customer_name_snapshot ?? r.customer?.name ?? '—'}</div>
            </div>
          </div>
          <Button variant="outline" onClick={() => window.open(`/print/refund_voucher/${r.id}`, '_blank')}>
            <Printer className="h-4 w-4 mr-2" />Print
          </Button>
        </div>

        <Card><CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Stat label="Amount" value={fmtINR(r.amount)} />
          <Stat label="Mode"><Badge variant="outline">{REFUND_MODE_LABEL[r.refund_mode]}</Badge></Stat>
          <Stat label="Account" value={r.payment_account?.account_name ?? '—'} />
          <Stat label="Date" value={format(parseISO(r.refund_date), "d MMM yyyy 'at' HH:mm")} />
        </CardContent></Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Source</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            {r.source_return?.rt_number && (
              <button className="underline mr-3" onClick={() => navigate(`/returns/${r.source_return_request_id}`)}>
                Return {r.source_return.rt_number}
              </button>
            )}
            {r.source_invoice?.reference && (
              <button className="underline" onClick={() => navigate(`/invoicing/bills/${r.source_invoice_id}`)}>
                Invoice {r.source_invoice.reference}
              </button>
            )}
            {r.reference_number && <div>Reference: {r.reference_number}</div>}
            {r.notes && <div className="text-muted-foreground mt-2">{r.notes}</div>}
          </CardContent>
        </Card>

        <ActivityChatter recordType="refund" recordId={r.id} />
      </div>
    </AppLayout>
  );
}

function Stat({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (<div><div className="text-xs text-muted-foreground">{label}</div><div className="font-semibold">{children ?? value}</div></div>);
}
