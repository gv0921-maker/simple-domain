import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { MANUFACTURING_NAV } from '@/lib/navigation/manufacturing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { getWorkOrders, updateWorkOrder, getWorkCenters, WorkOrder } from '@/lib/data/manufacturing';
import { Play, Pause, CheckCircle, Clock, Package, AlertTriangle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function ShopFloor() {
  const [workOrders, setWorkOrders] = useState(getWorkOrders().filter(wo => 
    wo.status === 'confirmed' || wo.status === 'in_progress'
  ));
  const workCenters = getWorkCenters();
  const [progressDialog, setProgressDialog] = useState<{ open: boolean; order: WorkOrder | null }>({ open: false, order: null });
  const [newProgress, setNewProgress] = useState(0);

  const handleStart = (wo: WorkOrder) => {
    updateWorkOrder(wo.id, { 
      status: 'in_progress',
      actualStart: new Date().toISOString().split('T')[0]
    });
    setWorkOrders(getWorkOrders().filter(w => w.status === 'confirmed' || w.status === 'in_progress'));
    toast.success(`Started work order ${wo.name}`);
  };

  const handleComplete = (wo: WorkOrder) => {
    updateWorkOrder(wo.id, { 
      status: 'done',
      progress: 100,
      actualEnd: new Date().toISOString().split('T')[0]
    });
    setWorkOrders(getWorkOrders().filter(w => w.status === 'confirmed' || w.status === 'in_progress'));
    toast.success(`Completed work order ${wo.name}`);
  };

  const handleUpdateProgress = () => {
    if (!progressDialog.order) return;
    updateWorkOrder(progressDialog.order.id, { progress: newProgress });
    setWorkOrders(getWorkOrders().filter(w => w.status === 'confirmed' || w.status === 'in_progress'));
    setProgressDialog({ open: false, order: null });
    toast.success('Progress updated');
  };

  const openProgressDialog = (wo: WorkOrder) => {
    setNewProgress(wo.progress);
    setProgressDialog({ open: true, order: wo });
  };

  const inProgress = workOrders.filter(wo => wo.status === 'in_progress');
  const waiting = workOrders.filter(wo => wo.status === 'confirmed');

  return (
    <AppLayout title="Manufacturing" subtitle="Shop Floor" moduleNav={MANUFACTURING_NAV}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Shop Floor Control</h1>
            <p className="text-muted-foreground">Real-time production monitoring and control</p>
          </div>
          <Button variant="outline" onClick={() => setWorkOrders(getWorkOrders().filter(wo => 
            wo.status === 'confirmed' || wo.status === 'in_progress'
          ))}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Work Centers Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {workCenters.filter(wc => wc.isActive).slice(0, 4).map((wc) => {
            const activeOrders = inProgress.filter(wo => wo.workCenterId === wc.id);
            return (
              <Card key={wc.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{wc.name}</span>
                    <Badge variant={activeOrders.length > 0 ? 'default' : 'secondary'}>
                      {activeOrders.length > 0 ? 'Running' : 'Idle'}
                    </Badge>
                  </div>
                  <Progress value={wc.currentLoad} className="h-2 mb-1" />
                  <span className="text-xs text-muted-foreground">{wc.currentLoad}% load</span>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* In Progress */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Play className="h-5 w-5 text-success" />
                In Progress ({inProgress.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inProgress.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No orders in progress</p>
                ) : (
                  inProgress.map((wo) => (
                    <div key={wo.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{wo.name}</span>
                            <Badge variant={wo.priority === 'urgent' ? 'destructive' : wo.priority === 'high' ? 'default' : 'outline'}>
                              {wo.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{wo.productName}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{wo.progress}%</div>
                          <div className="text-xs text-muted-foreground">{wo.quantity} units</div>
                        </div>
                      </div>
                      
                      <Progress value={wo.progress} className="h-3 mb-3" />
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Started: {wo.actualStart}
                        </span>
                        <span>{wo.workCenterName}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => openProgressDialog(wo)}>
                          Update Progress
                        </Button>
                        <Button size="sm" className="flex-1" onClick={() => handleComplete(wo)}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Complete
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Waiting to Start */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Pause className="h-5 w-5 text-warning" />
                Waiting to Start ({waiting.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {waiting.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No orders waiting</p>
                ) : (
                  waiting.map((wo) => {
                    const isLate = new Date(wo.scheduledStart) < new Date();
                    return (
                      <div key={wo.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{wo.name}</span>
                              {isLate && <AlertTriangle className="h-4 w-4 text-destructive" />}
                              <Badge variant={wo.priority === 'urgent' ? 'destructive' : wo.priority === 'high' ? 'default' : 'outline'}>
                                {wo.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{wo.productName}</p>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Package className="h-4 w-4" />
                            {wo.quantity} units
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                          <span>Scheduled: {wo.scheduledStart}</span>
                          <span>{wo.workCenterName}</span>
                        </div>
                        
                        <Button size="sm" className="w-full" onClick={() => handleStart(wo)}>
                          <Play className="h-4 w-4 mr-1" />
                          Start Production
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={progressDialog.open} onOpenChange={(open) => setProgressDialog({ open, order: progressDialog.order })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Progress</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Progress (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={newProgress}
                onChange={(e) => setNewProgress(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
              />
            </div>
            <Progress value={newProgress} className="h-3" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProgressDialog({ open: false, order: null })}>Cancel</Button>
            <Button onClick={handleUpdateProgress}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
