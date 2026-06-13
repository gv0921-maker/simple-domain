import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { RETURNS_NAV } from '@/lib/navigation/returns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { useReturnRequests } from '@/hooks/returns';
import { RT_STATUS_LABEL, type ReturnStatus } from '@/lib/services/returns';

const STATUS_COLORS: Record<ReturnStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  pending_approval: 'bg-orange-100 text-orange-900',
  approved: 'bg-blue-100 text-blue-900',
  rejected: 'bg-destructive text-destructive-foreground',
  awaiting_receipt: 'bg-amber-100 text-amber-900',
  received: 'bg-blue-100 text-blue-900',
  resolved: 'bg-success text-success-foreground',
  closed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-muted text-muted-foreground',
};

export default function ReturnsList() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<ReturnStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const { data: rows = [], isLoading } = useReturnRequests({ status });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) =>
      r.rt_number.toLowerCase().includes(term)
      || (r.customer_name_snapshot ?? '').toLowerCase().includes(term)
      || (r.source_invoice?.reference ?? '').toLowerCase().includes(term)
    );
  }, [rows, search]);

  const counts = useMemo(() => {
    const now = new Date();
    return {
      pending: rows.filter((r) => r.request_status === 'pending_approval').length,
      awaiting: rows.filter((r) => r.request_status === 'awaiting_receipt').length,
      qc: rows.filter((r) => r.request_status === 'received').length,
      resolvedMonth: rows.filter((r) =>
        r.request_status === 'resolved'
        && parseISO(r.requested_at).getMonth() === now.getMonth()
        && parseISO(r.requested_at).getFullYear() === now.getFullYear()
      ).length,
      rejected: rows.filter((r) => r.request_status === 'rejected').length,
    };
  }, [rows]);

  const stats = [
    { label: 'Pending Approval', value: counts.pending, color: 'text-orange-600' },
    { label: 'Awaiting Receipt', value: counts.awaiting, color: 'text-amber-600' },
    { label: 'In QC', value: counts.qc, color: 'text-blue-600' },
    { label: 'Resolved this Month', value: counts.resolvedMonth, color: 'text-emerald-600' },
    { label: 'Rejected', value: counts.rejected, color: 'text-destructive' },
  ];

  return (
    <AppLayout title="Returns" moduleNav={RETURNS_NAV}>
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Return Requests</h1>
          <Button onClick={() => navigate('/returns/new')}>
            <Plus className="h-4 w-4 mr-2" /> New Return
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className={`text-2xl font-semibold ${s.color}`}>{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <Input
                placeholder="Search RT / customer / invoice…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-xs"
              />
              <Select value={status} onValueChange={(v) => setStatus(v as ReturnStatus | 'all')}>
                <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {Object.entries(RT_STATUS_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="py-10 text-center text-muted-foreground">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">No return requests found.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>RT Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Source Invoice</TableHead>
                      <TableHead className="text-right">Items</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead className="text-right">Age (days)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r) => (
                      <TableRow
                        key={r.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/returns/${r.id}`)}
                      >
                        <TableCell className="font-medium">{r.rt_number}</TableCell>
                        <TableCell>{r.customer_name_snapshot ?? '—'}</TableCell>
                        <TableCell>{r.source_invoice?.reference ?? '—'}</TableCell>
                        <TableCell className="text-right">{r.items?.length ?? 0}</TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[r.request_status]}>
                            {RT_STATUS_LABEL[r.request_status]}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(parseISO(r.requested_at), 'd MMM yyyy')}</TableCell>
                        <TableCell className="text-right">
                          {differenceInDays(new Date(), parseISO(r.requested_at))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}