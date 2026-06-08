import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { MANUFACTURING_NAV } from '@/lib/navigation/manufacturing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useWorkOrder, useSaveWorkOrder, useBOMs, useWorkCenters } from '@/hooks/manufacturing';
import { useProducts } from '@/hooks/inventory';
import type { WorkOrder } from '@/lib/services/manufacturing/api';
import { toast } from 'sonner';
import { GoodsReceiptQCDialog, type QCLineInput } from '@/components/qc/GoodsReceiptQCDialog';

export default function WorkOrderForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const { data: boms = [] } = useBOMs();
  const { data: workCenters = [] } = useWorkCenters();
  const { data: products = [] } = useProducts();
  const { data: existing } = useWorkOrder(id);
  const saveWO = useSaveWorkOrder();

  const [formData, setFormData] = useState({
    bomId: '',
    quantity: 1,
    priority: 'normal' as WorkOrder['priority'],
    scheduledStart: '',
    scheduledEnd: '',
    workCenterId: '',
  });
  const [qcOpen, setQcOpen] = useState(false);

  useEffect(() => {
    if (!existing) return;
    setFormData({
      bomId: existing.bomId,
      quantity: existing.quantity,
      priority: existing.priority,
      scheduledStart: existing.scheduledStart,
      scheduledEnd: existing.scheduledEnd,
      workCenterId: existing.workCenterId,
    });
  }, [existing]);

  // BOM component preview — sourced from real products in the catalog
  const selectedBom = useMemo(() => boms.find(b => b.id === formData.bomId), [boms, formData.bomId]);
  const componentsPreview = useMemo(() => {
    if (!selectedBom) return [];
    return selectedBom.lines.map(l => {
      const p = products.find(pr => pr.id === l.productId);
      return {
        id: l.id,
        productId: l.productId,
        productName: p?.name ?? l.productName ?? 'Unknown component',
        quantity: l.quantity * (formData.quantity || 1),
        uom: l.uom,
      };
    });
  }, [selectedBom, products, formData.quantity]);

  const handleSubmit = async () => {
    const bom = boms.find(b => b.id === formData.bomId);
    const wc = workCenters.find(w => w.id === formData.workCenterId);
    if (!bom || !wc) {
      toast.error('Please select BOM and Work Center');
      return;
    }
    try {
      const payload: WorkOrder = {
        id: id ?? '',
        name: existing?.name ?? '',
        productId: bom.productId,
        productName: bom.productName,
        bomId: bom.id,
        quantity: formData.quantity,
        status: existing?.status ?? 'draft',
        scheduledStart: formData.scheduledStart,
        scheduledEnd: formData.scheduledEnd,
        actualStart: existing?.actualStart,
        actualEnd: existing?.actualEnd,
        workCenterId: wc.id,
        workCenterName: wc.name,
        progress: existing?.progress ?? 0,
        priority: formData.priority,
      };
      await saveWO.mutateAsync(payload);
      toast.success(isEdit ? 'Work order updated' : 'Work order created');
      navigate('/manufacturing/work-orders');
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to save work order');
    }
  };

  const canComplete = isEdit && existing && existing.status !== 'done' && existing.status !== 'cancelled';
  const qcLines: QCLineInput[] = existing
    ? [{
        productId: existing.productId,
        productName: existing.productName,
        expectedQuantity: existing.quantity,
      }]
    : [];

  const handleCompleteWithQC = async () => {
    if (!existing) return;
    const updated: WorkOrder = {
      ...existing,
      status: 'done',
      progress: 100,
      actualEnd: new Date().toISOString(),
    };
    await saveWO.mutateAsync(updated);
    toast.success('Work order completed and QC recorded');
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
            {componentsPreview.length > 0 && (
              <div className="rounded border bg-muted/30 p-3 space-y-1">
                <div className="text-sm font-medium mb-1">Required Components</div>
                {componentsPreview.map(c => (
                  <div key={c.id} className="flex justify-between text-sm">
                    <span>{c.productName}</span>
                    <span className="text-muted-foreground">{c.quantity} {c.uom}</span>
                  </div>
                ))}
              </div>
            )}
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
          {canComplete && (
            <Button variant="default" className="gap-1" onClick={() => setQcOpen(true)}>
              <CheckCircle2 className="h-4 w-4" />
              Complete with QC
            </Button>
          )}
          <Button onClick={handleSubmit}>{isEdit ? 'Update' : 'Create'} Work Order</Button>
        </div>
      </div>
      {existing && (
        <GoodsReceiptQCDialog
          open={qcOpen}
          onOpenChange={setQcOpen}
          title="Work Order QC"
          description={`Inspect finished goods for ${existing.productName} before marking the work order as done.`}
          referenceType="work_order"
          referenceId={existing.id}
          lines={qcLines}
          submittingLabel="Confirm QC & Complete"
          onConfirmed={handleCompleteWithQC}
        />
      )}
    </AppLayout>
  );
}
