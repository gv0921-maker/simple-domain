import { useState, useEffect, useRef, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Printer,
  Download,
  Tag,
  QrCode,
  Barcode,
  Package,
  Settings2,
  Eye,
} from 'lucide-react';
import { getProducts } from '@/lib/data/inventory/storage';
import type { Product } from '@/lib/data/inventory/types';
import { BARCODE_NAV } from '@/lib/navigation';
import { useToast } from '@/hooks/use-toast';
import JsBarcode from 'jsbarcode';
import { QRCodeSVG } from 'qrcode.react';

type LabelFormat = 'barcode' | 'qrcode' | 'both';
type LabelSize = 'small' | 'medium' | 'large';

interface LabelConfig {
  format: LabelFormat;
  size: LabelSize;
  showName: boolean;
  showSku: boolean;
  showPrice: boolean;
  copies: number;
}

function BarcodePreview({ value, width, height }: { value: string; width: number; height: number }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          width: 2,
          height,
          displayValue: true,
          fontSize: 14,
          margin: 5,
          background: 'transparent',
        });
      } catch {
        // Invalid barcode value
      }
    }
  }, [value, width, height]);

  if (!value) return <p className="text-sm text-muted-foreground">No barcode</p>;
  return <svg ref={svgRef} />;
}

export default function BarcodeLabels() {
  const { toast } = useToast();
  const [products] = useState<Product[]>(() => getProducts());
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [config, setConfig] = useState<LabelConfig>({
    format: 'barcode',
    size: 'medium',
    showName: true,
    showSku: true,
    showPrice: false,
    copies: 1,
  });
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
    }
  };

  const selectedProducts = products.filter((p) => selectedIds.has(p.id));

  const handlePrint = useCallback(() => {
    if (selectedProducts.length === 0) {
      toast({ title: 'No products selected', description: 'Select products to generate labels.', variant: 'destructive' });
      return;
    }
    // Open print dialog for the label preview area
    const printWindow = window.open('', '_blank');
    if (!printWindow || !printRef.current) return;

    printWindow.document.write(`
      <html><head><title>Print Labels</title>
      <style>
        body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; }
        .label-grid { display: flex; flex-wrap: wrap; gap: 16px; }
        .label { border: 1px dashed #ccc; padding: 12px; text-align: center; page-break-inside: avoid; }
        .label-small { width: 180px; }
        .label-medium { width: 260px; }
        .label-large { width: 360px; }
        .label-name { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
        .label-sku { font-size: 12px; color: #666; margin-bottom: 8px; }
        .label-price { font-size: 16px; font-weight: 700; margin-top: 8px; }
        svg { max-width: 100%; }
        @media print { .label { border: 1px dashed #ccc; } }
      </style></head><body>
      <div class="label-grid">${printRef.current.innerHTML}</div>
      <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
      </body></html>
    `);
    printWindow.document.close();
  }, [selectedProducts, toast]);

  const sizeMap = { small: { w: 180, h: 40 }, medium: { w: 260, h: 60 }, large: { w: 360, h: 80 } };

  return (
    <AppLayout title="Barcode" moduleNav={BARCODE_NAV}>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
              <Tag className="h-6 w-6 text-primary" />
              Barcode & Label Generator
            </h1>
            <p className="text-muted-foreground">Generate and print barcode/QR code labels for products</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint} disabled={selectedIds.size === 0} className="gap-2">
              <Printer className="h-4 w-4" />
              Print Labels ({selectedIds.size})
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Product selection */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>

            <div className="border rounded-lg bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={selectedIds.size === filtered.length && filtered.length > 0}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((product) => (
                    <TableRow key={product.id} className="cursor-pointer" onClick={() => toggleSelect(product.id)}>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={selectedIds.has(product.id)} onCheckedChange={() => toggleSelect(product.id)} />
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                      <TableCell>
                        {product.barcode ? (
                          <Badge variant="secondary" className="font-mono text-xs">{product.barcode}</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">Auto-generate</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setPreviewProduct(product); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Right: Configuration & Preview */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings2 className="h-4 w-4" />
                  Label Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Format</label>
                  <Select value={config.format} onValueChange={(v) => setConfig((c) => ({ ...c, format: v as LabelFormat }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="barcode"><div className="flex items-center gap-2"><Barcode className="h-4 w-4" />Barcode Only</div></SelectItem>
                      <SelectItem value="qrcode"><div className="flex items-center gap-2"><QrCode className="h-4 w-4" />QR Code Only</div></SelectItem>
                      <SelectItem value="both"><div className="flex items-center gap-2"><Tag className="h-4 w-4" />Both</div></SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Size</label>
                  <Select value={config.size} onValueChange={(v) => setConfig((c) => ({ ...c, size: v as LabelSize }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (30×15mm)</SelectItem>
                      <SelectItem value="medium">Medium (50×25mm)</SelectItem>
                      <SelectItem value="large">Large (70×35mm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Copies per product</label>
                  <Input type="number" min={1} max={100} value={config.copies} onChange={(e) => setConfig((c) => ({ ...c, copies: parseInt(e.target.value) || 1 }))} />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium block">Include on label</label>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={config.showName} onCheckedChange={(v) => setConfig((c) => ({ ...c, showName: !!v }))} id="showName" />
                    <label htmlFor="showName" className="text-sm">Product Name</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={config.showSku} onCheckedChange={(v) => setConfig((c) => ({ ...c, showSku: !!v }))} id="showSku" />
                    <label htmlFor="showSku" className="text-sm">SKU</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={config.showPrice} onCheckedChange={(v) => setConfig((c) => ({ ...c, showPrice: !!v }))} id="showPrice" />
                    <label htmlFor="showPrice" className="text-sm">Sale Price</label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Live Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preview</CardTitle>
                <CardDescription>
                  {previewProduct ? previewProduct.name : selectedProducts[0]?.name || 'Select a product'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const p = previewProduct || selectedProducts[0];
                  if (!p) return <div className="text-center py-8 text-muted-foreground"><Package className="h-10 w-10 mx-auto mb-2 opacity-50" /><p className="text-sm">Select a product to preview</p></div>;
                  const barcodeValue = p.barcode || p.sku;
                  const { h } = sizeMap[config.size];
                  return (
                    <div className="border border-dashed rounded-lg p-4 text-center space-y-2 bg-background">
                      {config.showName && <p className="font-semibold text-sm">{p.name}</p>}
                      {config.showSku && <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>}
                      <div className="flex items-center justify-center gap-3">
                        {(config.format === 'barcode' || config.format === 'both') && (
                          <BarcodePreview value={barcodeValue} width={sizeMap[config.size].w} height={h} />
                        )}
                        {(config.format === 'qrcode' || config.format === 'both') && (
                          <QRCodeSVG value={barcodeValue} size={h + 40} />
                        )}
                      </div>
                      {config.showPrice && p.salePrice > 0 && <p className="text-lg font-bold">₹{p.salePrice.toLocaleString()}</p>}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Hidden print area */}
        <div className="hidden">
          <div ref={printRef}>
            {selectedProducts.flatMap((p) =>
              Array.from({ length: config.copies }, (_, i) => {
                const barcodeValue = p.barcode || p.sku;
                const { h } = sizeMap[config.size];
                return (
                  <div key={`${p.id}-${i}`} className={`label label-${config.size}`} style={{ display: 'inline-block', border: '1px dashed #ccc', padding: 12, textAlign: 'center', margin: 8 }}>
                    {config.showName && <div className="label-name">{p.name}</div>}
                    {config.showSku && <div className="label-sku">{p.sku}</div>}
                    {(config.format === 'barcode' || config.format === 'both') && (
                      <BarcodePreview value={barcodeValue} width={sizeMap[config.size].w} height={h} />
                    )}
                    {(config.format === 'qrcode' || config.format === 'both') && (
                      <QRCodeSVG value={barcodeValue} size={h + 40} />
                    )}
                    {config.showPrice && p.salePrice > 0 && <div className="label-price">₹{p.salePrice.toLocaleString()}</div>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
