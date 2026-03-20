import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { SimpleBarChart } from '@/components/dashboard/SimpleBarChart';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronLeft, ChevronRight, Settings, MoreVertical, Warehouse, Package, ArrowLeftRight, BarChart3 } from 'lucide-react';
import { getProducts, getTransfers, getWarehouses } from '@/lib/data/inventory';
import { INVENTORY_NAV } from '@/lib/navigation';
import { useMemo } from 'react';

const DASHBOARD_CARDS = [
  {
    title: 'NEW ITEMS RECEIVED',
    badge: { label: 'To Receive', count: 4, variant: 'default' as const },
    stats: [
      { label: 'Late', value: 2, type: 'late' as const },
      { label: 'Back Orders', value: 1, type: 'backorder' as const },
      { label: 'Operations', value: 7 },
    ],
    chartData: [
      { value: 40, color: 'coral' as const },
      { value: 45, color: 'coral' as const },
      { value: 35, color: 'coral' as const },
      { value: 80, color: 'orange' as const },
    ],
  },
  {
    title: 'ITEM - ESTIMATE',
    badge: { label: 'Open', count: 1, variant: 'default' as const },
    stats: [
      { label: 'Waiting', value: 36 },
      { label: 'Late', value: 8, type: 'late' as const },
      { label: 'Back Orders', value: 4, type: 'backorder' as const },
    ],
    chartData: [
      { value: 60, color: 'coral' as const },
      { value: 10, color: 'orange' as const },
      { value: 15, color: 'teal' as const },
      { value: 90, color: 'teal' as const },
    ],
  },
  {
    title: 'DELIVERY NOTE',
    badge: { label: 'Open', count: 1, variant: 'default' as const },
    stats: [
      { label: 'Waiting', value: 1 },
    ],
    chartData: [
      { value: 70, color: 'teal' as const },
      { value: 50, color: 'teal' as const },
    ],
  },
  {
    title: 'ORDERS',
    badge: { label: 'To Receive', count: 44, variant: 'default' as const },
    stats: [
      { label: 'Late', value: 14, type: 'late' as const },
      { label: 'Operations', value: 92 },
    ],
    chartData: [
      { value: 30, color: 'coral' as const },
      { value: 20, color: 'orange' as const },
      { value: 40, color: 'orange' as const },
      { value: 100, color: 'teal' as const },
    ],
  },
  {
    title: 'RETURNS',
    badge: { label: 'Open', count: 1, variant: 'default' as const },
    stats: [],
    chartData: [],
  },
  {
    title: 'KADRI - ITEM ESTIMATE',
    badge: { label: 'Open', count: 1, variant: 'default' as const },
    stats: [],
    chartData: [],
  },
];

export default function InventoryOverview() {
  const navigate = useNavigate();
  
  const stats = useMemo(() => {
    const products = getProducts();
    const transfers = getTransfers();
    const warehouses = getWarehouses();
    
    return {
      totalProducts: products.length,
      lowStock: products.filter(p => p.stockOnHand <= p.reorderLevel && p.stockOnHand > 0).length,
      outOfStock: products.filter(p => p.stockOnHand === 0).length,
      pendingTransfers: transfers.filter(t => t.status === 'waiting').length,
      warehouseCount: warehouses.length,
      totalValue: products.reduce((sum, p) => sum + p.stockOnHand * p.costPrice, 0),
    };
  }, []);

  return (
    <AppLayout title="Inventory" moduleNav={INVENTORY_NAV}>
      <div className="p-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-medium text-foreground">Inventory Overview</h1>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative flex-1 sm:w-64 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="" className="pl-9" />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
              <span className="hidden sm:inline">1-7 / 7</span>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div 
            className="bg-card rounded-lg border border-border p-4 cursor-pointer hover:shadow-md transition-shadow animate-slide-up"
            onClick={() => navigate('/inventory/products')}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
                <p className="text-sm text-muted-foreground">Total Products</p>
              </div>
            </div>
          </div>
          <div 
            className="bg-card rounded-lg border border-border p-4 cursor-pointer hover:shadow-md transition-shadow animate-slide-up"
            style={{ animationDelay: '50ms' }}
            onClick={() => navigate('/inventory/warehouses')}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                <Warehouse className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.warehouseCount}</p>
                <p className="text-sm text-muted-foreground">Warehouses</p>
              </div>
            </div>
          </div>
          <div 
            className="bg-card rounded-lg border border-border p-4 cursor-pointer hover:shadow-md transition-shadow animate-slide-up"
            style={{ animationDelay: '100ms' }}
            onClick={() => navigate('/inventory/operations')}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <ArrowLeftRight className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingTransfers}</p>
                <p className="text-sm text-muted-foreground">Pending Transfers</p>
              </div>
            </div>
          </div>
          <div 
            className="bg-card rounded-lg border border-border p-4 cursor-pointer hover:shadow-md transition-shadow animate-slide-up"
            style={{ animationDelay: '150ms' }}
            onClick={() => navigate('/inventory/reporting')}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">₹{(stats.totalValue / 1000).toFixed(0)}K</p>
                <p className="text-sm text-muted-foreground">Stock Value</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DASHBOARD_CARDS.map((card, index) => (
            <div
              key={card.title}
              className="animate-slide-up cursor-pointer"
              style={{ animationDelay: `${(index + 4) * 75}ms` }}
              onClick={() => navigate('/inventory/operations')}
            >
              <div className="bg-card rounded-lg border border-border p-4 h-full flex flex-col relative hover:shadow-md transition-shadow">
                {/* Colored left border */}
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg bg-destructive" />
                
                {/* Header with menu */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-sm font-semibold text-primary uppercase tracking-wide pl-2">
                    {card.title}
                  </h3>
                  <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-1" onClick={(e) => e.stopPropagation()}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>

                {/* Content */}
                <div className="flex items-start gap-4 pl-2 flex-1">
                  {/* Badge */}
                  <Badge className="bg-primary text-primary-foreground">
                    {card.badge.count} {card.badge.label}
                  </Badge>

                  {/* Stats */}
                  {card.stats.length > 0 && (
                    <div className="text-sm space-y-0.5">
                      {card.stats.map((stat) => (
                        <div key={stat.label} className="flex justify-between gap-3">
                          <span className={
                            stat.type === 'late' 
                              ? 'text-destructive' 
                              : stat.type === 'backorder' 
                              ? 'text-warning'
                              : 'text-muted-foreground'
                          }>
                            {stat.label}
                          </span>
                          <span className="font-medium text-foreground">{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chart */}
                {card.chartData.length > 0 && (
                  <div className="mt-4 pl-2">
                    <SimpleBarChart data={card.chartData} height={80} />
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* GLF Factory card (empty/placeholder) */}
          <div className="animate-slide-up" style={{ animationDelay: '750ms' }}>
            <div className="bg-card rounded-lg border border-border p-4 h-full relative cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/inventory/warehouses')}>
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg bg-primary" />
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wide pl-2">
                GLF FACTORY
              </h3>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
