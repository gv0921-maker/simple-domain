import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { SHOPFLOOR_NAV } from '@/lib/navigation/shopfloor';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, ClipboardList, Paintbrush, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { useMyFactoryWOs, useAllFactoryWOs } from '@/hooks/shopfloor';
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';
import type { ShopFloorWO } from '@/lib/services/shopfloor';

function stageBadge(stage: string) {
  switch (stage) {
    case 'placed':       return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Placed — start work</Badge>;
    case 'work_start':   return <Badge className="bg-amber-100 text-amber-800 border-amber-200">In Progress</Badge>;
    case 'polishing':    return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Polishing</Badge>;
    case 'completed':    return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Completed</Badge>;
    default:             return <Badge variant="outline">{stage}</Badge>;
  }
}

export default function ShopFloorHome() {
  const navigate = useNavigate();
  const { isAdmin } = useIsSuperAdmin();
  const mine = useMyFactoryWOs();
  const all = useAllFactoryWOs();
  const wos: ShopFloorWO[] = (isAdmin ? all.data : mine.data) ?? [];

  const counts = {
    total: wos.length,
    placed: wos.filter((w) => w.current_stage === 'placed').length,
    work: wos.filter((w) => w.current_stage === 'work_start').length,
    polish: wos.filter((w) => w.current_stage === 'polishing').length,
  };

  return (
    <AppLayout title="Shop Floor" subtitle="Factory" moduleNav={SHOPFLOOR_NAV}>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl font-bold">Assigned Work Orders</h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin ? 'All work orders currently on the factory floor.' : 'Work orders assigned to you.'}
          </p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="My WOs" value={counts.total} icon={<ClipboardList className="h-5 w-5" />} />
          <Stat label="Pending Action" value={counts.placed} icon={<Play className="h-5 w-5 text-blue-600" />} />
          <Stat label="In Progress" value={counts.work} icon={<Paintbrush className="h-5 w-5 text-amber-600" />} />
          <Stat label="In Polishing" value={counts.polish} icon={<CheckCircle2 className="h-5 w-5 text-purple-600" />} />
        </div>

        <div className="space-y-3">
          {wos.length === 0 && (
            <Card><CardContent className="py-10 text-center text-muted-foreground">No work orders to show.</CardContent></Card>
          )}
          {wos.map((wo) => (
            <Card key={wo.id} className="hover:shadow-md transition cursor-pointer" onClick={() => navigate(`/shop-floor/work-orders/${wo.id}`)}>
              <CardContent className="p-4 flex items-start gap-4">
                <div className="flex-shrink-0 w-16 h-16 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                  {wo.product?.image_url ? (
                    <img src={wo.product.image_url} alt={wo.product?.name ?? ''} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{wo.wo_number}</div>
                      <div className="text-sm text-muted-foreground truncate">{wo.product?.name ?? 'Product'} · Qty {wo.quantity}</div>
                    </div>
                    {stageBadge(wo.current_stage)}
                  </div>
                  {wo.customization_notes && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{wo.customization_notes}</p>
                  )}
                  <div className="flex items-center justify-between mt-3 gap-2">
                    <span className="text-xs text-muted-foreground">
                      {wo.eta_date ? `ETA: ${new Date(wo.eta_date).toLocaleDateString()}` : 'No ETA'}
                    </span>
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/shop-floor/work-orders/${wo.id}`); }}>
                      {wo.current_stage === 'placed' ? 'Start Work'
                        : wo.current_stage === 'work_start' ? (wo.bom_entered_at ? 'Begin Polishing' : 'Enter BOM')
                        : wo.current_stage === 'polishing' ? 'Mark Completed'
                        : 'Open'}
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

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        {icon}
      </CardContent>
    </Card>
  );
}