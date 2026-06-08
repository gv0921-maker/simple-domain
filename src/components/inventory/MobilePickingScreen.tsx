import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Check,
  ChevronRight,
  Package,
  MapPin,
  ScanLine,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  MoreHorizontal,
} from 'lucide-react';
import { BarcodeScanner } from './BarcodeScanner';
import { useStockMove, useSaveStockMove, useValidateStockMove, useProducts } from '@/hooks/inventory';
import type { StockMove, StockMoveLine } from '@/lib/services/inventory';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface MobilePickingScreenProps {
  stockMoveId: string;
  onComplete?: () => void;
  onBack?: () => void;
}

export function MobilePickingScreen({ stockMoveId, onComplete, onBack }: MobilePickingScreenProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: loadedMove } = useStockMove(stockMoveId);
  const [stockMove, setStockMove] = useState<StockMove | undefined>(undefined);
  const { data: products = [] } = useProducts();
  const saveMoveMut = useSaveStockMove();
  const validateMut = useValidateStockMove();

  // Sync local state with loaded move
  if (loadedMove && !stockMove) setStockMove(loadedMove);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [showScanner, setShowScanner] = useState(false);
  const [pickedLines, setPickedLines] = useState<Set<string>>(new Set());

  const currentLine = stockMove?.lines[currentLineIndex];
  const progress = stockMove ? (pickedLines.size / stockMove.lines.length) * 100 : 0;
  const allPicked = stockMove && pickedLines.size === stockMove.lines.length;

  const handleScan = (barcode: string, type: 'product' | 'location' | 'unknown') => {
    if (!currentLine || !stockMove) return;

    if (type === 'product') {
      const product = products.find(p => p.id === currentLine.productId);
      if (product?.barcode === barcode || product?.barcodes?.includes(barcode)) {
        // Correct product scanned
        markLinePicked(currentLine.id);
        toast({
          title: 'Item Picked',
          description: `${product.name} - ${currentLine.demandQty} ${currentLine.unitOfMeasure}`,
        });
      } else {
        toast({
          title: 'Wrong Product',
          description: `Expected: ${currentLine.productName}`,
          variant: 'destructive'
        });
      }
    }
    setShowScanner(false);
  };

  const markLinePicked = (lineId: string) => {
    const newPicked = new Set(pickedLines);
    newPicked.add(lineId);
    setPickedLines(newPicked);

    // Update the stock move line
    if (stockMove) {
      const updatedMove = { ...stockMove };
      const line = updatedMove.lines.find(l => l.id === lineId);
      if (line) {
        line.doneQty = line.demandQty;
      }
      saveMoveMut.mutate(updatedMove);
      setStockMove(updatedMove);
    }

    // Move to next unpicked line
    if (stockMove) {
      const nextUnpicked = stockMove.lines.findIndex((l, i) => i > currentLineIndex && !newPicked.has(l.id));
      if (nextUnpicked >= 0) {
        setCurrentLineIndex(nextUnpicked);
      }
    }
  };

  const handleValidate = () => {
    if (stockMove && user) {
      validateMut.mutate(stockMove.id, {
        onSuccess: () => {
          toast({ title: 'Picking Complete', description: `${stockMove.reference} has been validated` });
          onComplete?.();
        },
        onError: (e: any) => toast({ title: 'Validation failed', description: e?.message, variant: 'destructive' }),
      });
    }
  };

  if (!stockMove) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-lg font-medium">Stock move not found</p>
            <Button className="mt-4" onClick={() => navigate('/inventory/operations')}>
              Back to Operations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={onBack || (() => navigate(-1))}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h1 className="text-lg font-semibold">{stockMove.reference}</h1>
            <p className="text-sm text-muted-foreground capitalize">{stockMove.operationType}</p>
          </div>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Progress Bar */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{pickedLines.size}/{stockMove.lines.length} items</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Current Item Card */}
      {currentLine && !allPicked && (
        <div className="p-4">
          <Card className="border-2 border-primary">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-primary border-primary">
                  Item {currentLineIndex + 1} of {stockMove.lines.length}
                </Badge>
                <Badge className={cn(
                  pickedLines.has(currentLine.id)
                    ? 'bg-success text-success-foreground'
                    : 'bg-warning text-warning-foreground'
                )}>
                  {pickedLines.has(currentLine.id) ? 'Picked' : 'Pending'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Product Info */}
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold truncate">{currentLine.productName}</p>
                  <p className="text-sm text-muted-foreground font-mono">{currentLine.productSku}</p>
                  {currentLine.lotName && (
                    <Badge variant="secondary" className="mt-1">
                      Lot: {currentLine.lotName}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Quantity */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Quantity to Pick</span>
                  <span className="text-3xl font-bold text-primary">
                    {currentLine.demandQty} <span className="text-lg font-normal text-muted-foreground">{currentLine.unitOfMeasure}</span>
                  </span>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 p-3 bg-info/10 rounded-lg">
                <MapPin className="h-5 w-5 text-info" />
                <div>
                  <p className="text-sm font-medium">From Location</p>
                  <p className="text-muted-foreground">{stockMove.sourceLocationName}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto" />
                <div className="text-right">
                  <p className="text-sm font-medium">To Location</p>
                  <p className="text-muted-foreground">{stockMove.destinationLocationName}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14"
                  onClick={() => setShowScanner(true)}
                >
                  <ScanLine className="h-5 w-5 mr-2" />
                  Scan
                </Button>
                <Button
                  size="lg"
                  className="h-14"
                  onClick={() => markLinePicked(currentLine.id)}
                  disabled={pickedLines.has(currentLine.id)}
                >
                  <Check className="h-5 w-5 mr-2" />
                  Mark Picked
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* All Items Picked */}
      {allPicked && (
        <div className="p-4 flex-1 flex items-center justify-center">
          <Card className="w-full max-w-sm text-center">
            <CardContent className="pt-8 pb-6">
              <div className="h-16 w-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <h2 className="text-xl font-semibold mb-2">All Items Picked!</h2>
              <p className="text-muted-foreground mb-6">
                {stockMove.lines.length} items ready for validation
              </p>
              <Button size="lg" className="w-full h-14" onClick={handleValidate}>
                <Check className="h-5 w-5 mr-2" />
                Validate & Complete
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Items List */}
      <div className="p-4 flex-1">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">All Items</h3>
        <div className="space-y-2">
          {stockMove.lines.map((line, index) => (
            <Card
              key={line.id}
              className={cn(
                'cursor-pointer transition-all',
                index === currentLineIndex && !allPicked && 'ring-2 ring-primary',
                pickedLines.has(line.id) && 'opacity-60'
              )}
              onClick={() => !allPicked && setCurrentLineIndex(index)}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <Checkbox
                  checked={pickedLines.has(line.id)}
                  className="h-5 w-5"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{line.productName}</p>
                  <p className="text-sm text-muted-foreground">
                    {line.demandQty} {line.unitOfMeasure}
                    {line.lotName && ` • Lot: ${line.lotName}`}
                  </p>
                </div>
                {pickedLines.has(line.id) ? (
                  <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                ) : (
                  <Clock className="h-5 w-5 text-warning flex-shrink-0" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Scanner Sheet */}
      <Sheet open={showScanner} onOpenChange={setShowScanner}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>Scan Product</SheetTitle>
            <SheetDescription>
              Scan the barcode of {currentLine?.productName}
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
