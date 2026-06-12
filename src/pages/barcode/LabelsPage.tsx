import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Printer, Tag, RefreshCw } from 'lucide-react';
import { useProducts } from '@/hooks/inventory';
import {
  useBatchGenerateLabels, useRecordLabelPrints, useLabelHistory,
} from '@/hooks/barcode';
import { BARCODE_NAV } from '@/lib/navigation/barcode';
import { BarcodeSvg } from '@/components/barcode/BarcodeSvg';
import type { LabelData, LabelFormat } from '@/lib/services/barcode/api';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export default function LabelsPage() {
  const { toast } = useToast();
  const { data: products = [] } = useProducts();
  const batchMut = useBatchGenerateLabels();
  const recordMut = useRecordLabelPrints();
  const { data: history = [] } = useLabelHistory();

  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [labelFormat, setLabelFormat] = useState<LabelFormat>('standard');
  const [labels, setLabels] = useState<LabelData[]>([]);

  const handleGenerate = async () => {
    const product = products.find((p) => p.id === productId);
    if (!product) {
      toast({ title: 'Select a product', variant: 'destructive' });
      return;
    }
    if (quantity < 1) {
      toast({ title: 'Quantity must be at least 1', variant: 'destructive' });
      return;
    }
    try {
      const out = await batchMut.mutateAsync([{
        productId: product.id,
        productSku: product.sku,
        productName: product.name,
        quantity,
        format: labelFormat,
      }]);
      setLabels(out);
    } catch (e: any) {
      toast({ title: 'Generation failed', description: e?.message, variant: 'destructive' });
    }
  };

  const handlePrint = async () => {
    if (!labels.length) return;
    try {
      await recordMut.mutateAsync({ labels });
      toast({ title: `Recorded ${labels.length} labels` });
      // small delay to let the DOM settle before invoking print
      setTimeout(() => window.print(), 50);
    } catch (e: any) {
      toast({ title: 'Print log failed', description: e?.message, variant: 'destructive' });
    }
  };

  return (
    <AppLayout title="Barcode" moduleNav={BARCODE_NAV}>
      <div className="p-4 md:p-6 space-y-6">
        <div className="print:hidden">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Tag className="h-6 w-6 text-primary" /> Label Generation & Printing
          </h1>
          <p className="text-sm text-muted-foreground">Generate sequential barcodes and print labels.</p>
        </div>

        {/* Generate form */}
        <Card className="print:hidden">
          <CardHeader className="py-3">
            <CardTitle className="text-base">Generate Labels</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="md:col-span-2 space-y-1">
              <Label>Product</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger><SelectValue placeholder="" /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.sku} — {p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Quantity</Label>
              <Input
                type="number" min={1}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
              />
            </div>
            <div className="space-y-1">
              <Label>Format</Label>
              <Select value={labelFormat} onValueChange={(v) => setLabelFormat(v as LabelFormat)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard (A4 grid)</SelectItem>
                  <SelectItem value="thermal">Thermal (2"×1")</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-4 flex justify-end gap-2">
              <Button onClick={handleGenerate} disabled={batchMut.isPending}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {batchMut.isPending ? 'Generating…' : 'Generate'}
              </Button>
              <Button onClick={handlePrint} disabled={!labels.length || recordMut.isPending}>
                <Printer className="h-4 w-4 mr-2" />
                Print Labels
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {labels.length > 0 && (
          <div
            className={cn(
              'print:block',
              labelFormat === 'standard'
                ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'
                : 'flex flex-col gap-2',
            )}
          >
            {labels.map((l) => (
              <div
                key={l.serialNumber}
                className={cn(
                  'border rounded-md p-3 bg-card text-center print:break-inside-avoid',
                  labelFormat === 'thermal' && 'max-w-[2in]',
                )}
              >
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground">GLF</p>
                <p className="text-xs font-medium truncate">{l.productName}</p>
                <BarcodeSvg value={l.barcodeValue} height={40} fontSize={10} className="mx-auto" />
                <p className="text-[10px] font-mono">{l.serialNumber}</p>
              </div>
            ))}
          </div>
        )}

        {/* History */}
        <Card className="print:hidden">
          <CardHeader className="py-3">
            <CardTitle className="text-base">Recent Prints</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No labels printed yet.</p>
            ) : (
              <div className="space-y-1 text-sm">
                {history.slice(0, 50).map((h) => (
                  <div key={h.id} className="flex justify-between border-b py-1.5">
                    <span className="font-mono">{h.serial_number}</span>
                    <span className="text-muted-foreground text-xs">
                      {format(parseISO(h.printed_at), 'MMM d, HH:mm')}
                    </span>
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