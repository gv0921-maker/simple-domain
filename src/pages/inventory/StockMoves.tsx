import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Search,
  Plus,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from 'lucide-react';
import { getProducts, getWarehouses, type Product } from '@/lib/data/inventory';
import { INVENTORY_NAV } from '@/lib/navigation';
import { getItem, setItem } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface StockMoveRecord {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  moveType: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  previousQty: number;
  newQty: number;
  sourceLocation: string;
  destinationLocation: string;
  reference?: string;
  lotNumber?: string;
  serialNumber?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

const DEFAULT_STOCK_MOVES: StockMoveRecord[] = [];

function getStockMoves(): StockMoveRecord[] {
  return getItem<StockMoveRecord[]>('stock_moves', DEFAULT_STOCK_MOVES);
}

function saveStockMove(move: StockMoveRecord): void {
  const moves = getStockMoves();
  moves.unshift({ ...move, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
  setItem('stock_moves', moves);
}

const MOVE_TYPE_CONFIG = {
  in: { label: 'Receipt', icon: TrendingUp, className: 'text-success' },
  out: { label: 'Delivery', icon: TrendingDown, className: 'text-destructive' },
  adjustment: { label: 'Adjustment', icon: RefreshCw, className: 'text-warning' },
  transfer: { label: 'Transfer', icon: ArrowRight, className: 'text-info' },
};

export default function StockMoves() {
  const { toast } = useToast();
  const [moves, setMoves] = useState<StockMoveRecord[]>(getStockMoves());
  const [products] = useState<Product[]>(getProducts());
  const [warehouses] = useState(getWarehouses());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    moveType: 'adjustment' as 'in' | 'out' | 'adjustment' | 'transfer',
    quantity: '',
    sourceLocation: '',
    destinationLocation: '',
    lotNumber: '',
    serialNumber: '',
    notes: '',
  });

  const filteredMoves = useMemo(() => {
    return moves.filter((m) => {
      const matchesSearch =
        m.productName.toLowerCase().includes(search.toLowerCase()) ||
        m.productSku.toLowerCase().includes(search.toLowerCase()) ||
        m.reference?.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || m.moveType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [moves, search, typeFilter]);

  const stats = useMemo(() => {
    return {
      totalMoves: moves.length,
      receipts: moves.filter((m) => m.moveType === 'in').length,
      deliveries: moves.filter((m) => m.moveType === 'out').length,
      adjustments: moves.filter((m) => m.moveType === 'adjustment').length,
    };
  }, [moves]);

  const handleCreateAdjustment = () => {
    const product = products.find((p) => p.id === formData.productId);
    if (!product || !formData.quantity) {
      toast({
        title: 'Validation Error',
        description: 'Please select a product and enter quantity',
        variant: 'destructive',
      });
      return;
    }

    const qty = parseInt(formData.quantity);
    const newMove: StockMoveRecord = {
      id: '',
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      moveType: formData.moveType,
      quantity: qty,
      previousQty: product.stockOnHand,
      newQty: formData.moveType === 'out' ? product.stockOnHand - Math.abs(qty) : product.stockOnHand + Math.abs(qty),
      sourceLocation: formData.sourceLocation || 'GLF/Stock',
      destinationLocation: formData.destinationLocation || 'GLF/Stock',
      lotNumber: formData.lotNumber || undefined,
      serialNumber: formData.serialNumber || undefined,
      notes: formData.notes || undefined,
      createdBy: 'Current User',
      createdAt: '',
    };

    saveStockMove(newMove);
    setMoves(getStockMoves());
    setIsDialogOpen(false);
    setFormData({
      productId: '',
      moveType: 'adjustment',
      quantity: '',
      sourceLocation: '',
      destinationLocation: '',
      lotNumber: '',
      serialNumber: '',
      notes: '',
    });
    toast({
      title: 'Stock Move Created',
      description: `${product.name} stock ${formData.moveType === 'out' ? 'reduced' : 'increased'} by ${Math.abs(qty)}`,
    });
  };

  return (
    <AppLayout title="Inventory" moduleNav={INVENTORY_NAV}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Stock Moves</h1>
            <p className="text-muted-foreground">Track all inventory movements and adjustments</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Stock Move
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create Stock Move</DialogTitle>
                <DialogDescription>
                  Record a new inventory movement or adjustment
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Product *</Label>
                  <Select
                    value={formData.productId}
                    onValueChange={(v) => setFormData({ ...formData, productId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          [{p.sku}] {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Move Type *</Label>
                  <Select
                    value={formData.moveType}
                    onValueChange={(v) => setFormData({ ...formData, moveType: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">Receipt (In)</SelectItem>
                      <SelectItem value="out">Delivery (Out)</SelectItem>
                      <SelectItem value="adjustment">Adjustment</SelectItem>
                      <SelectItem value="transfer">Internal Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder=""
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Source Location</Label>
                    <Select
                      value={formData.sourceLocation}
                      onValueChange={(v) => setFormData({ ...formData, sourceLocation: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((w) => (
                          <SelectItem key={w.id} value={`${w.code}/Stock`}>
                            {w.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="Vendor">Vendor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Destination</Label>
                    <Select
                      value={formData.destinationLocation}
                      onValueChange={(v) => setFormData({ ...formData, destinationLocation: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((w) => (
                          <SelectItem key={w.id} value={`${w.code}/Stock`}>
                            {w.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="Customer">Customer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Lot Number</Label>
                    <Input
                      value={formData.lotNumber}
                      onChange={(e) => setFormData({ ...formData, lotNumber: e.target.value })}
                      placeholder=""
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Serial Number</Label>
                    <Input
                      value={formData.serialNumber}
                      onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                      placeholder=""
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Notes</Label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder=""
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAdjustment}>Create Move</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="animate-slide-up" style={{ animationDelay: '0ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Moves</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMoves}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '50ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />
                Receipts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.receipts}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-destructive" />
                Deliveries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.deliveries}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-warning" />
                Adjustments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.adjustments}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder=""
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="in">Receipts</SelectItem>
              <SelectItem value="out">Deliveries</SelectItem>
              <SelectItem value="adjustment">Adjustments</SelectItem>
              <SelectItem value="transfer">Transfers</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card className="animate-fade-in">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>From → To</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Before</TableHead>
                <TableHead className="text-right">After</TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMoves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No stock moves found
                  </TableCell>
                </TableRow>
              ) : (
                filteredMoves.map((move, index) => {
                  const config = MOVE_TYPE_CONFIG[move.moveType];
                  const Icon = config.icon;
                  return (
                    <TableRow
                      key={move.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(move.createdAt), 'dd MMM yyyy, HH:mm')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{move.productName}</div>
                          <div className="text-sm text-muted-foreground">{move.productSku}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={cn('flex items-center gap-1.5', config.className)}>
                          <Icon className="h-4 w-4" />
                          <span className="text-sm font-medium">{config.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {move.sourceLocation} → {move.destinationLocation}
                      </TableCell>
                      <TableCell className={cn('text-right font-medium', config.className)}>
                        {move.moveType === 'out' ? '-' : '+'}{Math.abs(move.quantity)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {move.previousQty}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {move.newQty}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {move.reference || move.lotNumber || '-'}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AppLayout>
  );
}
