import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Plus,
  Minus,
  Check,
  Package,
  MapPin,
  ScanLine,
  AlertCircle,
  ArrowLeft,
  Save,
} from 'lucide-react';
import { BarcodeScanner } from './BarcodeScanner';
import { useProducts, useLocations, useAdjustment, useSaveAdjustment } from '@/hooks/inventory';
import type { InventoryAdjustment, AdjustmentLine } from '@/lib/services/inventory';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface MobileCountScreenProps {
  adjustmentId?: string;
  locationId: string;
  onComplete?: () => void;
  onBack?: () => void;
}

export function MobileCountScreen({ adjustmentId, locationId, onComplete, onBack }: MobileCountScreenProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: locations = [] } = useLocations();
  const { data: products = [] } = useProducts();
  const { data: loadedAdjustment } = useAdjustment(adjustmentId);
  const saveMut = useSaveAdjustment();
  const location = locations.find(l => l.id === locationId);
  
  const [adjustment, setAdjustment] = useState<InventoryAdjustment>(() => createNewAdjustment());
  useEffect(() => {
    if (loadedAdjustment && adjustment.id === '' && adjustmentId) {
      setAdjustment(loadedAdjustment);
    }
  }, [loadedAdjustment, adjustment.id, adjustmentId]);
  const [showScanner, setShowScanner] = useState(false);

  function createNewAdjustment(): InventoryAdjustment {
    return {
      id: '',
      reference: '',
      locationId,
      locationName: location?.name || '',
      reason: 'count',
      status: 'draft',
      lines: [],
      createdBy: user?.name || 'Unknown',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const handleScan = (barcode: string, type: 'product' | 'location' | 'unknown') => {
    if (type === 'product') {
      const product = products.find(p => p.id === barcode) ||
        products.find(p => p.barcode === barcode || p.barcodes?.includes(barcode));
      
      if (product) {
        const existingLine = adjustment.lines.find(l => l.productId === product.id);
        if (existingLine) {
          // Increment count
          updateLineCount(existingLine.id, existingLine.countedQty + 1);
        } else {
          // Add new line
          const newLine: AdjustmentLine = {
            id: crypto.randomUUID(),
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            theoreticalQty: product.stockOnHand,
            countedQty: 1,
            difference: 1 - product.stockOnHand,
            unitCost: product.costPrice,
            valueDifference: (1 - product.stockOnHand) * product.costPrice,
          };
          setAdjustment(prev => ({
            ...prev,
            lines: [...prev.lines, newLine],
            updatedAt: new Date().toISOString(),
          }));
        }
        toast({
          title: 'Product Scanned',
          description: product.name,
        });
      }
    }
    setShowScanner(false);
  };

  const updateLineCount = (lineId: string, newCount: number) => {
    setAdjustment(prev => ({
      ...prev,
      lines: prev.lines.map(line => {
        if (line.id === lineId) {
          const difference = newCount - line.theoreticalQty;
          return {
            ...line,
            countedQty: Math.max(0, newCount),
            difference,
            valueDifference: difference * line.unitCost,
          };
        }
        return line;
      }),
      updatedAt: new Date().toISOString(),
    }));
  };

  const removeLine = (lineId: string) => {
    setAdjustment(prev => ({
      ...prev,
      lines: prev.lines.filter(l => l.id !== lineId),
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleSave = () => {
    saveMut.mutate(adjustment, {
      onSuccess: () => {
        toast({ title: 'Count Saved', description: `${adjustment.lines.length} items counted` });
        onComplete?.();
      },
    });
  };

  const handleSubmit = () => {
    const updated = { ...adjustment, status: 'pending_approval' as const };
    saveMut.mutate(updated, {
      onSuccess: () => {
        toast({ title: 'Count Submitted', description: 'Waiting for approval' });
        onComplete?.();
      },
    });
  };

  const totalDifference = adjustment.lines.reduce((sum, l) => sum + l.difference, 0);
  const totalValueDiff = adjustment.lines.reduce((sum, l) => sum + l.valueDifference, 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={onBack || (() => navigate(-1))}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h1 className="text-lg font-semibold">Inventory Count</h1>
            <p className="text-sm text-muted-foreground">{location?.name}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSave}>
            <Save className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Scan Button */}
      <div className="p-4">
        <Button
          size="lg"
          className="w-full h-16 text-lg"
          onClick={() => setShowScanner(true)}
        >
          <ScanLine className="h-6 w-6 mr-3" />
          Scan Product
        </Button>
      </div>

      {/* Summary */}
      <div className="px-4">
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{adjustment.lines.length}</p>
                <p className="text-xs text-muted-foreground">Products</p>
              </div>
              <div>
                <p className={cn(
                  "text-2xl font-bold",
                  totalDifference > 0 && "text-success",
                  totalDifference < 0 && "text-destructive"
                )}>
                  {totalDifference > 0 ? '+' : ''}{totalDifference}
                </p>
                <p className="text-xs text-muted-foreground">Difference</p>
              </div>
              <div>
                <p className={cn(
                  "text-2xl font-bold",
                  totalValueDiff > 0 && "text-success",
                  totalValueDiff < 0 && "text-destructive"
                )}>
                  {totalValueDiff >= 0 ? '+' : ''}₹{Math.abs(totalValueDiff).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items List */}
      <div className="p-4 flex-1">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Counted Items</h3>
        {adjustment.lines.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No items scanned yet</p>
            <p className="text-sm">Scan a product barcode to start counting</p>
          </div>
        ) : (
          <div className="space-y-3">
            {adjustment.lines.map((line) => (
              <Card key={line.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-3 flex items-center gap-3">
                    <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{line.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        Expected: {line.theoreticalQty}
                        <span className={cn(
                          "ml-2 font-medium",
                          line.difference > 0 && "text-success",
                          line.difference < 0 && "text-destructive",
                          line.difference === 0 && "text-muted-foreground"
                        )}>
                          ({line.difference > 0 ? '+' : ''}{line.difference})
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between border-t border-border p-2 bg-muted/30">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-12 w-12"
                      onClick={() => updateLineCount(line.id, line.countedQty - 1)}
                    >
                      <Minus className="h-5 w-5" />
                    </Button>
                    <div className="flex-1 text-center">
                      <Input
                        type="number"
                        value={line.countedQty}
                        onChange={(e) => updateLineCount(line.id, parseInt(e.target.value) || 0)}
                        className="text-center text-xl font-bold h-12 w-24 mx-auto"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-12 w-12"
                      onClick={() => updateLineCount(line.id, line.countedQty + 1)}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      {adjustment.lines.length > 0 && (
        <div className="sticky bottom-0 p-4 bg-card border-t border-border">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="lg"
              className="h-14"
              onClick={handleSave}
            >
              <Save className="h-5 w-5 mr-2" />
              Save Draft
            </Button>
            <Button
              size="lg"
              className="h-14"
              onClick={handleSubmit}
            >
              <Check className="h-5 w-5 mr-2" />
              Submit
            </Button>
          </div>
        </div>
      )}

      {/* Scanner Sheet */}
      <Sheet open={showScanner} onOpenChange={setShowScanner}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>Scan Product</SheetTitle>
            <SheetDescription>
              Scan a product barcode to add or increment count
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <BarcodeScanner onScan={handleScan} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
