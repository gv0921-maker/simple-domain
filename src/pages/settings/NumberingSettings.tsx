import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SETTINGS_NAV } from '@/lib/navigation/settings';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Save } from 'lucide-react';
import {
  useCurrentFY, useNumberingSettings, useUpdateNumberingSettings,
} from '@/hooks/numbering';
import { previewNextNumber, type DocumentType } from '@/lib/services/numbering/api';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const DOC_TYPES: { type: DocumentType; label: string }[] = [
  { type: 'sales_order', label: 'Sales Order' },
  { type: 'quotation', label: 'Quotation' },
  { type: 'invoice', label: 'Invoice' },
  { type: 'delivery_note', label: 'Delivery Note' },
  { type: 'internal_transfer', label: 'Internal Transfer Order' },
  { type: 'vendor_order', label: 'Vendor Order' },
  { type: 'work_order', label: 'Work Order' },
  { type: 'return_request', label: 'Return Request' },
  { type: 'credit_note', label: 'Credit Note' },
  { type: 'goods_receipt', label: 'Goods Receipt' },
  { type: 'payment_receipt', label: 'Payment Receipt' },
  { type: 'correction_order', label: 'Correction Order' },
  { type: 'stock_count', label: 'Stock Count' },
  { type: 'write_off', label: 'Write-off' },
];

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function fyDisplay(label: string): string {
  if (!label || label.length !== 4) return label;
  return `FY 20${label.slice(0, 2)}-${label.slice(2)}`;
}

export default function NumberingSettings() {
  const { user } = useAuth();
  const isSuperAdmin = (user as any)?.role === 'super_admin'
    || (Array.isArray((user as any)?.roles) && (user as any).roles.includes('super_admin'));
  const { toast } = useToast();

  const { data: fy } = useCurrentFY();
  const { data: settings } = useNumberingSettings();
  const updateMut = useUpdateNumberingSettings();

  const [fyStartMonth, setFyStartMonth] = useState<number>(4);
  const [fyStartDay, setFyStartDay] = useState<number>(1);
  const [padding, setPadding] = useState<number>(4);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings) {
      setFyStartMonth(settings.fy_start_month);
      setFyStartDay(settings.fy_start_day);
      setPadding(settings.sequential_padding);
    }
  }, [settings]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const out: Record<string, string> = {};
      for (const d of DOC_TYPES) {
        try { out[d.type] = await previewNextNumber(d.type); } catch { out[d.type] = '—'; }
      }
      if (!cancelled) setPreviews(out);
    })();
    return () => { cancelled = true; };
  }, [fy, settings?.sequential_padding]);

  if (!isSuperAdmin) return <Navigate to="/" replace />;

  const save = async () => {
    try {
      await updateMut.mutateAsync({
        fy_start_month: fyStartMonth,
        fy_start_day: fyStartDay,
        sequential_padding: padding,
      });
      toast({ title: 'Numbering settings saved' });
    } catch (e: any) {
      toast({ title: 'Save failed', description: e.message ?? String(e), variant: 'destructive' });
    }
  };

  return (
    <AppLayout title="Settings" subtitle="Document Numbering" moduleNav={SETTINGS_NAV}>
      <div className="p-6 space-y-6 max-w-5xl">
        <Card className="p-6 space-y-1">
          <div className="text-sm text-muted-foreground">Current Financial Year</div>
          <div className="text-2xl font-semibold">{fy ? fyDisplay(fy) : '—'}</div>
          <div className="text-xs text-muted-foreground">Label used in new document numbers: <code className="font-mono">{fy ?? '—'}</code></div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Financial Year Configuration</h3>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Heads up</AlertTitle>
            <AlertDescription>
              Changing these settings will affect all new document numbers but not existing documents.
            </AlertDescription>
          </Alert>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>FY Start Month</Label>
              <Select value={String(fyStartMonth)} onValueChange={(v) => setFyStartMonth(parseInt(v, 10))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>FY Start Day</Label>
              <Input type="number" min={1} max={31} value={fyStartDay}
                onChange={(e) => setFyStartDay(Math.max(1, Math.min(31, parseInt(e.target.value || '1', 10))))} />
            </div>
            <div>
              <Label>Sequential Padding</Label>
              <Input type="number" min={3} max={6} value={padding}
                onChange={(e) => setPadding(Math.max(3, Math.min(6, parseInt(e.target.value || '4', 10))))} />
              <div className="text-xs text-muted-foreground mt-1">Zeros in the sequence (e.g. 4 → 0001).</div>
            </div>
          </div>
          <div>
            <Button onClick={save} disabled={updateMut.isPending}>
              <Save className="h-4 w-4 mr-2" />Save Settings
            </Button>
          </div>
        </Card>

        <Card className="p-6 space-y-3">
          <h3 className="text-lg font-semibold">Next Sequence Preview</h3>
          <div className="text-sm text-muted-foreground">
            The next number that will be assigned for each document type in the current FY.
          </div>
          <div className="grid md:grid-cols-2 gap-2">
            {DOC_TYPES.map((d) => (
              <div key={d.type} className="flex items-center justify-between py-2 px-3 rounded border bg-muted/30">
                <span className="text-sm">{d.label}</span>
                <code className="text-sm font-mono">{previews[d.type] ?? '—'}</code>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}