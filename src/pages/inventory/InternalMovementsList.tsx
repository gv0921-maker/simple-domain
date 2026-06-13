import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus } from 'lucide-react';
import { INVENTORY_NAV } from '@/lib/navigation';
import { useInternalMovements } from '@/hooks/inventory/internalMovements';
import { MOVEMENT_TYPE_LABEL, type MovementType, type MovementStatus } from '@/lib/services/inventory/internalMovements';
import { format, parseISO, isToday } from 'date-fns';

const STATUS_STYLES: Record<MovementStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  in_progress: 'bg-warning/20 text-warning-foreground border-warning',
  completed: 'bg-success/20 text-success border-success',
  cancelled: 'bg-destructive/20 text-destructive border-destructive',
};

export default function InternalMovementsList() {
  const navigate = useNavigate();
  const [type, setType] = useState<MovementType | 'all'>('all');
  const [status, setStatus] = useState<MovementStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const { data: movements = [] } = useInternalMovements({ movementType: type, status });

  const filtered = useMemo(
    () => movements.filter((m) => m.movement_number.toLowerCase().includes(search.toLowerCase())),
    [movements, search],
  );

  const stats = useMemo(() => ({
    draft: movements.filter((m) => m.status === 'draft').length,
    inProgress: movements.filter((m) => m.status === 'in_progress').length,
    completedToday: movements.filter((m) => m.status === 'completed' && m.completed_at && isToday(parseISO(m.completed_at))).length,
    total: movements.length,
  }), [movements]);

  return (
    <AppLayout title="Inventory" moduleNav={INVENTORY_NAV}>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Draft</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.draft}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">In Progress</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-warning">{stats.inProgress}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Completed Today</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-success">{stats.completedToday}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={type} onValueChange={(v) => setType(v as MovementType | 'all')}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(MOVEMENT_TYPE_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => setStatus(v as MovementStatus | 'all')}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => navigate('/inventory/internal-movements/new')} className="gap-2">
            <Plus className="h-4 w-4" />New Movement
          </Button>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Movement #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>From → To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No internal movements</TableCell></TableRow>
              ) : filtered.map((m) => (
                <TableRow key={m.id} className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/inventory/internal-movements/${m.id}`)}>
                  <TableCell className="font-medium text-primary">{m.movement_number}</TableCell>
                  <TableCell><Badge variant="outline">{MOVEMENT_TYPE_LABEL[m.movement_type]}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground capitalize">
                    {m.from_location_type ?? '—'} → {m.to_location_type ?? '—'}
                  </TableCell>
                  <TableCell><Badge className={STATUS_STYLES[m.status]}>{m.status.replace('_', ' ')}</Badge></TableCell>
                  <TableCell className="text-sm">{format(parseISO(m.created_at), 'dd MMM yyyy, HH:mm')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AppLayout>
  );
}