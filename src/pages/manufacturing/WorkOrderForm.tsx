import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { MANUFACTURING_NAV } from '@/lib/navigation/manufacturing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { getWorkOrders, createWorkOrder, updateWorkOrder, getBOMs, getWorkCenters, type WorkOrder, type BillOfMaterials, type WorkCenter } from '@/lib/services/manufacturing';
import { toast } from 'sonner';

export default function WorkOrderForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [boms, setBoms] = useState<BillOfMaterials[]>([]);
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([]);
  useEffect(() => {
    (async () => {
      const [b, wc] = await Promise.all([getBOMs(), getWorkCenters()]);
      setBoms(b); setWorkCenters(wc);
    })();
  }, []);

  const [formData, setFormData] = useState({
    bomId: '',
    quantity: 1,
    priority: 'normal' as WorkOrder['priority'],
    scheduledStart: '',
    scheduledEnd: '',
    workCenterId: '',
  });

  useEffect(() => {
    if (!id) return;
    (async () => {
      const orders = await getWorkOrders();
      const wo = orders.find(w => w.id === id);
      if (wo) {
        setFormData({
          bomId: wo.bomId,
          quantity: wo.quantity,
          priority: wo.priority,
          scheduledStart: wo.scheduledStart,
          scheduledEnd: wo.scheduledEnd,
          workCenterId: wo.workCenterId,
        });
      } else {
        navigate('/manufacturing/work-orders');
      }
    })();
  }, [id, navigate]);

  const handleSubmit = async () => {
    const bom = boms.find(b => b.id === formData.bomId);
    const wc = workCenters.find(w => w.id === formData.workCenterId);
    if (!bom || !wc) {
      toast.error('Please select BOM and Work Center');
      return;
    }

    if (isEdit && id) {
      await updateWorkOrder(id, {
        ...formData,
        productId: bom.productId,
        productName: bom.productName,
        workCenterName: wc.name,
      });
      toast.success('Work order updated');
    } else {
      await createWorkOrder({
        ...formData,
        productId: bom.productId,
        productName: bom.productName,
        workCenterName: wc.name,
        status: 'draft',
      });
      toast.success('Work order created');
    }
    navigate('/manufacturing/work-orders');
  };

  return (
    <AppLayout title="Manufacturing" subtitle={isEdit ? 'Edit Work Order' : 'New Work Order'} moduleNav={MANUFACTURING_NAV}>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/manufacturing/work-orders')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {isEdit ? 'Edit Work Order' : 'New Work Order'}
            </h1>
            <p className="text-muted-foreground">
              {isEdit ? 'Update work order details' : 'Create a new production work order'}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Work Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Bill of Materials *</Label>
              <Select value={formData.bomId} onValueChange={(v) => setFormData({ ...formData, bomId: v })}>
                <SelectTrigger><SelectValue placeholder="Select BOM" /></SelectTrigger>
                <SelectContent>
                  {boms.filter(b => b.status === 'active').map(bom => (
                    <SelectItem key={bom.id} value={bom.id}>{bom.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Work Center *</Label>
              <Select value={formData.workCenterId} onValueChange={(v) => setFormData({ ...formData, workCenterId: v })}>
                <SelectTrigger><SelectValue placeholder="Select Work Center" /></SelectTrigger>
                <SelectContent>
                  {workCenters.filter(wc => wc.isActive).map(wc => (
                    <SelectItem key={wc.id} value={wc.id}>{wc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v as WorkOrder['priority'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
              <div className="grid gap-2">
                <Label>Scheduled Start</Label>
                <Input
                  type="date"
                  value={formData.scheduledStart}
                  onChange={(e) => setFormData({ ...formData, scheduledStart: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Scheduled End</Label>
                <Input
                  type="date"
                  value={formData.scheduledEnd}
                  onChange={(e) => setFormData({ ...formData, scheduledEnd: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate('/manufacturing/work-orders')}>Cancel</Button>
          <Button onClick={handleSubmit}>{isEdit ? 'Update' : 'Create'} Work Order</Button>
        </div>
      </div>
    </AppLayout>
  );
}
