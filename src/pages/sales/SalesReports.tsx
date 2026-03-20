import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Download,
  Calendar,
  Users,
  Target,
  FileText,
  ShoppingCart,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { getQuotations, getSalesOrders, getSubscriptions } from '@/lib/data/sales/storage';
import { getContacts } from '@/lib/data/sales';
import { SALES_NAV } from '@/lib/navigation/sales';
import { useToast } from '@/hooks/use-toast';
import { SimpleBarChart } from '@/components/dashboard/SimpleBarChart';
import { format, parseISO, subMonths, isAfter, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';

export default function SalesReports() {
  const { toast } = useToast();
  const [quotations] = useState(() => getQuotations());
  const [orders] = useState(() => getSalesOrders());
  const [subscriptions] = useState(() => getSubscriptions());
  const [contacts] = useState(() => getContacts());
  const [dateRange, setDateRange] = useState('this_month');
  const [selectedReport, setSelectedReport] = useState('overview');

  // Calculate date range
  const dateFilter = useMemo(() => {
    const now = new Date();
    switch (dateRange) {
      case 'this_month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last_month':
        return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
      case 'last_3_months':
        return { start: startOfMonth(subMonths(now, 3)), end: now };
      case 'last_6_months':
        return { start: startOfMonth(subMonths(now, 6)), end: now };
      case 'this_year':
        return { start: new Date(now.getFullYear(), 0, 1), end: now };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [dateRange]);

  // KPIs
  const kpis = useMemo(() => {
    const filteredQuotes = quotations.filter(
      (q) => isAfter(parseISO(q.quotationDate), dateFilter.start)
    );
    const filteredOrders = orders.filter(
      (o) => isAfter(parseISO(o.orderDate), dateFilter.start)
    );

    const totalQuotations = filteredQuotes.length;
    const acceptedQuotes = filteredQuotes.filter((q) => q.status === 'accepted').length;
    const conversionRate = totalQuotations > 0 ? Math.round((acceptedQuotes / totalQuotations) * 100) : 0;

    const totalRevenue = filteredOrders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total, 0);

    const avgDealSize = filteredOrders.length > 0
      ? totalRevenue / filteredOrders.filter((o) => o.status !== 'cancelled').length
      : 0;

    const totalDiscount = filteredOrders.reduce((sum, o) => sum + o.discountAmount, 0);
    const discountRate = totalRevenue > 0 ? (totalDiscount / (totalRevenue + totalDiscount)) * 100 : 0;

    const mrr = subscriptions
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => {
        const monthly = s.billingCycle === 'monthly' ? s.total :
          s.billingCycle === 'quarterly' ? s.total / 3 : s.total / 12;
        return sum + monthly;
      }, 0);

    return {
      totalRevenue,
      totalQuotations,
      conversionRate,
      avgDealSize,
      discountRate,
      mrr,
      ordersCount: filteredOrders.filter((o) => o.status !== 'cancelled').length,
    };
  }, [quotations, orders, subscriptions, dateFilter]);

  // Monthly trend data
  const monthlyData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const monthOrders = orders.filter((o) => {
        const orderDate = parseISO(o.orderDate);
        return orderDate >= monthStart && orderDate <= monthEnd && o.status !== 'cancelled';
      });

      months.push({
        month: format(monthDate, 'MMM'),
        revenue: monthOrders.reduce((sum, o) => sum + o.total, 0),
        orders: monthOrders.length,
      });
    }
    return months;
  }, [orders]);

  // Customer ranking
  const customerRanking = useMemo(() => {
    const customerTotals: Record<string, { name: string; total: number; orders: number }> = {};

    orders
      .filter((o) => o.status !== 'cancelled')
      .forEach((order) => {
        if (!customerTotals[order.customerId]) {
          customerTotals[order.customerId] = { name: order.customerName, total: 0, orders: 0 };
        }
        customerTotals[order.customerId].total += order.total;
        customerTotals[order.customerId].orders += 1;
      });

    return Object.entries(customerTotals)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [orders]);

  // Quotation status breakdown
  const quotationStats = useMemo(() => {
    return {
      draft: quotations.filter((q) => q.status === 'draft').length,
      sent: quotations.filter((q) => q.status === 'sent').length,
      accepted: quotations.filter((q) => q.status === 'accepted').length,
      expired: quotations.filter((q) => q.status === 'expired').length,
      cancelled: quotations.filter((q) => q.status === 'cancelled').length,
    };
  }, [quotations]);

  const handleExport = (reportType: string) => {
    let content = '';
    let filename = '';

    switch (reportType) {
      case 'quotations':
        content = 'Reference,Customer,Date,Status,Total\n' +
          quotations.map((q) => `${q.reference},${q.customerName},${q.quotationDate},${q.status},${q.total}`).join('\n');
        filename = 'quotations_export.csv';
        break;
      case 'orders':
        content = 'Reference,Customer,Date,Status,Total\n' +
          orders.map((o) => `${o.reference},${o.customerName},${o.orderDate},${o.status},${o.total}`).join('\n');
        filename = 'orders_export.csv';
        break;
      case 'customers':
        content = 'Customer,Total Revenue,Orders\n' +
          customerRanking.map((c) => `${c.name},${c.total},${c.orders}`).join('\n');
        filename = 'customer_report.csv';
        break;
      default:
        return;
    }

    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Report exported' });
  };

  const chartData = monthlyData.map((m) => ({
    value: Math.round(m.revenue / 1000),
    color: 'blue' as const,
  }));

  return (
    <AppLayout title="Sales" moduleNav={SALES_NAV}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Sales Reports</h1>
            <p className="text-muted-foreground">Analytics and insights for your sales</p>
          </div>
          <div className="flex gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                <SelectItem value="last_6_months">Last 6 Months</SelectItem>
                <SelectItem value="this_year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card className="animate-slide-up">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{`₹${kpis.totalRevenue.toLocaleString('en-IN')}`}</div>
              <div className="flex items-center text-xs text-success mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +12% vs last period
              </div>
            </CardContent>
          </Card>

          <Card className="animate-slide-up" style={{ animationDelay: '50ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.ordersCount}</div>
            </CardContent>
          </Card>

          <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Quotations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.totalQuotations}</div>
            </CardContent>
          </Card>

          <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Conversion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{kpis.conversionRate}%</div>
            </CardContent>
          </Card>

          <Card className="animate-slide-up" style={{ animationDelay: '200ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Avg Deal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{`₹${Math.round(kpis.avgDealSize).toLocaleString('en-IN')}`}</div>
            </CardContent>
          </Card>

          <Card className="animate-slide-up" style={{ animationDelay: '250ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Discount %
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{kpis.discountRate.toFixed(1)}%</div>
            </CardContent>
          </Card>

          <Card className="animate-slide-up" style={{ animationDelay: '300ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                MRR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{`₹${Math.round(kpis.mrr).toLocaleString('en-IN')}`}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts & Tables */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="quotations">Quotations</TabsTrigger>
            <TabsTrigger value="customers">Top Customers</TabsTrigger>
            <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trend */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Revenue Trend</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => handleExport('orders')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                  <CardDescription>Monthly revenue (in thousands)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2 mb-4">
                    {monthlyData.map((m, i) => (
                      <div key={i} className="flex-1 text-center">
                        <div className="text-xs text-muted-foreground mb-1">{`₹${Math.round(m.revenue / 1000)}k`}</div>
                      </div>
                    ))}
                  </div>
                  <SimpleBarChart data={chartData} height={200} />
                  <div className="flex items-center justify-between mt-2">
                    {monthlyData.map((m, i) => (
                      <div key={i} className="text-xs text-muted-foreground">{m.month}</div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quotation Funnel */}
              <Card>
                <CardHeader>
                  <CardTitle>Quotation Funnel</CardTitle>
                  <CardDescription>Status breakdown of all quotations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { status: 'draft', label: 'Draft', count: quotationStats.draft, color: 'bg-muted' },
                    { status: 'sent', label: 'Sent', count: quotationStats.sent, color: 'bg-info' },
                    { status: 'accepted', label: 'Accepted', count: quotationStats.accepted, color: 'bg-success' },
                    { status: 'expired', label: 'Expired', count: quotationStats.expired, color: 'bg-warning' },
                    { status: 'cancelled', label: 'Cancelled', count: quotationStats.cancelled, color: 'bg-destructive' },
                  ].map((item) => (
                    <div key={item.status} className="flex items-center gap-3">
                      <div className={cn('w-3 h-3 rounded-full', item.color)} />
                      <div className="flex-1">
                        <div className="flex justify-between text-sm">
                          <span>{item.label}</span>
                          <span className="font-semibold">{item.count}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full mt-1 overflow-hidden">
                          <div
                            className={cn('h-full rounded-full', item.color)}
                            style={{ width: `${quotations.length > 0 ? (item.count / quotations.length) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="quotations">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Quotations Report</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => handleExport('quotations')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Valid Until</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotations.slice(0, 10).map((q) => (
                      <TableRow key={q.id}>
                        <TableCell className="font-medium">{q.reference}</TableCell>
                        <TableCell>{q.customerName}</TableCell>
                        <TableCell>{format(parseISO(q.quotationDate), 'MMM d, yyyy')}</TableCell>
                        <TableCell>{format(parseISO(q.validUntil), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="text-right">{`₹${q.total.toLocaleString('en-IN')}`}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{q.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Top Customers by Revenue</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => handleExport('customers')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Total Revenue</TableHead>
                      <TableHead className="text-right">Avg Order</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerRanking.map((customer, index) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <Badge variant={index < 3 ? 'default' : 'outline'}>{index + 1}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell className="text-right">{customer.orders}</TableCell>
                        <TableCell className="text-right font-semibold">{`₹${customer.total.toLocaleString('en-IN')}`}</TableCell>
                        <TableCell className="text-right">{`₹${Math.round(customer.total / customer.orders).toLocaleString('en-IN')}`}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forecasts">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Forecast</CardTitle>
                <CardDescription>Projected revenue based on pipeline and historical data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-muted/50 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-2">Pipeline Value</p>
                    <p className="text-3xl font-bold">
                      {`₹${quotations
                        .filter((q) => q.status === 'sent')
                        .reduce((sum, q) => sum + q.total, 0)
                        .toLocaleString('en-IN')}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">Active quotations</p>
                  </div>
                  <div className="p-6 bg-success/10 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-2">Expected Close (30d)</p>
                    <p className="text-3xl font-bold text-success">
                      {`₹${Math.round(
                        quotations
                          .filter((q) => q.status === 'sent')
                          .reduce((sum, q) => sum + q.total * 0.6, 0)
                      ).toLocaleString('en-IN')}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">60% weighted probability</p>
                  </div>
                  <div className="p-6 bg-primary/10 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-2">Recurring Revenue</p>
                    <p className="text-3xl font-bold text-primary">{`₹${Math.round(kpis.mrr * 12).toLocaleString('en-IN')}`}</p>
                    <p className="text-xs text-muted-foreground mt-2">Annual (ARR)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
