import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ActivityChatter } from '@/components/shared/ActivityChatter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ScanLine, Printer, CheckCircle2, PlayCircle } from 'lucide-react';
import { INVENTORY_NAV } from '@/lib/navigation';
import {
  useStockCount, useStartCount, useCompleteCount, useReconcileCount,
  useMarkItemsMissing, useCountQueueId,
} from '@/hooks/inventory/stockCounts';
import {
  MONTH_LABELS, STATUS_LABELS,
  type ReconcileAction, type StockCountItemStatus, type StockCountStatus,
} from '@/lib/services/inventory/stockCounts';
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';

const STATUS_STYLES: Record<StockCountStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  in_progress: 'bg-warning/20 text-warning border-warning',
  completed: 'bg-primary/10 text-primary border-primary/30',
  reconciled: 'bg-success/20 text-success border-success',
  skipped: 'bg-destructive/10 text-destructive border-destructive/30',
};

const ITEM_STATUS_STYLES: Record<StockCountItemStatus, string> = {
  expected: 'bg-muted text-muted-foreground',
  found: 'bg-success/20 text-success border-success',
  missing: 'bg-destructive/20 text-destructive border-destructive',
  unexpected_found: 'bg-warning/20 text-warning border-warning',
  reconciled: 'bg-primary/10 text-primary border-primary/30',
};

