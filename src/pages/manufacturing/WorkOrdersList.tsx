import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { MANUFACTURING_NAV } from '@/lib/navigation/manufacturing';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useWorkOrders, useDeleteWorkOrder, useSaveWorkOrder } from '@/hooks/manufacturing';
import type { WorkOrder } from '@/lib/services/manufacturing/api';
import { Plus, Search, Filter, Trash2, Edit, Play, CheckCircle } from 'lucide-react';
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
  const { data: workOrders = [] } = useWorkOrders();
  const deleteWO = useDeleteWorkOrder();
  const saveWO = useSaveWorkOrder();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredOrders = workOrders.filter(wo => {
    const matchesSearch = wo.name.toLowerCase().includes(search.toLowerCase()) ||
                          wo.productName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || wo.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    await deleteWO.mutateAsync(id);
    toast.success('Work order deleted');
  };

  const handleStatusChange = async (id: string, newStatus: WorkOrder['status']) => {
    const wo = workOrders.find(w => w.id === id);
    if (!wo) return;
    await saveWO.mutateAsync({
      ...wo,
      status: newStatus,
      ...(newStatus === 'in_progress' ? { actualStart: new Date().toISOString() } : {}),
      ...(newStatus === 'done' ? { actualEnd: new Date().toISOString(), progress: 100 } : {}),
    });
    toast.success(`Work order ${newStatus.replace('_', ' ')}`);
  };

  return (
    <AppLayout title="Manufacturing" subtitle="Work Orders" moduleNav={MANUFACTURING_NAV}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Work Orders</h1>
          <Button onClick={() => navigate('/manufacturing/work-orders/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Work Order
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search work orders..."
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
                        <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/manufacturing/work-orders/${wo.id}/edit`); }}>
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
    </AppLayout>
  );
}
