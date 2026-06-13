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
import { format, parseISO } from 'date-fns';
import { VENDOR_ORDERS_NAV } from '@/lib/navigation/vendorOrders';
import { useVendorOrders } from '@/hooks/vendor-orders';
import { useVendors } from '@/hooks/vendors';
import { VO_STATUS_LABEL, type VOStatus, type VOMode } from '@/lib/services/vendor-orders';

const STATUS_STYLES: Record<VOStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  pending_approval: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-blue-50 text-blue-700 border-blue-200',
  placed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  partial: 'bg-purple-50 text-purple-700 border-purple-200',
  received: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/30',
};

export default function VendorOrdersList() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<VOStatus | 'all'>('all');
  const [mode, setMode] = useState<VOMode | 'all'>('all');
  const [vendorId, setVendorId] = useState<string>('all');
  const [search, setSearch] = useState('');

  const { data: rows = [] } = useVendorOrders({
    status,
    mode,
    vendor_id: vendorId === 'all' ? undefined : vendorId,
  });
  const { data: vendors = [] } = useVendors(true);

  const filtered = useMemo(
    () => rows.filter(r => !search || r.vo_number.toLowerCase().includes(search.toLowerCase())),
    [rows, search],
  );

  const stats = useMemo(() => {
    const pending = rows.filter(r => r.status === 'pending_approval').length;
    const open = rows.filter(r => ['approved', 'placed', 'partial'].includes(r.status)).length;
    const received = rows.filter(r => r.status === 'received').length;
    return { pending, open, received };
  }, [rows]);

  return (
    <AppLayout title="Vendor Orders" moduleNav={VENDOR_ORDERS_NAV}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div />
          <Button onClick={() => navigate('/vendor-orders/new')}>
            <Plus className="h-4 w-4 mr-2" /> New Vendor Order
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card><CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase">Pending Approval</div>
            <div className="text-2xl font-semibold mt-1">{stats.pending}</div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase">Open Orders</div>
            <div className="text-2xl font-semibold mt-1">{stats.open}</div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase">Received</div>
            <div className="text-2xl font-semibold mt-1">{stats.received}</div>
          </CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-wrap gap-3">
              <Input
                placeholder="Search VO number"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-xs"
              />
              <Select value={status} onValueChange={(v) => setStatus(v as VOStatus | 'all')}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {(Object.keys(VO_STATUS_LABEL) as VOStatus[]).map(s => (
                    <SelectItem key={s} value={s}>{VO_STATUS_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={mode} onValueChange={(v) => setMode(v as VOMode | 'all')}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All modes</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="bulk">Bulk</SelectItem>
                </SelectContent>
              </Select>
              <Select value={vendorId} onValueChange={setVendorId}>
                <SelectTrigger className="w-56"><SelectValue placeholder="Vendor" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All vendors</SelectItem>
                  {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>VO Number</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Linked SO</TableHead>
                  <TableHead>ETA</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No vendor orders</TableCell></TableRow>
                )}
                {filtered.map(r => (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => navigate(`/vendor-orders/${r.id}`)}>
                    <TableCell className="font-mono">{r.vo_number}</TableCell>
                    <TableCell>{r.vendor?.name ?? '—'}</TableCell>
                    <TableCell className="capitalize">{r.order_mode}</TableCell>
                    <TableCell className="text-xs font-mono">{r.linked_sales_order?.reference ?? ''}</TableCell>
                    <TableCell className="text-sm">{r.eta_date}</TableCell>
                    <TableCell><Badge variant="outline" className={STATUS_STYLES[r.status]}>{VO_STATUS_LABEL[r.status]}</Badge></TableCell>
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