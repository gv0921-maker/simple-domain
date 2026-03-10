import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  ScanLine,
  Package,
  MapPin,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Check,
  X,
  DollarSign,
  Layers,
  BarChart3,
  ExternalLink,
  Search,
} from 'lucide-react';
import { getProducts, getProductByBarcode, getStockMoves, getLotsByProduct, getSerialsByProduct } from '@/lib/data/inventory/storage';
import type { Product, StockMove } from '@/lib/data/inventory/types';
import { BARCODE_NAV } from '@/lib/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import JsBarcode from 'jsbarcode';

function InlineBarcodePreview({ value }: { value: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, { format: 'CODE128', width: 1.5, height: 40, displayValue: true, fontSize: 12, margin: 2, background: 'transparent' });
      } catch { /* ignore */ }
    }
  }, [value]);
  return <svg ref={svgRef} className="max-w-full" />;
}

export default function ProductScanLookup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [recentMoves, setRecentMoves] = useState<StockMove[]>([]);
  const [scanHistory, setScanHistory] = useState<Array<{ barcode: string; product: Product | null; time: Date }>>([]);

  const handleLookup = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    // Search by barcode first, then SKU, then name
    let product = getProductByBarcode(trimmed);
    if (!product) {
      const allProducts = getProducts();
      product = allProducts.find(p => p.sku.toLowerCase() === trimmed.toLowerCase()) || null;
      if (!product) {
        product = allProducts.find(p => p.name.toLowerCase().includes(trimmed.toLowerCase())) || null;
      }
    }

    setScanHistory(prev => [{ barcode: trimmed, product, time: new Date() }, ...prev.slice(0, 19)]);

    if (product) {
      setFoundProduct(product);
      // Get recent stock moves for this product
      const moves = getStockMoves().filter(m => m.lines.some(l => l.productId === product!.id)).slice(0, 5);
      setRecentMoves(moves);
      toast({ title: 'Product Found', description: product.name });
    } else {
      setFoundProduct(null);
      setRecentMoves([]);
      toast({ title: 'Not Found', description: `No product matches "${trimmed}"`, variant: 'destructive' });
    }
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLookup(inputValue);
    }
  };

  const stockStatus = foundProduct
    ? foundProduct.stockOnHand === 0
      ? 'out'
      : foundProduct.stockOnHand <= foundProduct.reorderLevel
        ? 'low'
        : 'ok'
    : null;

  return (
    <AppLayout title="Barcode" moduleNav={BARCODE_NAV}>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
            <ScanLine className="h-6 w-6 text-primary" />
            Product Scan & Lookup
          </h1>
          <p className="text-muted-foreground">Scan a barcode or search to view product details instantly</p>
        </div>

        {/* Scanner Input */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Scan barcode, enter SKU, or search by name..."
                  className="pl-11 h-14 text-lg font-mono"
                  autoFocus
                />
              </div>
              <Button size="lg" className="h-14 px-6 gap-2" onClick={() => handleLookup(inputValue)} disabled={!inputValue.trim()}>
                <ScanLine className="h-5 w-5" />
                Lookup
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Product Details */}
        {foundProduct && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{foundProduct.name}</CardTitle>
                    <p className="text-sm text-muted-foreground font-mono mt-1">SKU: {foundProduct.sku}</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate(`/inventory/products/${foundProduct.id}`)}>
                    <ExternalLink className="h-3.5 w-3.5" />
                    Full Details
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <Package className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-2xl font-bold">{foundProduct.stockOnHand}</p>
                      <p className="text-xs text-muted-foreground">On Hand</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <DollarSign className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-2xl font-bold">₹{foundProduct.costPrice.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Cost Price</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <TrendingUp className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-2xl font-bold">₹{foundProduct.salePrice.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Sale Price</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <Layers className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-2xl font-bold">{foundProduct.reorderLevel}</p>
                      <p className="text-xs text-muted-foreground">Reorder Level</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Category:</span>
                      <Badge variant="secondary" className="ml-2">{foundProduct.category}</Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <Badge variant="outline" className="ml-2 capitalize">{foundProduct.type}</Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cost Method:</span>
                      <span className="ml-2 font-medium uppercase">{foundProduct.costMethod}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">UoM:</span>
                      <span className="ml-2 font-medium">{foundProduct.unitOfMeasure}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Track Lots:</span>
                      {foundProduct.trackLots ? <Check className="h-4 w-4 text-success" /> : <X className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Track Serials:</span>
                      {foundProduct.trackSerials ? <Check className="h-4 w-4 text-success" /> : <X className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Stock Status Banner */}
                  <div className={cn(
                    'rounded-lg p-3 flex items-center gap-3',
                    stockStatus === 'ok' && 'bg-success/10',
                    stockStatus === 'low' && 'bg-warning/10',
                    stockStatus === 'out' && 'bg-destructive/10',
                  )}>
                    {stockStatus === 'ok' && <><Check className="h-5 w-5 text-success" /><span className="font-medium text-success">In Stock</span></>}
                    {stockStatus === 'low' && <><AlertTriangle className="h-5 w-5 text-warning" /><span className="font-medium text-warning">Low Stock — Below reorder level</span></>}
                    {stockStatus === 'out' && <><TrendingDown className="h-5 w-5 text-destructive" /><span className="font-medium text-destructive">Out of Stock</span></>}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Movements */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Recent Stock Movements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentMoves.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No recent movements</p>
                  ) : (
                    <div className="space-y-2">
                      {recentMoves.map((move) => (
                        <div key={move.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize text-xs">{move.operationType}</Badge>
                            <span className="text-sm font-medium">{move.reference}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={move.state === 'done' ? 'secondary' : 'default'} className="capitalize text-xs">{move.state}</Badge>
                            <span className="text-xs text-muted-foreground">{format(new Date(move.scheduledDate), 'MMM d')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: Barcode & Quick Actions */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Barcode</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <InlineBarcodePreview value={foundProduct.barcode || foundProduct.sku} />
                  <p className="text-xs text-muted-foreground mt-2 font-mono">{foundProduct.barcode || foundProduct.sku}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate(`/inventory/products/${foundProduct.id}`)}>
                    <Package className="h-4 w-4" />
                    Edit Product
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate('/inventory/barcode-labels')}>
                    <ScanLine className="h-4 w-4" />
                    Print Label
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate('/inventory/adjustments')}>
                    <MapPin className="h-4 w-4" />
                    Adjust Stock
                  </Button>
                </CardContent>
              </Card>

              {/* Stock Value */}
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground">Total Stock Value</p>
                  <p className="text-3xl font-bold mt-1">₹{(foundProduct.stockOnHand * foundProduct.costPrice).toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Scan History */}
        {scanHistory.length > 0 && !foundProduct && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Scan History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {scanHistory.map((entry, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/30 cursor-pointer hover:bg-muted/50"
                    onClick={() => entry.product && (setFoundProduct(entry.product), setRecentMoves(getStockMoves().filter(m => m.lines.some(l => l.productId === entry.product!.id)).slice(0, 5)))}
                  >
                    <div className="flex items-center gap-2">
                      {entry.product ? <Package className="h-4 w-4 text-primary" /> : <AlertTriangle className="h-4 w-4 text-destructive" />}
                      <span className="text-sm font-medium">{entry.product?.name || entry.barcode}</span>
                      <span className="text-xs text-muted-foreground font-mono">{entry.barcode}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{format(entry.time, 'HH:mm:ss')}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!foundProduct && scanHistory.length === 0 && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <ScanLine className="h-16 w-16 text-primary mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Ready to Scan</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Scan a product barcode with your scanner, or type a barcode/SKU/product name above to instantly view details, stock levels, and pricing.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
