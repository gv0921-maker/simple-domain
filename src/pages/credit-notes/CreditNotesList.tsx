import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { CREDIT_NOTES_NAV } from '@/lib/navigation/creditNotes';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useCreditNotes } from '@/hooks/credit-notes';
import { CN_STATUS_LABEL, type CreditNoteStatus } from '@/lib/services/creditNotes';
import { format, parseISO, differenceInDays } from 'date-fns';

const fmtINR = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function CreditNotesList() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const expiringFilter = params.get('expiring');
  const [status, setStatus] = useState<CreditNoteStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const { data: rows = [], isLoading } = useCreditNotes({
    status,
    expiring_within_days: expiringFilter ? Number(expiringFilter) : undefined,
  });

  const filtered = rows.filter((r) =>
    !search.trim() ||
    r.cn_number.toLowerCase().includes(search.toLowerCase()) ||
    (r.customer_name_snapshot ?? r.customer?.name ?? '').toLowerCase().includes(search.toLowerCase()));

  const active = rows.filter((r) => r.status === 'active' || r.status === 'partially_used');
  const totalOutstanding = active.reduce((s, r) => s + Number(r.amount_remaining), 0);
  const expiringSoon = active.filter((r) => differenceInDays(parseISO(r.expiry_date), new Date()) <= 30);

  return (
    <AppLayout title="Credit Notes" moduleNav={CREDIT_NOTES_NAV}>
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Active" value={String(active.length)} />
          <Stat label="Expiring (30 days)" value={String(expiringSoon.length)} accent="text-amber-600" />
          <Stat label="Outstanding Value" value={fmtINR(totalOutstanding)} />
          <Stat label="Voided" value={String(rows.filter((r) => r.status === 'voided').length)} />
        </div>

        {expiringSoon.length > 0 && !expiringFilter && (
          <Card className="border-amber-300 bg-amber-50">
            <CardContent className="p-3 text-sm">
              ⚠ {expiringSoon.length} credit note(s) expiring within 30 days.
              <button className="underline ml-2" onClick={() => navigate('/credit-notes?expiring=30')}>View</button>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap gap-2 items-end">
          <Input className="max-w-xs" placeholder="Search CN / customer…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={status} onValueChange={(v) => setStatus(v as any)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {(Object.keys(CN_STATUS_LABEL) as CreditNoteStatus[]).map((s) =>
                <SelectItem key={s} value={s}>{CN_STATUS_LABEL[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CN Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableRow><TableCell colSpan={7}>Loading…</TableCell></TableRow>}
                {!isLoading && filtered.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">No credit notes.</TableCell></TableRow>
                )}
                {filtered.map((cn) => {
                  const days = differenceInDays(parseISO(cn.expiry_date), new Date());
                  const expiringBadge = days <= 30 && days >= 0 && (cn.status === 'active' || cn.status === 'partially_used');
                  return (
                    <TableRow key={cn.id} className="cursor-pointer" onClick={() => navigate(`/credit-notes/${cn.id}`)}>
                      <TableCell className="font-mono">{cn.cn_number}</TableCell>
                      <TableCell>{cn.customer_name_snapshot ?? cn.customer?.name ?? '—'}</TableCell>
                      <TableCell className="text-right">{fmtINR(cn.amount)}</TableCell>
                      <TableCell className="text-right">{fmtINR(cn.amount_remaining)}</TableCell>
                      <TableCell>{format(parseISO(cn.issue_date), 'd MMM yyyy')}</TableCell>
                      <TableCell>
                        {format(parseISO(cn.expiry_date), 'd MMM yyyy')}
                        {expiringBadge && <Badge variant="outline" className="ml-2 text-amber-700 border-amber-400">{days}d</Badge>}
                      </TableCell>
                      <TableCell><Badge variant="outline">{CN_STATUS_LABEL[cn.status]}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <Card><CardContent className="p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-xl font-semibold ${accent ?? ''}`}>{value}</div>
    </CardContent></Card>
  );
}
