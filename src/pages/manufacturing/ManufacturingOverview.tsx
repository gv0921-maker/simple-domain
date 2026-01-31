import { AppLayout } from '@/components/layout/AppLayout';
import { MANUFACTURING_NAV } from '@/lib/navigation/manufacturing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getWorkOrders, getWorkCenters, getBOMs } from '@/lib/data/manufacturing';
import { Factory, ClipboardList, Cog, Layers, TrendingUp, Clock, AlertTriangle, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';

export default function ManufacturingOverview() {
  const navigate = useNavigate();
  const workOrders = getWorkOrders();
  const workCenters = getWorkCenters();
  const boms = getBOMs();

  const inProgress = workOrders.filter(wo => wo.status === 'in_progress');
  const confirmed = workOrders.filter(wo => wo.status === 'confirmed');
  const urgent = workOrders.filter(wo => wo.priority === 'urgent');
  const activeWorkCenters = workCenters.filter(wc => wc.isActive);
  const avgLoad = activeWorkCenters.reduce((sum, wc) => sum + wc.currentLoad, 0) / activeWorkCenters.length;

  const stats = [
    { label: 'Active Work Orders', value: inProgress.length, icon: ClipboardList, color: 'text-info' },
    { label: 'Pending Start', value: confirmed.length, icon: Clock, color: 'text-warning' },
    { label: 'Urgent Orders', value: urgent.length, icon: AlertTriangle, color: 'text-destructive' },
    { label: 'Active BOMs', value: boms.filter(b => b.status === 'active').length, icon: Layers, color: 'text-success' },
  ];

  return (
    <AppLayout title="Manufacturing" moduleNav={MANUFACTURING_NAV}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Manufacturing Overview</h1>
            <p className="text-muted-foreground">Monitor production and manage work orders</p>
          </div>
          <Button onClick={() => navigate('/manufacturing/work-orders/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Work Order
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Work Orders In Progress */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Work Orders In Progress</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/manufacturing/work-orders')}>
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inProgress.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No work orders in progress</p>
                ) : (
                  inProgress.map((wo) => (
                    <div
                      key={wo.id}
                      className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/manufacturing/work-orders/${wo.id}`)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-medium">{wo.name}</span>
                          <Badge variant={wo.priority === 'urgent' ? 'destructive' : wo.priority === 'high' ? 'default' : 'secondary'} className="ml-2">
                            {wo.priority}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">{wo.quantity} units</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{wo.productName}</p>
                      <div className="flex items-center gap-2">
                        <Progress value={wo.progress} className="flex-1 h-2" />
                        <span className="text-sm font-medium">{wo.progress}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Work Center Load */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Work Center Utilization</CardTitle>
              <Badge variant="outline">{Math.round(avgLoad)}% avg load</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeWorkCenters.map((wc) => (
                  <div key={wc.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{wc.name}</span>
                      <span className="text-sm text-muted-foreground">{wc.currentLoad}%</span>
                    </div>
                    <Progress
                      value={wc.currentLoad}
                      className={`h-2 ${wc.currentLoad > 80 ? '[&>div]:bg-destructive' : wc.currentLoad > 60 ? '[&>div]:bg-warning' : ''}`}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/manufacturing/work-orders')}>
            <div className="flex flex-col items-center gap-2">
              <ClipboardList className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium">Work Orders</span>
            </div>
          </Card>
          <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/manufacturing/bom')}>
            <div className="flex flex-col items-center gap-2">
              <Layers className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium">Bill of Materials</span>
            </div>
          </Card>
          <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/manufacturing/work-centers')}>
            <div className="flex flex-col items-center gap-2">
              <Cog className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium">Work Centers</span>
            </div>
          </Card>
          <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/shop-floor')}>
            <div className="flex flex-col items-center gap-2">
              <Factory className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium">Shop Floor</span>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
