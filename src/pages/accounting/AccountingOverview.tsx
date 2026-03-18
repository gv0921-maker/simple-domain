import { AppLayout } from '@/components/layout/AppLayout';
import { ACCOUNTING_NAV } from '@/lib/navigation/accounting';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getFinancialSummary, getInvoices } from '@/lib/data/accounting';
import { DollarSign, TrendingUp, TrendingDown, FileText, CreditCard, ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AccountingOverview() {
  const navigate = useNavigate();
  const summary = getFinancialSummary();
  const invoices = getInvoices();
  const recentInvoices = invoices.slice(0, 5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  return (
    <AppLayout title="Accounting" moduleNav={ACCOUNTING_NAV}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Accounting Overview</h1>
            <p className="text-muted-foreground">Financial summary and key metrics</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/invoicing')}>
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
            <Button onClick={() => navigate('/accounting/journal')}>
              <FileText className="h-4 w-4 mr-2" />
              Journal Entry
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold">{formatCurrency(summary.totalExpenses)}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Receivables</p>
                  <p className="text-2xl font-bold">{formatCurrency(summary.receivables)}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-info/10 flex items-center justify-center">
                  <ArrowUpRight className="h-5 w-5 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Payables</p>
                  <p className="text-2xl font-bold">{formatCurrency(summary.payables)}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
                  <ArrowDownRight className="h-5 w-5 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Net Income Banner */}
        <Card className={summary.netIncome >= 0 ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Income</p>
                <p className={`text-3xl font-bold ${summary.netIncome >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(summary.netIncome)}
                </p>
              </div>
              <DollarSign className={`h-12 w-12 ${summary.netIncome >= 0 ? 'text-success' : 'text-destructive'}`} />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Invoices */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Invoices</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/invoicing')}>
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{invoice.number}</p>
                      <p className="text-sm text-muted-foreground">{invoice.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(invoice.total)}</p>
                      <Badge variant={
                        invoice.status === 'paid' ? 'default' :
                        invoice.status === 'overdue' ? 'destructive' :
                        invoice.status === 'sent' ? 'outline' : 'secondary'
                      }>
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/accounting/chart')}>
            <div className="flex flex-col items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium">Chart of Accounts</span>
            </div>
          </Card>
          <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/accounting/journal')}>
            <div className="flex flex-col items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium">Journal Entries</span>
            </div>
          </Card>
          <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/accounting/payments')}>
            <div className="flex flex-col items-center gap-2">
              <CreditCard className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium">Payments</span>
            </div>
          </Card>
          <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/accounting/reports')}>
            <div className="flex flex-col items-center gap-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium">Reports</span>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
