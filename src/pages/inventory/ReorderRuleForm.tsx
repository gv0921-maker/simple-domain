import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { INVENTORY_NAV } from '@/lib/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { useReorderRules, useSaveReorderRule, useProducts, useWarehouses } from '@/hooks/inventory';
import type { ReorderRule } from '@/lib/services/inventory';
import { useToast } from '@/hooks/use-toast';

export default function ReorderRuleForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEdit = !!id;

  const { data: products = [] } = useProducts();
  const { data: warehouses = [] } = useWarehouses();
  const { data: rules = [] } = useReorderRules();
  const saveMut = useSaveReorderRule();
  const [editingRule, setEditingRule] = useState<ReorderRule | null>(null);

  const [formData, setFormData] = useState({
    productId: '',
    warehouseId: '',
    minQty: 10,
    maxQty: 100,
    reorderQty: 50,
    leadTimeDays: 7,
    isActive: true,
  });

  useEffect(() => {
    if (id) {
      const rule = rules.find(r => r.id === id);
      if (rule) {
        setEditingRule(rule);
        setFormData({
          productId: rule.productId,
          warehouseId: rule.warehouseId,
          minQty: rule.minQty,
          maxQty: rule.maxQty,
          reorderQty: rule.reorderQty,
          leadTimeDays: rule.leadTimeDays,
          isActive: rule.isActive,
        });
      }
    } else {
      setFormData(prev => ({ ...prev, warehouseId: warehouses[0]?.id || '' }));
    }
  }, [id, navigate, warehouses, rules]);

  const handleSubmit = () => {
    const product = products.find(p => p.id === formData.productId);
    const warehouse = warehouses.find(w => w.id === formData.warehouseId);

    if (!product || !warehouse) {
      toast({ title: 'Please select product and warehouse', variant: 'destructive' });
      return;
    }

    const rule: ReorderRule = {
      id: editingRule?.id || '',
      productId: formData.productId,
      productName: product.name,
      warehouseId: formData.warehouseId,
      warehouseName: warehouse.name,
      minQty: formData.minQty,
      maxQty: formData.maxQty,
      reorderQty: formData.reorderQty,
      leadTimeDays: formData.leadTimeDays,
      isActive: formData.isActive,
      lastTriggered: editingRule?.lastTriggered,
      createdAt: editingRule?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveMut.mutate(rule, {
      onSuccess: () => {
        toast({ title: editingRule ? 'Rule Updated' : 'Rule Created', description: `Reorder rule for ${product.name} has been saved.` });
        navigate('/inventory/reorder-rules');
      },
      onError: (e: any) => toast({ title: 'Save failed', description: e?.message, variant: 'destructive' }),
    });
  };

  return (
    <AppLayout title="Inventory" moduleNav={INVENTORY_NAV}>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/inventory/reorder-rules')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {isEdit ? 'Edit Reorder Rule' : 'New Reorder Rule'}
            </h1>
            <p className="text-muted-foreground">
              Configure automatic stock replenishment for a product
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Rule Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Product</Label>
              <Select value={formData.productId} onValueChange={(v) => setFormData({ ...formData, productId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.filter(p => p.trackInventory).map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Warehouse</Label>
              <Select value={formData.warehouseId} onValueChange={(v) => setFormData({ ...formData, warehouseId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((wh) => (
                    <SelectItem key={wh.id} value={wh.id}>
                      {wh.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Min Quantity</Label>
                <Input type="number" value={formData.minQty} onChange={(e) => setFormData({ ...formData, minQty: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="grid gap-2">
                <Label>Max Quantity</Label>
                <Input type="number" value={formData.maxQty} onChange={(e) => setFormData({ ...formData, maxQty: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Reorder Quantity</Label>
                <Input type="number" value={formData.reorderQty} onChange={(e) => setFormData({ ...formData, reorderQty: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="grid gap-2">
                <Label>Lead Time (days)</Label>
                <Input type="number" value={formData.leadTimeDays} onChange={(e) => setFormData({ ...formData, leadTimeDays: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={formData.isActive} onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate('/inventory/reorder-rules')}>Cancel</Button>
          <Button onClick={handleSubmit}>{isEdit ? 'Update' : 'Create'} Rule</Button>
        </div>
      </div>
    </AppLayout>
  );
}
