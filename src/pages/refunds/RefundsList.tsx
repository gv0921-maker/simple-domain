import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { REFUNDS_NAV } from '@/lib/navigation/refunds';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useRefunds } from '@/hooks/refunds';
import { REFUND_MODE_LABEL, type RefundMode } from '@/lib/services/refunds';
import { format, parseISO, startOfMonth } from 'date-fns';

const fmtINR = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function RefundsList() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<RefundMode | 'all'>('all');
  const [search, setSearch] = useState('');
  const { data: rows = [], isLoading } = useRefunds({ mode });

  const filtered = rows.filter((r) =>
    !search.trim() ||
    r.refund_number.toLowerCase().includes(search.toLowerCase()) ||
    (r.customer_name_snapshot ?? r.customer?.name ?? '').toLowerCase().includes(search.toLowerCase()));

  const thisMonth = rows.filter((r) => parseISO(r.refund_date) >= startOfMonth(new Date()));
  const monthTotal = thisMonth.reduce((s, r) => s + Number(r.amount), 0);

  return (
    <AppLayout title="Refunds" moduleNav={REFUNDS_NAV}>
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="This Month" value={String(thisMonth.length)} />
          <Stat label="Amount Refunded (Month)" value={fmtINR(monthTotal)} />
          <Stat label="Total Refunds" value={String(rows.length)} />
          <Stat label="Total Amount" value={fmtINR(rows.reduce((s, r) => s + Number(r.amount), 0))} />
        </div>

        <div className="flex flex-wrap gap-2 items-end">
          <Input className="max-w-xs" placeholder="Search RF / customer…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={mode} onValueChange={(v) => setMode(v as any)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modes</SelectItem>
              {(Object.keys(REFUND_MODE_LABEL) as RefundMode[]).map((m) =>
                <SelectItem key={m} value={m}>{REFUND_MODE_LABEL[m]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RF Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableRow><TableCell colSpan={6}>Loading…</TableCell></TableRow>}
                {!isLoading && filtered.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No refunds.</TableCell></TableRow>
                )}
                {filtered.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => navigate(`/refunds/${r.id}`)}>
                    <TableCell className="font-mono">{r.refund_number}</TableCell>
                    <TableCell>{r.customer_name_snapshot ?? r.customer?.name ?? '—'}</TableCell>
                    <TableCell className="text-right">{fmtINR(r.amount)}</TableCell>
                    <TableCell><Badge variant="outline">{REFUND_MODE_LABEL[r.refund_mode]}</Badge></TableCell>
                    <TableCell>{r.payment_account?.account_name ?? '—'}</TableCell>
                    <TableCell>{format(parseISO(r.refund_date), "d MMM yyyy")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (<Card><CardContent className="p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="text-xl font-semibold">{value}</div></CardContent></Card>);
}
