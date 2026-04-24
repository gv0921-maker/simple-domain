import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { INVOICING_NAV } from '@/lib/navigation/invoicing';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getPayments } from '@/lib/services/accounting';
import { Search, Wallet } from 'lucide-react';

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  posted: 'outline',
  reconciled: 'default',
};

export default function PaymentsList() {
  const [payments] = useState(getPayments());
  const [search, setSearch] = useState('');

  const filtered = payments.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.partnerName.toLowerCase().includes(search.toLowerCase())
  );

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
                  <TableHead>Payment</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{p.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{p.partnerName}</TableCell>
                      <TableCell>{p.date}</TableCell>
                      <TableCell className="capitalize">{p.type}</TableCell>
                      <TableCell className="capitalize">{p.method.replace('_', ' ')}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(p.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={statusColors[p.status]}>{p.status}</Badge>
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