export default function StockCountDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin: isSuper } = useIsSuperAdmin();
  const { data, isLoading } = useStockCount(id);
  const { data: queueId } = useCountQueueId(id);
  const startMut = useStartCount();
  const completeMut = useCompleteCount();
  const reconcileMut = useReconcileCount();
  const markMissingMut = useMarkItemsMissing();

  const [filterStatus, setFilterStatus] = useState<StockCountItemStatus | 'all'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reconciliations, setReconciliations] = useState<Record<string, ReconcileAction>>({});

  const items = data?.items ?? [];
  const count = data?.count;

  const stats = useMemo(() => ({
    total: items.length,
    found: items.filter((i) => i.count_status === 'found').length,
    missing: items.filter((i) => i.count_status === 'missing').length,
    unexpected: items.filter((i) => i.count_status === 'unexpected_found').length,
    expected: items.filter((i) => i.count_status === 'expected').length,
  }), [items]);

  const progressPct = stats.total > 0 ? Math.round(((stats.found + stats.missing + stats.unexpected) / stats.total) * 100) : 0;

  const filtered = useMemo(() => filterStatus === 'all' ? items : items.filter((i) => i.count_status === filterStatus), [items, filterStatus]);
  const discrepancies = useMemo(() =>
    items.filter((i) =>
      i.count_status === 'unexpected_found' ||
      (i.count_status === 'found' && i.expected_location_type && i.found_location_type && i.expected_location_type !== i.found_location_type),
    ), [items]);
  const missingItems = useMemo(() => items.filter((i) => i.count_status === 'missing'), [items]);

  if (isLoading || !count) {
    return <AppLayout title="Inventory" moduleNav={INVENTORY_NAV}><div className="p-8 text-center text-muted-foreground">Loading…</div></AppLayout>;
  }

  const handleStart = async () => {
    try {
      const n = await startMut.mutateAsync(id!);
      toast({ title: 'Count started', description: `${n} item(s) snapshotted` });
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
  };

  const handleComplete = async () => {
    try {
      const r = await completeMut.mutateAsync(id!);
      toast({ title: 'Count completed', description: `${r.found} found, ${r.missing} missing, ${r.unexpected_found} unexpected` });
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
  };

  const handleReconcile = async () => {
    const recs = Object.entries(reconciliations).map(([item_id, action]) => ({ item_id, action }));
    if (recs.length === 0) { toast({ title: 'No items to reconcile', variant: 'destructive' }); return; }
    try {
      await reconcileMut.mutateAsync({ countId: id!, reconciliations: recs });
      toast({ title: 'Reconciled', description: `${recs.length} action(s) applied` });
      setReconciliations({});
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
  };

  const handleMarkSelectedMissing = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    try {
      await markMissingMut.mutateAsync(ids);
      setSelected(new Set());
      toast({ title: 'Marked as missing', description: `${ids.length} item(s)` });
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
  };

  const openScanner = () => {
    if (queueId) navigate(`/barcode/scan/${queueId}`);
    else toast({ title: 'Scanner queue not ready', description: 'Start the count first', variant: 'destructive' });
  };

  return (
    <AppLayout title="Inventory" moduleNav={INVENTORY_NAV}>
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Stock Count</div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{count.count_number}</h1>
              <Badge className={STATUS_STYLES[count.status]}>{STATUS_LABELS[count.status]}</Badge>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {MONTH_LABELS[count.count_period_month - 1]} {count.count_period_year}
              {count.warehouse_id ? ` · Warehouse ${count.warehouse_id}` : ' · All warehouses'}
            </div>
            {count.status === 'skipped' && count.skip_reason && (
              <div className="text-sm mt-2"><span className="font-medium">Skip reason:</span> {count.skip_reason}</div>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {count.status === 'draft' && (
              <Button onClick={handleStart} className="gap-2"><PlayCircle className="h-4 w-4" />Start Count</Button>
            )}
            {count.status === 'in_progress' && (
              <>
                <Button onClick={openScanner} className="gap-2"><ScanLine className="h-4 w-4" />Open Scanner</Button>
                <Button variant="outline" onClick={handleComplete} className="gap-2"><CheckCircle2 className="h-4 w-4" />Complete Count</Button>
              </>
            )}
            <Button variant="outline" onClick={() => window.open(`/print/stock_count/${id}`, '_blank')} className="gap-2">
              <Printer className="h-4 w-4" />Print Sheet
            </Button>
          </div>
        </div>

        {count.status !== 'draft' && count.status !== 'skipped' && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Progress: {stats.found + stats.missing + stats.unexpected} of {stats.total} processed</span>
                <span className="text-muted-foreground">{progressPct}%</span>
              </div>
              <Progress value={progressPct} />
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <Stat label="Expected" value={stats.expected} />
                <Stat label="Found" value={stats.found} accent="text-success" />
                <Stat label="Missing" value={stats.missing} accent="text-destructive" />
                <Stat label="Unexpected" value={stats.unexpected} accent="text-warning" />
                <Stat label="Total" value={stats.total} />
              </div>
              {count.completed_at && <div className="text-xs text-muted-foreground">Completed {format(parseISO(count.completed_at), 'dd MMM yyyy HH:mm')}</div>}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="items">
          <TabsList>
            <TabsTrigger value="items">Expected Items ({items.length})</TabsTrigger>
            <TabsTrigger value="discrepancies">Discrepancies ({discrepancies.length})</TabsTrigger>
            {count.status === 'completed' && isSuper && (
              <TabsTrigger value="reconciliation">Reconciliation ({missingItems.length})</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="items">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as StockCountItemStatus | 'all')}>
                  <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="expected">Expected</SelectItem>
                    <SelectItem value="found">Found</SelectItem>
                    <SelectItem value="missing">Missing</SelectItem>
                    <SelectItem value="unexpected_found">Unexpected Found</SelectItem>
                    <SelectItem value="reconciled">Reconciled</SelectItem>
                  </SelectContent>
                </Select>
                {selected.size > 0 && count.status === 'in_progress' && (
                  <Button size="sm" variant="outline" onClick={handleMarkSelectedMissing}>
                    Mark {selected.size} as Missing
                  </Button>
                )}
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Serial</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Expected</TableHead>
                    <TableHead>Found</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scanned</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No items</TableCell></TableRow>
                  ) : filtered.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell>
                        <Checkbox
                          checked={selected.has(it.id)}
                          onCheckedChange={(c) => {
                            const next = new Set(selected);
                            if (c) next.add(it.id); else next.delete(it.id);
                            setSelected(next);
                          }}
                          disabled={it.count_status !== 'expected'}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{it.serial_number}</TableCell>
                      <TableCell>{it.product?.name ?? it.product_id}</TableCell>
                      <TableCell className="text-sm capitalize">{(it.expected_location_type ?? '—').replace(/_/g, ' ')}</TableCell>
                      <TableCell className="text-sm capitalize">{(it.found_location_type ?? '—').replace(/_/g, ' ')}</TableCell>
                      <TableCell><Badge className={ITEM_STATUS_STYLES[it.count_status]}>{it.count_status.replace(/_/g, ' ')}</Badge></TableCell>
                      <TableCell className="text-xs">{it.scanned_at ? format(parseISO(it.scanned_at), 'dd MMM HH:mm') : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="discrepancies">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serial</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Expected</TableHead>
                    <TableHead>Found</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discrepancies.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No discrepancies</TableCell></TableRow>
                  ) : discrepancies.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell className="font-mono text-xs">{it.serial_number}</TableCell>
                      <TableCell>{it.product?.name ?? it.product_id}</TableCell>
                      <TableCell className="text-sm capitalize">{(it.expected_location_type ?? '—').replace(/_/g, ' ')}</TableCell>
                      <TableCell className="text-sm capitalize">{(it.found_location_type ?? '—').replace(/_/g, ' ')}</TableCell>
                      <TableCell><Badge className={ITEM_STATUS_STYLES[it.count_status]}>{it.count_status.replace(/_/g, ' ')}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {count.status === 'completed' && isSuper && (
            <TabsContent value="reconciliation">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Reconcile Missing Items</CardTitle>
                  <Button onClick={handleReconcile} disabled={Object.keys(reconciliations).length === 0}>
                    Apply Reconciliation
                  </Button>
                </CardHeader>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Expected</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {missingItems.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No missing items</TableCell></TableRow>
                    ) : missingItems.map((it) => (
                      <TableRow key={it.id}>
                        <TableCell className="font-mono text-xs">{it.serial_number}</TableCell>
                        <TableCell>{it.product?.name ?? it.product_id}</TableCell>
                        <TableCell className="text-sm capitalize">{(it.expected_location_type ?? '—').replace(/_/g, ' ')}</TableCell>
                        <TableCell>
                          <Select
                            value={reconciliations[it.id] ?? ''}
                            onValueChange={(v) => setReconciliations((p) => ({ ...p, [it.id]: v as ReconcileAction }))}
                          >
                            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Choose action" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mark_lost">Mark Lost</SelectItem>
                              <SelectItem value="write_off">Write Off</SelectItem>
                              <SelectItem value="found_late">Found Late</SelectItem>
                              <SelectItem value="ignore">Ignore</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          )}
        </Tabs>
        {id && <ActivityChatter recordType="stock_count" recordId={id} />}
      </div>
    </AppLayout>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="border border-border rounded p-2">
      <div className="text-muted-foreground">{label}</div>
      <div className={`text-lg font-bold ${accent ?? ''}`}>{value}</div>
    </div>
  );
}