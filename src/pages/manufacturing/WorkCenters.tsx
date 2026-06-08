import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { MANUFACTURING_NAV } from '@/lib/navigation/manufacturing';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { getWorkCenters, deleteWorkCenter, updateWorkCenter, type WorkCenter } from '@/lib/services/manufacturing';
import { Plus, Search, Trash2, Edit, Cog, DollarSign, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function WorkCenters() {
  const navigate = useNavigate();
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([]);
  const refresh = async () => setWorkCenters(await getWorkCenters());
  useEffect(() => { refresh(); }, []);
  const [search, setSearch] = useState('');

  const filteredCenters = workCenters.filter(wc =>
    wc.name.toLowerCase().includes(search.toLowerCase()) ||
    wc.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    await deleteWorkCenter(id);
    await refresh();
    toast.success('Work center deleted');
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await updateWorkCenter(id, { isActive });
    await refresh();
    toast.success(`Work center ${isActive ? 'activated' : 'deactivated'}`);
  };

  return (
    <AppLayout title="Manufacturing" subtitle="Work Centers" moduleNav={MANUFACTURING_NAV}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Work Centers</h1>
          <Button onClick={() => navigate('/manufacturing/work-centers/new')}>
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
                    <span>₹{wc.costPerHour}</span>
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
                    <Button size="icon" variant="ghost" onClick={() => navigate(`/manufacturing/work-centers/${wc.id}/edit`)}>
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
    </AppLayout>
  );
}
