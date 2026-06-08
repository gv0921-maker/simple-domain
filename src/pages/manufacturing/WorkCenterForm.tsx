import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { MANUFACTURING_NAV } from '@/lib/navigation/manufacturing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { getWorkCenters, createWorkCenter, updateWorkCenter, type WorkCenter } from '@/lib/services/manufacturing';
import { toast } from 'sonner';

export default function WorkCenterForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    capacity: 8,
    costPerHour: 0,
    isActive: true,
  });

  useEffect(() => {
    if (!id) return;
    (async () => {
      const centers = await getWorkCenters();
      const wc = centers.find(w => w.id === id);
      if (wc) {
        setFormData({
          name: wc.name,
          code: wc.code,
          capacity: wc.capacity,
          costPerHour: wc.costPerHour,
          isActive: wc.isActive,
        });
      } else {
        navigate('/manufacturing/work-centers');
      }
    })();
  }, [id, navigate]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.code) {
      toast.error('Please fill in required fields');
      return;
    }

    if (isEdit && id) {
      await updateWorkCenter(id, formData);
      toast.success('Work center updated');
    } else {
      await createWorkCenter(formData);
      toast.success('Work center created');
    }
    navigate('/manufacturing/work-centers');
  };

  return (
    <AppLayout title="Manufacturing" subtitle={isEdit ? 'Edit Work Center' : 'New Work Center'} moduleNav={MANUFACTURING_NAV}>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/manufacturing/work-centers')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {isEdit ? 'Edit Work Center' : 'New Work Center'}
            </h1>
            <p className="text-muted-foreground">
              {isEdit ? 'Update work center configuration' : 'Add a new production work center'}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Work Center Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Code *</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Capacity (hours/day)</Label>
                <Input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Cost per Hour (₹)</Label>
                <Input
                  type="number"
                  value={formData.costPerHour}
                  onChange={(e) => setFormData({ ...formData, costPerHour: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={formData.isActive} onCheckedChange={(v) => setFormData({ ...formData, isActive: v })} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate('/manufacturing/work-centers')}>Cancel</Button>
          <Button onClick={handleSubmit}>{isEdit ? 'Update' : 'Create'} Work Center</Button>
        </div>
      </div>
    </AppLayout>
  );
}
