import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { History } from 'lucide-react';
import { useScanHistory } from '@/hooks/barcode';
import { BARCODE_NAV } from '@/lib/navigation/barcode';
import { format, parseISO } from 'date-fns';

export default function ScanHistoryPage() {
  const [barcode, setBarcode] = useState('');
  const [serial, setSerial] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data: records = [], isLoading } = useScanHistory({
    barcode: barcode || undefined,
    serial: serial || undefined,
    from: from || undefined,
    to: to ? new Date(to + 'T23:59:59').toISOString() : undefined,
  });

  return (
    <AppLayout title="Barcode" moduleNav={BARCODE_NAV}>
      <div className="p-4 md:p-6 space-y-4">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <History className="h-6 w-6 text-primary" /> Scan History
        </h1>

        <Card>
          <CardContent className="p-3 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label>Barcode</Label>
              <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="" />
            </div>
            <div className="space-y-1">
              <Label>Serial</Label>
              <Input value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="" />
            </div>
            <div className="space-y-1">
              <Label>From</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>To</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Loading…</p>
            ) : records.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No scans found.</p>
            ) : (
              <div className="divide-y">
                {records.map((r) => (
                  <div key={r.id} className="p-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="font-mono font-medium truncate">{r.barcode}</p>
                      {r.serial_number && (
                        <p className="text-xs text-muted-foreground truncate">SN: {r.serial_number}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px]">{r.scan_result}</Badge>
                      <span>{format(parseISO(r.scanned_at), 'MMM d, yyyy HH:mm:ss')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}