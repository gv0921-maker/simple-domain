import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Camera, CheckCircle2, XCircle, Repeat, AlertTriangle, ScanLine } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  useScanQueueItem, useScanRecords, useRecordScan, useCompleteScanQueue,
} from '@/hooks/barcode';
import { BARCODE_NAV } from '@/lib/navigation/barcode';
import { feedbackByResult } from '@/lib/barcode/feedback';
import type { ScanResult } from '@/lib/services/barcode/api';
import { CameraScannerDialog } from '@/components/barcode/CameraScannerDialog';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

const RESULT_META: Record<ScanResult, { label: string; cls: string; icon: any }> = {
  valid:        { label: 'Scanned',     cls: 'bg-success/15 text-success border-success/30', icon: CheckCircle2 },
  duplicate:    { label: 'Duplicate',   cls: 'bg-warning/15 text-warning border-warning/30', icon: Repeat },
  invalid:      { label: 'Invalid',     cls: 'bg-destructive/15 text-destructive border-destructive/30', icon: XCircle },
  not_expected: { label: 'Not expected',cls: 'bg-destructive/15 text-destructive border-destructive/30', icon: AlertTriangle },
};

export default function ScanWorkspace() {
  const { queueId } = useParams<{ queueId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [flash, setFlash] = useState<'success' | 'error' | 'warn' | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [forceReason, setForceReason] = useState('');
  const [forcing, setForcing] = useState(false);

  const { data: queue, isLoading } = useScanQueueItem(queueId);
  const { data: records = [] } = useScanRecords(queueId);
  const recordScan = useRecordScan(queueId ?? '');
  const completeMut = useCompleteScanQueue();

  const isAdmin = (user?.role ?? '').toLowerCase() === 'admin'
    || (user?.role ?? '').toLowerCase() === 'super_admin';

  const validScans = useMemo(() => records.filter((r) => r.scan_result === 'valid'), [records]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [queueId]);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 400);
    return () => clearTimeout(t);
  }, [flash]);

  const submitScan = async (barcode: string) => {
    const code = barcode.trim();
    if (!code || !queueId) return;
    try {
      const rec = await recordScan.mutateAsync({
        barcode: code,
        alreadyScanned: validScans.map((r) => r.barcode),
      });
      feedbackByResult(rec.scan_result);
      if (rec.scan_result === 'valid') setFlash('success');
      else if (rec.scan_result === 'duplicate') setFlash('warn');
      else setFlash('error');
      setValue('');
      inputRef.current?.focus();
    } catch (e: any) {
      toast({ title: 'Scan failed', description: e?.message, variant: 'destructive' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitScan(value);
  };

  const expected = queue?.expected_items_count ?? 0;
  const scanned = validScans.length;
  const complete = expected > 0 && scanned >= expected;
  const isCompleted = queue?.scan_status === 'completed';

  const doComplete = async (force = false) => {
    if (!queueId) return;
    if (force && !forceReason.trim()) {
      toast({ title: 'Reason required', variant: 'destructive' });
      return;
    }
    try {
      await completeMut.mutateAsync({ queueId, force, reason: force ? forceReason : undefined });
      toast({ title: 'Scan completed' });
      navigate('/barcode');
    } catch (e: any) {
      toast({ title: 'Failed to complete', description: e?.message, variant: 'destructive' });
    }
  };

  if (isLoading || !queue) {
    return (
      <AppLayout title="Barcode" moduleNav={BARCODE_NAV}>
        <div className="p-6 text-sm text-muted-foreground">Loading…</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Barcode" moduleNav={BARCODE_NAV}>
      <div className={cn(
        'min-h-[calc(100vh-110px)] flex flex-col transition-colors',
        flash === 'success' && 'bg-success/10',
        flash === 'error' && 'bg-destructive/10',
        flash === 'warn' && 'bg-warning/10',
      )}>
        {/* Header */}
        <div className="p-3 md:p-4 flex items-center gap-2 border-b">
          <Button variant="ghost" size="icon" onClick={() => navigate('/barcode')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-sm font-semibold truncate">{queue.document_reference}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {queue.document_type.replace(/_/g, ' ')}
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {scanned} / {expected}
          </Badge>
        </div>

        {/* Scan input (sticky-top, thumb-reachable) */}
        <div className="p-3 md:p-4 sticky top-0 bg-background/95 backdrop-blur z-10 border-b">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <ScanLine className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder=""
                autoFocus
                disabled={isCompleted}
                className="pl-10 h-12 text-base font-mono"
                inputMode="text"
                autoCapitalize="off"
                autoComplete="off"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-12 w-12"
              onClick={() => setCameraOpen(true)}
              disabled={isCompleted}
              aria-label="Open camera"
            >
              <Camera className="h-5 w-5" />
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-1">
            Scanned {scanned} of {expected} items
          </p>
        </div>

        {/* Scanned items list */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 pb-24 space-y-2">
          {records.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">
              No scans yet. Scan a barcode to begin.
            </CardContent></Card>
          ) : records.map((r) => {
            const meta = RESULT_META[r.scan_result];
            const Icon = meta.icon;
            return (
              <Card key={r.id} className={cn('border', meta.cls)}>
                <CardContent className="p-3 flex items-center gap-3">
                  <Icon className="h-5 w-5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-semibold truncate">{r.barcode}</p>
                    {r.serial_number && (
                      <p className="text-xs text-muted-foreground truncate">SN: {r.serial_number}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      {format(parseISO(r.scanned_at), 'MMM d, HH:mm:ss')}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{meta.label}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Sticky bottom complete bar */}
        {!isCompleted && (
          <div className="sticky bottom-0 bg-background border-t p-3 space-y-2">
            {forcing && (
              <Input
                placeholder=""
                value={forceReason}
                onChange={(e) => setForceReason(e.target.value)}
              />
            )}
            <div className="flex gap-2">
              {complete ? (
                <Button className="flex-1 h-12" onClick={() => doComplete(false)} disabled={completeMut.isPending}>
                  <CheckCircle2 className="h-5 w-5 mr-2" /> Complete
                </Button>
              ) : isAdmin ? (
                forcing ? (
                  <>
                    <Button variant="outline" className="flex-1 h-12" onClick={() => setForcing(false)}>Cancel</Button>
                    <Button variant="destructive" className="flex-1 h-12" onClick={() => doComplete(true)}>
                      Force Complete
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" className="flex-1 h-12" onClick={() => setForcing(true)}>
                    Force Complete (Admin)
                  </Button>
                )
              ) : (
                <Button className="flex-1 h-12" disabled>
                  Scan all items to complete
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <CameraScannerDialog
        open={cameraOpen}
        onOpenChange={setCameraOpen}
        onScanned={(text) => void submitScan(text)}
      />
    </AppLayout>
  );
}