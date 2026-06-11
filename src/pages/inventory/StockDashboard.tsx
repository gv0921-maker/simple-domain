import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Warehouse,
  ArrowRight,
  BarChart3,
  DollarSign,
  Layers,
  Activity,
} from 'lucide-react';
import { useProducts, useWarehouses, useStockMoves } from '@/hooks/inventory';
import { useReservations } from '@/hooks/inventory/reservations';
import { useSalesOrders } from '@/hooks/sales';
import { INVENTORY_NAV } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PackageCheck } from 'lucide-react';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--info, 210 100% 50%))',
  'hsl(var(--warning, 38 92% 50%))',
  'hsl(var(--success, 142 76% 36%))',
  'hsl(var(--destructive))',
  'hsl(var(--muted-foreground))',
];

export default function StockDashboard() {
  const navigate = useNavigate();
  const { data: products = [] } = useProducts();
  const { data: warehouses = [] } = useWarehouses();
  const { data: moves = [] } = useStockMoves();
  const { data: reservations = [] } = useReservations();
  const { data: salesOrders = [] } = useSalesOrders();

  const data = useMemo(() => {
    const totalValue = products.reduce((sum, p) => sum + p.stockOnHand * p.costPrice, 0);
    const totalItems = products.reduce((sum, p) => sum + p.stockOnHand, 0);
    const lowStock = products.filter(p => p.stockOnHand > 0 && p.stockOnHand <= p.reorderLevel);
    const outOfStock = products.filter(p => p.stockOnHand === 0 && p.type === 'stockable');
    const recentMoves = moves.filter(m => m.state === 'done').sort((a, b) => new Date(b.effectiveDate || b.updatedAt).getTime() - new Date(a.effectiveDate || a.updatedAt).getTime()).slice(0, 10);

    // Category breakdown
    const categoryMap = new Map<string, { count: number; value: number; qty: number }>();
    products.forEach(p => {
      const entry = categoryMap.get(p.category) || { count: 0, value: 0, qty: 0 };
      entry.count++;
      entry.value += p.stockOnHand * p.costPrice;
      entry.qty += p.stockOnHand;
      categoryMap.set(p.category, entry);
    });
    const categoryData = Array.from(categoryMap.entries()).map(([name, d]) => ({ name, ...d })).sort((a, b) => b.value - a.value);

    // Stock by type
    const typeMap = new Map<string, number>();
    products.forEach(p => typeMap.set(p.type, (typeMap.get(p.type) || 0) + 1));
    const typeData = Array.from(typeMap.entries()).map(([name, value]) => ({ name, value }));

    return { products, warehouses, totalValue, totalItems, lowStock, outOfStock, recentMoves, categoryData, typeData };
  }, [products, warehouses, moves]);

  return (
    <AppLayout title="Inventory" moduleNav={INVENTORY_NAV}>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-primary" />
              Stock Tracking Dashboard
            </h1>
            <p className="text-muted-foreground">Real-time overview of inventory levels and movements</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Stock Value', value: `₹${(data.totalValue / 1000).toFixed(0)}K`, icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Total Items', value: data.totalItems.toLocaleString(), icon: Package, color: 'text-info', bg: 'bg-info/10' },
            { label: 'Low Stock Alerts', value: data.lowStock.length, icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
            { label: 'Out of Stock', value: data.outOfStock.length, icon: TrendingDown, color: 'text-destructive', bg: 'bg-destructive/10' },
          ].map((kpi, i) => (
            <Card key={i} className="animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', kpi.bg)}>
                    <kpi.icon className={cn('h-5 w-5', kpi.color)} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{kpi.value}</p>
                    <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock Value by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stock Value by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.categoryData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Value']} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Product Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Product Types</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={data.typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name} (${value})`}>
                    {data.typeData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Stock Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Low Stock Alerts
              </CardTitle>
              <CardDescription>{data.lowStock.length + data.outOfStock.length} products need attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...data.outOfStock, ...data.lowStock].slice(0, 6).map((product) => {
                  const pct = product.reorderLevel > 0 ? Math.min((product.stockOnHand / product.reorderLevel) * 100, 100) : 0;
                  return (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/inventory/products/${product.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium truncate">{product.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{product.stockOnHand}</span>
                            <span className="text-xs text-muted-foreground">/ {product.reorderLevel}</span>
                          </div>
                        </div>
                        <Progress
                          value={pct}
                          className={cn('h-2', product.stockOnHand === 0 ? '[&>div]:bg-destructive' : '[&>div]:bg-warning')}
                        />
                      </div>
                      {product.stockOnHand === 0 ? (
                        <Badge variant="destructive" className="text-xs shrink-0">Out</Badge>
                      ) : (
                        <Badge variant="outline" className="text-warning border-warning text-xs shrink-0">Low</Badge>
                      )}
                    </div>
                  );
                })}
                {data.lowStock.length + data.outOfStock.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">All products are well stocked</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Movements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Recent Stock Movements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.recentMoves.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No completed movements yet</p>
                ) : (
                  data.recentMoves.map((move) => (
                    <div key={move.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            'capitalize text-xs',
                            move.operationType === 'receipt' && 'border-success text-success',
                            move.operationType === 'delivery' && 'border-info text-info',
                            move.operationType === 'internal' && 'border-warning text-warning',
                          )}
                        >
                          {move.operationType}
                        </Badge>
                        <span className="text-sm font-medium">{move.reference}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{move.lines.length} items</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(move.effectiveDate || move.updatedAt), 'MMM d')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Warehouse Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Warehouse className="h-4 w-4" />
              Warehouses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {data.warehouses.map((wh) => (
                <div
                  key={wh.id}
                  className="p-4 border rounded-lg hover:shadow-md cursor-pointer transition-all"
                  onClick={() => navigate('/inventory/warehouses')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{wh.name}</h4>
                    <Badge variant={wh.isActive ? 'secondary' : 'outline'}>{wh.isActive ? 'Active' : 'Inactive'}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{wh.code} • {wh.address}</p>
                  <ArrowRight className="h-4 w-4 text-muted-foreground mt-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stock Reservations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PackageCheck className="h-4 w-4" />
              Stock Reservations
            </CardTitle>
            <CardDescription>
              {reservations.filter((r) => r.status === 'reserved').length} active reservations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reservations.filter((r) => r.status === 'reserved').length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No active reservations</p>
            ) : (
              <div className="overflow-x-auto">
                <p className="md:hidden text-xs text-muted-foreground mb-2">Scroll horizontally to see more →</p>
                <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Sales Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Serial / Lot</TableHead>
                    <TableHead>Reserved</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservations.filter((r) => r.status === 'reserved').map((r) => {
                    const so: any = (salesOrders as any[]).find((o) => o.id === r.salesOrderId);
                    const product = products.find((p) => p.id === r.productId);
                    return (
                      <TableRow
                        key={r.id}
                        className="cursor-pointer hover:bg-muted/40"
                        onClick={() => so && navigate(`/sales/orders/${so.id}`)}
                      >
                        <TableCell className="font-medium">{so?.reference || r.salesOrderId.slice(0, 8)}</TableCell>
                        <TableCell>{so?.customerName || '—'}</TableCell>
                        <TableCell>{product?.name || '—'}</TableCell>
                        <TableCell className="text-right">{r.quantity}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {r.serialNumberId ? r.serialNumberId.slice(0, 8) : r.lotId ? r.lotId.slice(0, 8) : '—'}
                        </TableCell>
                        <TableCell>{format(new Date(r.reservedAt), 'MMM d, yyyy')}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
