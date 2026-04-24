import { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { getQuotation, saveQuotation } from '@/lib/services/sales/storage';
import { getItem } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

function validatePortalToken(token: string): string | null {
  const tokens = getItem<{ customerId: string; token: string }[]>('portal_tokens', []);
  return tokens.find(t => t.token === token)?.customerId || null;
}

export default function CustomerPortalQuotation() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = searchParams.get('token') || '';
  const customerId = validatePortalToken(token);
  const [quotation, setQuotation] = useState(() => id ? getQuotation(id) : undefined);

  if (!customerId || !quotation || quotation.customerId !== customerId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Quotation not found or access denied.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAccept = () => {
    const updated = saveQuotation({ ...quotation, status: 'accepted', acceptedAt: new Date().toISOString() });
    setQuotation(updated);
    toast({ title: 'Quotation accepted!' });
  };

  const handleReject = () => {
    const updated = saveQuotation({ ...quotation, status: 'cancelled' });
    setQuotation(updated);
    toast({ title: 'Quotation declined' });
  };

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/portal?token=${token}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{quotation.reference}</h1>
            <p className="text-sm text-muted-foreground">Quotation for {quotation.customerName}</p>
          </div>
          <Badge variant="outline" className="capitalize ml-auto">{quotation.status}</Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Date:</span> {quotation.quotationDate}</div>
            <div><span className="text-muted-foreground">Valid Until:</span> {quotation.validUntil}</div>
            <div><span className="text-muted-foreground">Payment Terms:</span> {quotation.paymentTerms || '—'}</div>
            <div><span className="text-muted-foreground">Currency:</span> {quotation.currency}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Line Items</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotation.lines.map(line => (
                  <TableRow key={line.id}>
                    <TableCell className="font-medium">{line.productName}</TableCell>
                    <TableCell className="text-right">{line.quantity}</TableCell>
                    <TableCell className="text-right">₹{line.unitPrice.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right font-semibold">₹{line.total.toLocaleString('en-IN')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Separator className="my-4" />
            <div className="space-y-2 text-sm ml-auto w-64">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{quotation.subtotal.toLocaleString('en-IN')}</span></div>
              {quotation.discountAmount > 0 && <div className="flex justify-between text-success"><span>Discount</span><span>-₹{quotation.discountAmount.toLocaleString('en-IN')}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>₹{quotation.taxAmount.toLocaleString('en-IN')}</span></div>
              <Separator />
              <div className="flex justify-between font-bold text-lg"><span>Total</span><span>₹{quotation.total.toLocaleString('en-IN')}</span></div>
            </div>
          </CardContent>
        </Card>

        {quotation.status === 'sent' && (
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleReject}>
              <XCircle className="h-4 w-4 mr-2" /> Decline
            </Button>
            <Button onClick={handleAccept}>
              <CheckCircle className="h-4 w-4 mr-2" /> Accept Quotation
            </Button>
          </div>
        )}

        {quotation.notes && (
          <Card>
            <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
            <CardContent><p className="text-sm whitespace-pre-wrap">{quotation.notes}</p></CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}