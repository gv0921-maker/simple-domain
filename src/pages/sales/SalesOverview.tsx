import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  FileText,
  ArrowRight,
  Calendar,
  Users,
} from 'lucide-react';
import {
  getSalesOrders,
  getContacts,
} from '@/lib/data/sales';
import { getQuotations } from '@/lib/data/sales/storage';
import { SALES_NAV } from '@/lib/navigation/sales';
import { SimpleBarChart } from '@/components/dashboard/SimpleBarChart';
import { format, parseISO, isThisMonth } from 'date-fns';

export default function SalesOverview() {
  const navigate = useNavigate();
  const [orders] = useState(() => getSalesOrders());
  const [quotations] = useState(() => getQuotations());
  const [contacts] = useState(() => getContacts());

  const stats = useMemo(() => {
    const monthlyOrders = orders.filter((o) =>
      isThisMonth(parseISO(o.orderDate))
    );
    const monthlyRevenue = monthlyOrders.reduce((sum, o) => sum + o.total, 0);
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const pendingQuotations = quotations.filter((q) => q.status === 'draft' || q.status === 'sent');
    const confirmedOrders = orders.filter((o) => o.status === 'confirmed' || o.status === 'done');

    return {
      totalRevenue,
      monthlyRevenue,
      monthlyOrderCount: monthlyOrders.length,
      totalOrders: orders.length,
      pendingQuotations: pendingQuotations.length,
      confirmedOrders: confirmedOrders.length,
      totalCustomers: contacts.length,
    };
  }, [orders, quotations, contacts]);

  const orderChartData = useMemo(() => {
    const statusGroups = [
      { status: 'draft', color: 'blue' as const },
      { status: 'confirmed', color: 'teal' as const },
      { status: 'done', color: 'coral' as const },
      { status: 'cancelled', color: 'orange' as const },
    ];
    return statusGroups.map((g) => ({
      value: orders.filter((o) => o.status === g.status).length,
      color: g.color,
    }));
  }, [orders]);

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
      .slice(0, 5);
  }, [orders]);

  return (
    <AppLayout title="Sales" moduleNav={SALES_NAV}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Sales Overview</h1>
            <p className="text-muted-foreground">Track quotations, orders and revenue</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/sales/quotations/new')}>
              New Quotation
            </Button>
            <Button onClick={() => navigate('/sales/orders/new')}>
              New Order
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="animate-slide-up" style={{ animationDelay: '0ms' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Monthly Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.monthlyRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.monthlyOrderCount} orders this month
              </p>
            </CardContent>
          </Card>

          <Card className="animate-slide-up" style={{ animationDelay: '50ms' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalOrders} total orders
              </p>
            </CardContent>
          </Card>

          <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Quotations
              </CardTitle>
              <FileText className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingQuotations}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting confirmation
              </p>
            </CardContent>
          </Card>

          <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Customers
              </CardTitle>
              <Users className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all accounts
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders Chart */}
          <Card className="lg:col-span-2 animate-fade-in">
            <CardHeader>
              <CardTitle>Orders by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center gap-4 mb-4">
                {['Draft', 'Confirmed', 'Done', 'Cancelled'].map((label, i) => (
                  <div key={label} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <div className={`w-2 h-2 rounded-full ${
                      i === 0 ? 'bg-chart-blue' :
                      i === 1 ? 'bg-chart-teal' :
                      i === 2 ? 'bg-chart-coral' : 'bg-chart-orange'
                    }`} />
                    {label}
                  </div>
                ))}
              </div>
              <SimpleBarChart data={orderChartData} height={200} />
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => navigate('/sales/quotations')}
              >
                <FileText className="h-4 w-4" />
                View Quotations
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => navigate('/sales/orders')}
              >
                <ShoppingCart className="h-4 w-4" />
                View Orders
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => navigate('/sales/customers')}
              >
                <Users className="h-4 w-4" />
                Manage Customers
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => navigate('/sales/reports')}
              >
                <TrendingUp className="h-4 w-4" />
                Sales Reports
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/sales/orders')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No orders yet
                </p>
              ) : (
                recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => navigate(`/sales/orders/${order.id}`)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{order.reference}</p>
                      <p className="text-xs text-muted-foreground">{order.customerName}</p>
                    </div>
                    <div className="text-right ml-4 flex items-center gap-3">
                      <Badge variant={
                        order.status === 'done' ? 'default' :
                        order.status === 'confirmed' ? 'secondary' :
                        'outline'
                      } className="text-xs">
                        {order.status}
                      </Badge>
                      <div>
                        <p className="font-semibold text-sm">
                          ${order.total.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(parseISO(order.orderDate), 'MMM d')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
