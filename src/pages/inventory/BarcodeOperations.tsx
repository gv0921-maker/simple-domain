import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  ScanLine,
  Package,
  Truck,
  ArrowLeftRight,
  ClipboardCheck,
  MapPin,
  ChevronRight,
  Smartphone,
  History,
} from 'lucide-react';
import { BarcodeScanner } from '@/components/inventory/BarcodeScanner';
import { MobilePickingScreen } from '@/components/inventory/MobilePickingScreen';
import { MobileCountScreen } from '@/components/inventory/MobileCountScreen';
import { useStockMoves, useWarehouses, useLocations } from '@/hooks/inventory';
import type { StockMove, BarcodeOperation } from '@/lib/services/inventory';
import { BARCODE_NAV } from '@/lib/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type OperationMode = 'menu' | 'receive' | 'pick' | 'transfer' | 'count';

const OPERATION_CARDS = [
  {
    id: 'receive',
    title: 'Receive',
    description: 'Scan items for incoming shipments',
    icon: Package,
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  {
    id: 'pick',
    title: 'Pick',
    description: 'Pick items for outgoing orders',
    icon: Truck,
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  {
    id: 'transfer',
    title: 'Transfer',
    description: 'Move items between locations',
    icon: ArrowLeftRight,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  {
    id: 'count',
    title: 'Count',
    description: 'Perform inventory count',
    icon: ClipboardCheck,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
];

export default function BarcodeOperations() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<OperationMode>('menu');
  const [selectedMoveId, setSelectedMoveId] = useState<string | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [showScanner, setShowScanner] = useState(false);
  const { data: allMoves = [] } = useStockMoves();
  const { data: warehouses = [] } = useWarehouses();
  const { data: locations = [] } = useLocations();
  const pendingMoves = allMoves.filter(m => m.state !== 'done' && m.state !== 'cancelled');
  const recentOperations: BarcodeOperation[] = [];

  const handleOperationSelect = (op: string) => {
    if (op === 'pick') {
      // Show pending delivery moves
      const deliveryMoves = pendingMoves.filter(m => m.operationType === 'delivery');
      if (deliveryMoves.length > 0) {
        setSelectedMoveId(deliveryMoves[0].id);
        setMode('pick');
      } else {
        toast({ title: 'No pending deliveries', description: 'There are no delivery orders waiting to be picked.', variant: 'destructive' });
      }
    } else if (op === 'receive') {
      const receiptMoves = pendingMoves.filter(m => m.operationType === 'receipt');
      if (receiptMoves.length > 0) {
        setSelectedMoveId(receiptMoves[0].id);
        setMode('receive');
      } else {
        toast({
          title: 'No pending receipts',
          description: 'There are no receipt orders waiting.',
        });
        setMode('receive');
        setShowScanner(true);
      }
    } else if (op === 'count') {
      setMode('count');
    } else if (op === 'transfer') {
      const transferMoves = pendingMoves.filter(m => m.operationType === 'internal');
      if (transferMoves.length > 0) {
        setSelectedMoveId(transferMoves[0].id);
        setMode('transfer');
      } else {
        toast({
          title: 'No pending transfers',
          description: 'There are no internal transfers waiting.',
        });
      }
    }
  };

  const handleScan = (barcode: string, type: 'product' | 'location' | 'unknown') => {
    toast({
      title: `Scanned: ${barcode}`,
      description: `Type: ${type}`,
    });
    setShowScanner(false);
  };

  // Mobile picking view
  if (mode === 'pick' && selectedMoveId) {
    return (
      <MobilePickingScreen
        stockMoveId={selectedMoveId}
        onComplete={() => {
          setMode('menu');
          setSelectedMoveId(null);
          // pending moves auto-refresh via hooks cache invalidation
        }}
        onBack={() => {
          setMode('menu');
          setSelectedMoveId(null);
        }}
      />
    );
  }

  // Mobile count view
  if (mode === 'count' && selectedLocationId) {
    return (
      <MobileCountScreen
        locationId={selectedLocationId}
        onComplete={() => {
          setMode('menu');
          setSelectedLocationId('');
        }}
        onBack={() => {
          setMode('menu');
          setSelectedLocationId('');
        }}
      />
    );
  }

  return (
    <AppLayout title="Barcode" moduleNav={BARCODE_NAV}>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
              <ScanLine className="h-6 w-6 text-primary" />
              Barcode Operations
            </h1>
            <p className="text-muted-foreground">Mobile-friendly scanning for warehouse operations</p>
          </div>
          <Button
            size="lg"
            className="gap-2"
            onClick={() => setShowScanner(true)}
          >
            <ScanLine className="h-5 w-5" />
            Quick Scan
          </Button>
        </div>

        {/* Operation Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {OPERATION_CARDS.map((op, index) => (
            <Card
              key={op.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] animate-slide-up',
                'active:scale-[0.98]'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => handleOperationSelect(op.id)}
            >
              <CardContent className="pt-6 pb-4 text-center">
                <div className={cn('h-14 w-14 rounded-xl mx-auto mb-3 flex items-center justify-center', op.bgColor)}>
                  <op.icon className={cn('h-7 w-7', op.color)} />
                </div>
                <h3 className="font-semibold text-lg">{op.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{op.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pending Operations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Pending Operations
            </CardTitle>
            <CardDescription>
              {pendingMoves.length} operations waiting for processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingMoves.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No pending operations</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingMoves.slice(0, 5).map((move) => (
                  <div
                    key={move.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedMoveId(move.id);
                      setMode(move.operationType === 'delivery' ? 'pick' : move.operationType === 'receipt' ? 'receive' : 'transfer');
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'h-10 w-10 rounded-lg flex items-center justify-center',
                        move.operationType === 'receipt' && 'bg-success/10',
                        move.operationType === 'delivery' && 'bg-info/10',
                        move.operationType === 'internal' && 'bg-warning/10',
                      )}>
                        {move.operationType === 'receipt' && <Package className="h-5 w-5 text-success" />}
                        {move.operationType === 'delivery' && <Truck className="h-5 w-5 text-info" />}
                        {move.operationType === 'internal' && <ArrowLeftRight className="h-5 w-5 text-warning" />}
                      </div>
                      <div>
                        <p className="font-medium">{move.reference}</p>
                        <p className="text-sm text-muted-foreground">
                          {move.lines.length} items • {format(new Date(move.scheduledDate), 'MMM d, HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {move.state}
                      </Badge>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location Selection for Count */}
        {mode === 'count' && !selectedLocationId && (
          <Card>
            <CardHeader>
              <CardTitle>Select Location to Count</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select onValueChange={setSelectedLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.filter(l => l.type === 'internal').map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {loc.name} ({loc.code})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="w-full"
                onClick={() => setMode('menu')}
                variant="outline"
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Recent Operations */}
        {recentOperations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Operations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentOperations.map((op) => (
                  <div key={op.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">{op.type}</Badge>
                      <span className="text-sm">{op.scannedItems.length} items scanned</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(op.startedAt), 'MMM d, HH:mm')}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mobile Tip */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Mobile Optimized</h3>
                <p className="text-sm text-muted-foreground">
                  This page is optimized for mobile devices. Connect a barcode scanner or use your device's camera to scan items quickly.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Scanner Sheet */}
      <Sheet open={showScanner} onOpenChange={setShowScanner}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>Quick Scan</SheetTitle>
            <SheetDescription>
              Scan any barcode to identify products or locations
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <BarcodeScanner onScan={handleScan} />
          </div>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
