import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { MANUFACTURING_NAV } from '@/lib/navigation/manufacturing';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { getWorkOrders, createWorkOrder, updateWorkOrder, deleteWorkOrder, getBOMs, getWorkCenters, WorkOrder } from '@/lib/data/manufacturing';
import { Plus, Search, Filter, Trash2, Edit, Play, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  confirmed: 'outline',
  in_progress: 'default',
  done: 'default',
  cancelled: 'destructive',
};

const priorityColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  low: 'secondary',
  normal: 'outline',
  high: 'default',
  urgent: 'destructive',
};

export default function WorkOrdersList() {
  const navigate = useNavigate();
  const [workOrders, setWorkOrders] = useState(getWorkOrders());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWO, setEditingWO] = useState<WorkOrder | null>(null);
  
  const boms = getBOMs();
  const workCenters = getWorkCenters();

  const [formData, setFormData] = useState({
    bomId: '',
    quantity: 1,
    priority: 'normal' as WorkOrder['priority'],
    scheduledStart: '',
    scheduledEnd: '',
    workCenterId: '',
  });

  const filteredOrders = workOrders.filter(wo => {
    const matchesSearch = wo.name.toLowerCase().includes(search.toLowerCase()) ||
                          wo.productName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || wo.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenDialog = (wo?: WorkOrder) => {
    if (wo) {
      setEditingWO(wo);
      setFormData({
        bomId: wo.bomId,
        quantity: wo.quantity,
        priority: wo.priority,
        scheduledStart: wo.scheduledStart,
        scheduledEnd: wo.scheduledEnd,
        workCenterId: wo.workCenterId,
      });
    } else {
      setEditingWO(null);
      setFormData({
        bomId: '',
        quantity: 1,
        priority: 'normal',
        scheduledStart: '',
        scheduledEnd: '',
        workCenterId: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    const bom = boms.find(b => b.id === formData.bomId);
    const wc = workCenters.find(w => w.id === formData.workCenterId);
    
    if (!bom || !wc) {
      toast.error('Please select BOM and Work Center');
      return;
    }

    if (editingWO) {
      updateWorkOrder(editingWO.id, {
        ...formData,
        productId: bom.productId,
        productName: bom.productName,
        workCenterName: wc.name,
      });
      toast.success('Work order updated');
    } else {
      createWorkOrder({
        ...formData,
        productId: bom.productId,
        productName: bom.productName,
        workCenterName: wc.name,
        status: 'draft',
      });
      toast.success('Work order created');
    }
    setWorkOrders(getWorkOrders());
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteWorkOrder(id);
    setWorkOrders(getWorkOrders());
    toast.success('Work order deleted');
  };

  const handleStatusChange = (id: string, newStatus: WorkOrder['status']) => {
    updateWorkOrder(id, { 
      status: newStatus,
      ...(newStatus === 'in_progress' ? { actualStart: new Date().toISOString().split('T')[0] } : {}),
      ...(newStatus === 'done' ? { actualEnd: new Date().toISOString().split('T')[0], progress: 100 } : {}),
    });
    setWorkOrders(getWorkOrders());
    toast.success(`Work order ${newStatus.replace('_', ' ')}`);
  };

  return (
    <AppLayout title="Manufacturing" subtitle="Work Orders" moduleNav={MANUFACTURING_NAV}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Work Orders</h1>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            New Work Order
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder=""
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Work Center</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((wo) => (
                  <TableRow key={wo.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{wo.name}</TableCell>
                    <TableCell>{wo.productName}</TableCell>
                    <TableCell>{wo.workCenterName}</TableCell>
                    <TableCell>{wo.quantity}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 w-24">
                        <Progress value={wo.progress} className="h-2" />
                        <span className="text-xs">{wo.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={priorityColors[wo.priority]}>{wo.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[wo.status]}>{wo.status.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {wo.scheduledStart} - {wo.scheduledEnd}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {wo.status === 'draft' && (
                          <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handleStatusChange(wo.id, 'confirmed'); }}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {wo.status === 'confirmed' && (
                          <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handleStatusChange(wo.id, 'in_progress'); }}>
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {wo.status === 'in_progress' && (
                          <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handleStatusChange(wo.id, 'done'); }}>
                            <CheckCircle className="h-4 w-4 text-success" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handleOpenDialog(wo); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDelete(wo.id); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingWO ? 'Edit Work Order' : 'New Work Order'}</DialogTitle>
            <DialogDescription>
              {editingWO ? 'Update work order details and schedule' : 'Create a new production work order'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Bill of Materials</Label>
              <Select value={formData.bomId} onValueChange={(v) => setFormData({ ...formData, bomId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select BOM" />
                </SelectTrigger>
                <SelectContent>
                  {boms.filter(b => b.status === 'active').map((bom) => (
                    <SelectItem key={bom.id} value={bom.id}>{bom.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Work Center</Label>
              <Select value={formData.workCenterId} onValueChange={(v) => setFormData({ ...formData, workCenterId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="" />
                </SelectTrigger>
                <SelectContent>
                  {workCenters.filter(wc => wc.isActive).map((wc) => (
                    <SelectItem key={wc.id} value={wc.id}>{wc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v as WorkOrder['priority'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Scheduled Start</Label>
                <Input
                  type="date"
                  value={formData.scheduledStart}
                  onChange={(e) => setFormData({ ...formData, scheduledStart: e.target.value })}
                />
              </div>
              <div>
                <Label>Scheduled End</Label>
                <Input
                  type="date"
                  value={formData.scheduledEnd}
                  onChange={(e) => setFormData({ ...formData, scheduledEnd: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingWO ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
