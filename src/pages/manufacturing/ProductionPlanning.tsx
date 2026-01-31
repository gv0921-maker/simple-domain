import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { MANUFACTURING_NAV } from '@/lib/navigation/manufacturing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getWorkOrders, getWorkCenters, WorkOrder } from '@/lib/data/manufacturing';
import { Calendar, ChevronLeft, ChevronRight, Clock, AlertTriangle } from 'lucide-react';

export default function ProductionPlanning() {
  const workOrders = getWorkOrders();
  const workCenters = getWorkCenters();
  const [view, setView] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Generate dates for the current week/month view
  const getDates = () => {
    const dates: Date[] = [];
    const start = new Date(currentDate);
    if (view === 'week') {
      start.setDate(start.getDate() - start.getDay());
      for (let i = 0; i < 7; i++) {
        dates.push(new Date(start));
        start.setDate(start.getDate() + 1);
      }
    } else {
      start.setDate(1);
      const month = start.getMonth();
      while (start.getMonth() === month) {
        dates.push(new Date(start));
        start.setDate(start.getDate() + 1);
      }
    }
    return dates;
  };

  const dates = getDates();

  const getOrdersForDate = (date: Date, workCenterId: string) => {
    const dateStr = date.toISOString().split('T')[0];
    return workOrders.filter(wo => 
      wo.workCenterId === workCenterId &&
      wo.scheduledStart <= dateStr &&
      wo.scheduledEnd >= dateStr &&
      wo.status !== 'cancelled' &&
      wo.status !== 'done'
    );
  };

  const navigate = (direction: number) => {
    const newDate = new Date(currentDate);
    if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    setCurrentDate(newDate);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
  };

  const priorityColors: Record<string, string> = {
    urgent: 'bg-destructive text-destructive-foreground',
    high: 'bg-primary text-primary-foreground',
    normal: 'bg-secondary text-secondary-foreground',
    low: 'bg-muted text-muted-foreground',
  };

  return (
    <AppLayout title="Manufacturing" subtitle="Planning" moduleNav={MANUFACTURING_NAV}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Production Planning</h1>
          <div className="flex items-center gap-2">
            <Select value={view} onValueChange={(v) => setView(v as 'week' | 'month')}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week View</SelectItem>
                <SelectItem value="month">Month View</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="outline" onClick={() => navigate(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
              <Button size="icon" variant="outline" onClick={() => navigate(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b">
                    <th className="p-3 text-left font-medium text-muted-foreground w-48">Work Center</th>
                    {dates.slice(0, view === 'week' ? 7 : 14).map((date, i) => (
                      <th key={i} className="p-3 text-center font-medium text-muted-foreground min-w-[100px]">
                        {formatDate(date)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {workCenters.filter(wc => wc.isActive).map((wc) => (
                    <tr key={wc.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div className="font-medium">{wc.name}</div>
                        <div className="text-sm text-muted-foreground">{wc.code}</div>
                      </td>
                      {dates.slice(0, view === 'week' ? 7 : 14).map((date, i) => {
                        const orders = getOrdersForDate(date, wc.id);
                        return (
                          <td key={i} className="p-2 align-top">
                            <div className="space-y-1">
                              {orders.map((wo) => (
                                <div
                                  key={wo.id}
                                  className={`p-1.5 rounded text-xs cursor-pointer ${priorityColors[wo.priority]}`}
                                  title={`${wo.name}: ${wo.productName} (${wo.quantity} units)`}
                                >
                                  <div className="font-medium truncate">{wo.name}</div>
                                  <div className="truncate opacity-90">{wo.quantity}u</div>
                                </div>
                              ))}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workOrders
                .filter(wo => wo.status !== 'done' && wo.status !== 'cancelled')
                .sort((a, b) => new Date(a.scheduledEnd).getTime() - new Date(b.scheduledEnd).getTime())
                .slice(0, 5)
                .map((wo) => {
                  const daysLeft = Math.ceil((new Date(wo.scheduledEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  const isOverdue = daysLeft < 0;
                  const isUrgent = daysLeft <= 2 && daysLeft >= 0;
                  
                  return (
                    <div key={wo.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {(isOverdue || isUrgent) && (
                          <AlertTriangle className={`h-4 w-4 ${isOverdue ? 'text-destructive' : 'text-warning'}`} />
                        )}
                        <div>
                          <div className="font-medium">{wo.name}</div>
                          <div className="text-sm text-muted-foreground">{wo.productName} • {wo.workCenterName}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={isOverdue ? 'destructive' : isUrgent ? 'default' : 'outline'}>
                          {isOverdue ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`}
                        </Badge>
                        <div className="text-sm text-muted-foreground mt-1">Due: {wo.scheduledEnd}</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
