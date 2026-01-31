import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { MANUFACTURING_NAV } from '@/lib/navigation/manufacturing';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { getWorkCenters, createWorkCenter, updateWorkCenter, deleteWorkCenter, WorkCenter } from '@/lib/data/manufacturing';
import { Plus, Search, Trash2, Edit, Cog, DollarSign, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function WorkCenters() {
  const [workCenters, setWorkCenters] = useState(getWorkCenters());
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWC, setEditingWC] = useState<WorkCenter | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    capacity: 8,
    costPerHour: 0,
    isActive: true,
  });

  const filteredCenters = workCenters.filter(wc =>
    wc.name.toLowerCase().includes(search.toLowerCase()) ||
    wc.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenDialog = (wc?: WorkCenter) => {
    if (wc) {
      setEditingWC(wc);
      setFormData({
        name: wc.name,
        code: wc.code,
        capacity: wc.capacity,
        costPerHour: wc.costPerHour,
        isActive: wc.isActive,
      });
    } else {
      setEditingWC(null);
      setFormData({
        name: '',
        code: '',
        capacity: 8,
        costPerHour: 0,
        isActive: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.code) {
      toast.error('Please fill in required fields');
      return;
    }

    if (editingWC) {
      updateWorkCenter(editingWC.id, formData);
      toast.success('Work center updated');
    } else {
      createWorkCenter(formData);
      toast.success('Work center created');
    }
    setWorkCenters(getWorkCenters());
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteWorkCenter(id);
    setWorkCenters(getWorkCenters());
    toast.success('Work center deleted');
  };

  const handleToggleActive = (id: string, isActive: boolean) => {
    updateWorkCenter(id, { isActive });
    setWorkCenters(getWorkCenters());
    toast.success(`Work center ${isActive ? 'activated' : 'deactivated'}`);
  };

  return (
    <AppLayout title="Manufacturing" subtitle="Work Centers" moduleNav={MANUFACTURING_NAV}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Work Centers</h1>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            New Work Center
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search work centers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCenters.map((wc) => (
            <Card key={wc.id} className={!wc.isActive ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Cog className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{wc.name}</h3>
                      <p className="text-sm text-muted-foreground">{wc.code}</p>
                    </div>
                  </div>
                  <Badge variant={wc.isActive ? 'default' : 'secondary'}>
                    {wc.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Users className="h-4 w-4" /> Capacity
                    </span>
                    <span>{wc.capacity} hours/day</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <DollarSign className="h-4 w-4" /> Cost/Hour
                    </span>
                    <span>${wc.costPerHour}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Current Load</span>
                      <span>{wc.currentLoad}%</span>
                    </div>
                    <Progress
                      value={wc.currentLoad}
                      className={`h-2 ${wc.currentLoad > 80 ? '[&>div]:bg-destructive' : wc.currentLoad > 60 ? '[&>div]:bg-warning' : ''}`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <Switch
                    checked={wc.isActive}
                    onCheckedChange={(checked) => handleToggleActive(wc.id, checked)}
                  />
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(wc)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(wc.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingWC ? 'Edit Work Center' : 'New Work Center'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Assembly Line 1"
              />
            </div>
            <div>
              <Label>Code</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g., ASM-01"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Capacity (hours/day)</Label>
                <Input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Cost per Hour ($)</Label>
                <Input
                  type="number"
                  value={formData.costPerHour}
                  onChange={(e) => setFormData({ ...formData, costPerHour: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingWC ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
