import { useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { INVOICING_NAV } from '@/lib/navigation/invoicing';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePayments } from '@/hooks/invoicing';
import { useCustomers } from '@/hooks/sales';
import { Search, Wallet } from 'lucide-react';

export default function PaymentsList() {
  const { data: payments = [] } = usePayments();
  const { data: customers = [] } = useCustomers();
  const [search, setSearch] = useState('');

  const customerMap = useMemo(
    () => Object.fromEntries(customers.map((c) => [c.id, c.name])),
    [customers],
  );

  const filtered = payments.filter((p) => {
    const ref = (p.reference ?? '').toLowerCase();
    const partner = (p.customer_id && customerMap[p.customer_id]) || '';
    const q = search.toLowerCase();
    return ref.includes(q) || partner.toLowerCase().includes(q);
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

  return (
    <AppLayout title="Invoices" moduleNav={INVOICING_NAV}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Payments</h1>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search payments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Linked Invoice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{p.reference ?? p.id.slice(0, 8)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{(p.customer_id && customerMap[p.customer_id]) || '—'}</TableCell>
                      <TableCell>{p.payment_date}</TableCell>
                      <TableCell className="capitalize">{p.method.replace('_', ' ')}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(Number(p.amount))}</TableCell>
                      <TableCell>
                        {p.invoice_id ? <Badge variant="outline">{p.invoice_id.slice(0, 8)}</Badge> : '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}