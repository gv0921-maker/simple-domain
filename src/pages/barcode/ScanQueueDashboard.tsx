import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  PackageCheck, PackageOpen, ClipboardCheck, Undo2, ListChecks, Wrench, AlertTriangle, ScanLine,
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useScanQueue } from '@/hooks/barcode';
import { BARCODE_NAV } from '@/lib/navigation/barcode';
import type {
  ScanDocumentType, ScanStatus, ScanQueueItem,
} from '@/lib/services/barcode/api';
import { cn } from '@/lib/utils';

const TYPE_META: Record<ScanDocumentType, { label: string; short: string; icon: any; color: string }> = {
  goods_receipt:    { label: 'Goods Receipt',     short: 'GR',  icon: PackageOpen,    color: 'bg-info/15 text-info border-info/30' },
  internal_transfer:{ label: 'Internal Transfer', short: 'ITO', icon: PackageCheck,   color: 'bg-primary/15 text-primary border-primary/30' },
  pre_delivery_qc:  { label: 'Pre-delivery QC',   short: 'QC',  icon: ClipboardCheck, color: 'bg-warning/15 text-warning border-warning/30' },
  return_receipt:   { label: 'Return Receipt',    short: 'RR',  icon: Undo2,          color: 'bg-secondary/40 text-foreground border-border' },
  stock_count:      { label: 'Stock Count',       short: 'SC',  icon: ListChecks,     color: 'bg-accent/40 text-foreground border-border' },
  correction_order: { label: 'Correction',        short: 'CO',  icon: Wrench,         color: 'bg-secondary/40 text-foreground border-border' },
  write_off:        { label: 'Write-off',         short: 'WO',  icon: AlertTriangle,  color: 'bg-destructive/15 text-destructive border-destructive/30' },
};

const STATUS_META: Record<ScanStatus, { label: string; cls: string }> = {
  pending:     { label: 'Pending',     cls: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'In progress', cls: 'bg-info/20 text-info border-info' },
  completed:   { label: 'Completed',   cls: 'bg-success/20 text-success border-success' },
};

function isToday(iso: string) {
  const d = new Date(iso); const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

export default function ScanQueueDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [docType, setDocType] = useState<ScanDocumentType | 'all'>('all');
  const [status, setStatus] = useState<ScanStatus | 'all'>('all');
  const [mine, setMine] = useState(false);
  const [sort, setSort] = useState<'priority' | 'oldest' | 'newest'>('priority');

  const { data: items = [], isLoading } = useScanQueue({
    documentType: docType,
    status,
    assignedToMe: mine,
    userId: user?.id,
    sort,
  });

  const stats = useMemo(() => {
    const pending = items.filter((i) => i.scan_status === 'pending').length;
    const inProgress = items.filter((i) => i.scan_status === 'in_progress').length;
    const completedToday = items.filter((i) => i.scan_status === 'completed' && isToday(i.updated_at)).length;
    const urgent = items.filter((i) => i.priority === 'urgent' && i.scan_status !== 'completed').length;
    return { pending, inProgress, completedToday, urgent };
  }, [items]);

  const grouped = useMemo(() => {
    const m = new Map<ScanDocumentType, ScanQueueItem[]>();
    for (const it of items) {
      const arr = m.get(it.document_type) ?? [];
      arr.push(it);
      m.set(it.document_type, arr);
    }
    return Array.from(m.entries());
  }, [items]);

  return (
    <AppLayout title="Barcode" moduleNav={BARCODE_NAV}>
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <ScanLine className="h-6 w-6 text-primary" />
            Scan Queue
          </h1>
          <p className="text-sm text-muted-foreground">Pick a document, scan items, and complete.</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Pending Scans" value={stats.pending} tone="muted" />
          <Stat label="In Progress" value={stats.inProgress} tone="info" />
          <Stat label="Completed Today" value={stats.completedToday} tone="success" />
          <Stat label="Urgent" value={stats.urgent} tone="destructive" />
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-3 md:p-4 flex flex-wrap gap-2 items-end">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Type</span>
              <Select value={docType} onValueChange={(v) => setDocType(v as any)}>
                <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {(Object.keys(TYPE_META) as ScanDocumentType[]).map((k) => (
                    <SelectItem key={k} value={k}>{TYPE_META[k].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Status</span>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Sort</span>
              <Select value={sort} onValueChange={(v) => setSort(v as any)}>
                <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="newest">Newest first</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant={mine ? 'default' : 'outline'} size="sm"
              onClick={() => setMine((v) => !v)}
            >
              Assigned to me
            </Button>
          </CardContent>
        </Card>

        {/* Queue */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
            No documents in the queue.
          </CardContent></Card>
        ) : (
          <div className="space-y-6">
            {grouped.map(([type, list]) => {
              const meta = TYPE_META[type];
              const Icon = meta.icon;
              return (
                <div key={type} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold">{meta.label}</h2>
                    <Badge variant="outline" className="text-[10px]">{list.length}</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {list.map((it) => {
                      const pct = it.expected_items_count > 0
                        ? Math.min(100, Math.round((it.scanned_items_count / it.expected_items_count) * 100))
                        : 0;
                      return (
                        <Card
                          key={it.id}
                          className="cursor-pointer hover:shadow-md transition"
                          onClick={() => navigate(`/barcode/scan/${it.id}`)}
                        >
                          <CardContent className="p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-mono text-sm font-semibold truncate">{it.document_reference}</p>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <Badge variant="outline" className={cn('text-[10px] border', meta.color)}>{meta.short}</Badge>
                                  <Badge className={cn('text-[10px]', STATUS_META[it.scan_status].cls)}>
                                    {STATUS_META[it.scan_status].label}
                                  </Badge>
                                  {it.priority !== 'normal' && (
                                    <Badge variant="outline" className={cn(
                                      'text-[10px]',
                                      it.priority === 'urgent' && 'border-destructive text-destructive',
                                    )}>
                                      {it.priority}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDistanceToNow(parseISO(it.created_at))} ago
                              </span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">
                                  Scanned {it.scanned_items_count} of {it.expected_items_count}
                                </span>
                                <span className="font-medium">{pct}%</span>
                              </div>
                              <Progress value={pct} className="h-2" />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: 'muted' | 'info' | 'success' | 'destructive' }) {
  const toneCls = {
    muted: 'text-foreground',
    info: 'text-info',
    success: 'text-success',
    destructive: 'text-destructive',
  }[tone];
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn('text-2xl font-semibold mt-1', toneCls)}>{value}</p>
      </CardContent>
    </Card>
  );
}