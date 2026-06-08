import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { SETTINGS_NAV } from '@/lib/navigation/settings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { isSuperAdminUser } from '@/lib/data/rbac';
import {
  usePendingPriceApprovals,
  useSetInvoicePriceApproval,
  useUpdateInvoiceLineApproval,
} from '@/hooks/invoicing';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);

export default function PriceApprovalsPage() {
  const { user } = useAuth();
  const isSuper = user ? isSuperAdminUser(user.id) : false;

  const { data: invoices = [], isLoading } = usePendingPriceApprovals();
  const setStatus = useSetInvoicePriceApproval();
  const updateLine = useUpdateInvoiceLineApproval();

  const [notes, setNotes] = useState<Record<string, string>>({});
  const [prices, setPrices] = useState<Record<string, string>>({});

  if (!isSuper) {
    return <Navigate to="/" replace />;
  }

  const handleApprove = async (invoiceId: string, lines: any[]) => {
    try {
      for (const l of lines) {
        const priceStr = prices[l.id];
        const approved = priceStr !== undefined && priceStr !== '' ? Number(priceStr) : Number(l.unit_price);
        await updateLine.mutateAsync({
          lineId: l.id,
          approved_price: approved,
          approval_notes: notes[l.id] ?? null,
        });
      }
      await setStatus.mutateAsync({ invoiceId, status: 'approved' });
      toast.success('Prices approved');
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to approve');
    }
  };

  const handleReject = async (invoiceId: string, lines: any[]) => {
    try {
      for (const l of lines) {
        if (notes[l.id]) {
          await updateLine.mutateAsync({
            lineId: l.id,
            approved_price: null,
            approval_notes: notes[l.id],
          });
        }
      }
      await setStatus.mutateAsync({ invoiceId, status: 'rejected' });
      toast.success('Prices rejected');
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to reject');
    }
  };

  return (
    <AppLayout title="Settings" moduleNav={SETTINGS_NAV}>
      <div className="p-6 max-w-5xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Price Approvals</h1>
          <Badge variant="outline">{invoices.length} pending</Badge>
        </div>
        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : invoices.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No invoices awaiting price approval.
            </CardContent>
          </Card>
        ) : (
          invoices.map((inv) => (
            <Card key={inv.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    {inv.reference}{' '}
                    <Badge variant="secondary" className="ml-2 capitalize">
                      {inv.type}
                    </Badge>
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {inv.issue_date} · Total {fmt(Number(inv.total))}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Requested Price</TableHead>
                      <TableHead className="text-right">Approved Price</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(inv.invoice_lines ?? []).map((l) => (
                      <TableRow key={l.id}>
                        <TableCell>{l.description}</TableCell>
                        <TableCell className="text-right">{Number(l.quantity)}</TableCell>
                        <TableCell className="text-right">{fmt(Number(l.unit_price))}</TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            className="w-32 ml-auto"
                            placeholder={String(Number(l.unit_price))}
                            value={prices[l.id] ?? ''}
                            onChange={(e) =>
                              setPrices((p) => ({ ...p, [l.id]: e.target.value }))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Textarea
                            className="min-h-[40px]"
                            value={notes[l.id] ?? ''}
                            onChange={(e) =>
                              setNotes((n) => ({ ...n, [l.id]: e.target.value }))
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleReject(inv.id, inv.invoice_lines ?? [])}
                  >
                    <XCircle className="h-4 w-4 mr-1" /> Reject
                  </Button>
                  <Button onClick={() => handleApprove(inv.id, inv.invoice_lines ?? [])}>
                    <CheckCircle className="h-4 w-4 mr-1" /> Approve
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AppLayout>
  );
}