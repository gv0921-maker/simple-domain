import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { INVOICING_NAV } from '@/lib/navigation/invoicing';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ArrowLeft, CheckCircle2, ExternalLink } from 'lucide-react';
import { useInvoice } from '@/hooks/invoicing';
import { useDeliveryQC } from '@/hooks/qc';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { ShieldCheck } from 'lucide-react';

const fmtINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n || 0);

function useLinkedSalesOrder(orderId: string | null | undefined) {
  return useQuery({
    queryKey: ['invoice-detail', 'sales-order', orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const { data, error } = await supabase
        .from('sales_orders')
        .select('id,reference,paid_amount,payment_date,payment_method,payment_reference,billing_state')
        .eq('id', orderId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });
}

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: invoice, isLoading } = useInvoice(id);
  const { data: order } = useLinkedSalesOrder(invoice?.sales_order_id);
  const { data: deliveryQC } = useDeliveryQC(invoice?.sales_order_id ?? undefined);

  if (isLoading) {
    return (
      <AppLayout title="Invoices" moduleNav={INVOICING_NAV}>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!invoice) {
    return (
      <AppLayout title="Invoices" moduleNav={INVOICING_NAV}>
        <div className="p-6">Invoice not found.</div>
      </AppLayout>
    );
  }

  const lines = invoice.invoice_lines ?? [];
  const totalCGST = lines.reduce((s, l) => s + Number(l.cgst_amount ?? 0), 0);
  const totalSGST = lines.reduce((s, l) => s + Number(l.sgst_amount ?? 0), 0);
  const totalIGST = lines.reduce((s, l) => s + Number(l.igst_amount ?? 0), 0);
  const hasIGST = totalIGST > 0 && totalCGST === 0 && totalSGST === 0;

  return (
    <AppLayout title="Invoices" subtitle={invoice.reference} moduleNav={INVOICING_NAV}>
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/invoicing/bills')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold text-foreground">{invoice.reference}</h1>
                {invoice.status === 'paid' && (
                  <Badge className="bg-success text-success-foreground hover:bg-success">Paid</Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm">
                Issued {format(parseISO(invoice.issue_date), 'MMM d, yyyy')}
                {invoice.due_date && ` · Due ${format(parseISO(invoice.due_date), 'MMM d, yyyy')}`}
              </p>
            </div>
          </div>
          {invoice.sales_order_id && (
            <Button
              variant="outline"
              onClick={() => navigate(`/sales/orders/${invoice.sales_order_id}`)}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {order?.reference ? `Order ${order.reference}` : 'View Sales Order'}
            </Button>
          )}
        </div>

        {invoice.status === 'paid' && order && (
          <Card className="border-success/40 bg-success/5">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <div className="text-sm">
                <Badge className="bg-success text-success-foreground hover:bg-success mr-3">Paid</Badge>
                <span>
                  {fmtINR(Number(order.paid_amount ?? invoice.paid_amount ?? 0))}
                  {order.payment_date && ` on ${format(parseISO(order.payment_date), 'MMM d, yyyy')}`}
                  {order.payment_method && ` · ${order.payment_method.replace('_', ' ')}`}
                  {order.payment_reference && ` · Ref ${order.payment_reference}`}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {deliveryQC && (
          <Card className={deliveryQC.status === 'passed'
            ? 'border-success/40 bg-success/5'
            : 'border-destructive/40 bg-destructive/5'}>
            <CardContent className="p-4 flex items-center gap-3">
              <ShieldCheck className={`h-5 w-5 ${deliveryQC.status === 'passed' ? 'text-success' : 'text-destructive'}`} />
              <div className="flex-1 text-sm">
                <Badge
                  className={deliveryQC.status === 'passed'
                    ? 'bg-success text-success-foreground hover:bg-success mr-2'
                    : 'bg-destructive text-destructive-foreground hover:bg-destructive mr-2'}
                >
                  Pre-delivery QC {deliveryQC.status === 'passed' ? 'Passed' : 'Failed'}
                </Badge>
                <span className="text-foreground">
                  {deliveryQC.scannedSerials.length} item(s) scanned
                  {deliveryQC.verifiedAt && ` · ${format(parseISO(deliveryQC.verifiedAt), 'MMM d, yyyy HH:mm')}`}
                </span>
              </div>
              {deliveryQC.qcImages.length > 0 && (
                <div className="flex gap-1">
                  {deliveryQC.qcImages.slice(0, 4).map(url => (
                    <a key={url} href={url} target="_blank" rel="noreferrer" className="h-10 w-10 rounded border overflow-hidden block">
                      <img src={url} alt="QC" className="h-full w-full object-cover" />
                    </a>
                  ))}
                  {deliveryQC.qcImages.length > 4 && (
                    <span className="text-xs text-muted-foreground self-center ml-1">
                      +{deliveryQC.qcImages.length - 4}
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-base">Line Items</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  {hasIGST ? (
                    <TableHead className="text-right">IGST</TableHead>
                  ) : (
                    <>
                      <TableHead className="text-right">CGST</TableHead>
                      <TableHead className="text-right">SGST</TableHead>
                    </>
                  )}
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>{l.description}</TableCell>
                    <TableCell className="text-right">{Number(l.quantity)}</TableCell>
                    <TableCell className="text-right">{fmtINR(Number(l.unit_price))}</TableCell>
                    <TableCell className="text-right">{fmtINR(Number(l.subtotal))}</TableCell>
                    {hasIGST ? (
                      <TableCell className="text-right">{fmtINR(Number(l.igst_amount ?? 0))}</TableCell>
                    ) : (
                      <>
                        <TableCell className="text-right">{fmtINR(Number(l.cgst_amount ?? 0))}</TableCell>
                        <TableCell className="text-right">{fmtINR(Number(l.sgst_amount ?? 0))}</TableCell>
                      </>
                    )}
                    <TableCell className="text-right font-medium">
                      {fmtINR(Number(l.final_amount ?? l.subtotal))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="flex justify-end">
              <div className="w-full max-w-sm space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{fmtINR(Number(invoice.subtotal))}</span>
                </div>
                {Number(invoice.discount_amount) > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Discount</span>
                    <span>-{fmtINR(Number(invoice.discount_amount))}</span>
                  </div>
                )}
                {hasIGST ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IGST</span>
                    <span>{fmtINR(totalIGST)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CGST</span>
                      <span>{fmtINR(totalCGST)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SGST</span>
                      <span>{fmtINR(totalSGST)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total GST</span>
                  <span>{fmtINR(Number(invoice.tax_amount))}</span>
                </div>
                <div className="border-t pt-1 flex justify-between font-bold text-base">
                  <span>Grand Total</span>
                  <span className="text-primary">{fmtINR(Number(invoice.total))}</span>
                </div>
                <div className="flex justify-between text-success">
                  <span>Paid</span>
                  <span>{fmtINR(Number(invoice.paid_amount))}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}