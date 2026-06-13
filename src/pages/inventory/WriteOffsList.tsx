import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus } from 'lucide-react';
import { INVENTORY_NAV } from '@/lib/navigation';
import { useWriteOffs, useCreateWriteOffDraft } from '@/hooks/inventory/writeOffs';
import type { WriteOffStatus, WriteOffType } from '@/lib/services/inventory/writeOffs';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, subMonths } from 'date-fns';

const TYPE_OPTIONS: Array<{ value: WriteOffType | 'all'; label: string }> = [
  { value: 'all', label: 'All types' },
  { value: 'damage', label: 'Damage' },
  { value: 'loss', label: 'Loss' },
  { value: 'theft', label: 'Theft' },
  { value: 'obsolete', label: 'Obsolete' },
  { value: 'scrap', label: 'Scrap' },
  { value: 'count_missing', label: 'Missing in Count' },
  { value: 'qc_unsalvageable', label: 'QC Unsalvageable' },
  { value: 'other', label: 'Other' },
];

const STATUS_STYLES: Record<WriteOffStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  approved: 'bg-success/20 text-success border-success',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/30',
};

export default function WriteOffsList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<WriteOffStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<WriteOffType | 'all'>('all');
  const [search, setSearch] = useState('');

  const { data: rows = [] } = useWriteOffs({
    status: statusFilter,
    writeOffType: typeFilter === 'all' ? undefined : typeFilter,
  });
  const createMut = useCreateWriteOffDraft();

  const filtered = useMemo(() =>
    rows.filter(r => !search || r.wf_number.toLowerCase().includes(search.toLowerCase()))
  , [rows, search]);

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const twelveMonthsAgo = subMonths(now, 12);

  const stats = useMemo(() => {
    const pending = rows.filter(r => r.status === 'draft').length;
    const approvedThisMonth = rows.filter(r =>
      r.status === 'approved' && r.approved_at && parseISO(r.approved_at) >= thisMonthStart).length;
    const valueLast12 = rows
      .filter(r => r.status === 'approved' && r.approved_at && parseISO(r.approved_at) >= twelveMonthsAgo)
      .reduce((s, r) => s + Number(r.total_value || 0), 0);
    return { pending, approvedThisMonth, valueLast12 };
  }, [rows]);

  const handleNew = async () => {
    try {
      const id = await createMut.mutateAsync({ writeOffType: 'damage', sourceType: 'manual' });
      navigate(`/inventory/write-offs/${id}`);
    } catch (e: any) {
      toast({ title: 'Could not create draft', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <AppLayout title="Inventory" moduleNav={INVENTORY_NAV}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Button onClick={handleNew}><Plus className="h-4 w-4 mr-2" />New Write-off</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card><CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase">Pending Approval</div>
            <div className="text-2xl font-semibold mt-1">{stats.pending}</div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase">Approved This Month</div>
            <div className="text-2xl font-semibold mt-1">{stats.approvedThisMonth}</div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase">Value Written-off (12 mo)</div>
            <div className="text-2xl font-semibold mt-1">₹ {stats.valueLast12.toLocaleString('en-IN')}</div>
          </CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-wrap gap-3">
              <Input
                placeholder="Search WF number"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-xs"
              />
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>WF Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No write-offs</TableCell></TableRow>
                )}
                {filtered.map(r => (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => navigate(`/inventory/write-offs/${r.id}`)}>
                    <TableCell className="font-mono">{r.wf_number}</TableCell>
                    <TableCell className="capitalize">{r.write_off_type.replace(/_/g, ' ')}</TableCell>
                    <TableCell><Badge variant="outline" className={STATUS_STYLES[r.status]}>{r.status}</Badge></TableCell>
                    <TableCell className="text-right">₹ {Number(r.total_value || 0).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{format(parseISO(r.created_at), 'dd MMM yyyy')}</TableCell>
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
