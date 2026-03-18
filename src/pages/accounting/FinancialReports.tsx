import { AppLayout } from '@/components/layout/AppLayout';
import { ACCOUNTING_NAV } from '@/lib/navigation/accounting';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getAccounts, getFinancialSummary } from '@/lib/data/accounting';

export default function FinancialReports() {
  const accounts = getAccounts();
  const summary = getFinancialSummary();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const assets = accounts.filter(a => a.type === 'asset');
  const liabilities = accounts.filter(a => a.type === 'liability');
  const equity = accounts.filter(a => a.type === 'equity');
  const revenue = accounts.filter(a => a.type === 'revenue');
  const expenses = accounts.filter(a => a.type === 'expense');

  return (
    <AppLayout title="Accounting" subtitle="Reports" moduleNav={ACCOUNTING_NAV}>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Financial Reports</h1>

        <Tabs defaultValue="balance-sheet">
          <TabsList>
            <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
            <TabsTrigger value="income-statement">Income Statement</TabsTrigger>
          </TabsList>

          <TabsContent value="balance-sheet" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Balance Sheet</CardTitle>
                <p className="text-sm text-muted-foreground">As of {new Date().toLocaleDateString()}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Assets */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Assets</h3>
                  <Table>
                    <TableBody>
                      {assets.map(acc => (
                        <TableRow key={acc.id}>
                          <TableCell className="font-mono text-muted-foreground w-20">{acc.code}</TableCell>
                          <TableCell>{acc.name}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(acc.balance)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold bg-muted/50">
                        <TableCell></TableCell>
                        <TableCell>Total Assets</TableCell>
                        <TableCell className="text-right">{formatCurrency(summary.totalAssets)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Liabilities */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Liabilities</h3>
                  <Table>
                    <TableBody>
                      {liabilities.map(acc => (
                        <TableRow key={acc.id}>
                          <TableCell className="font-mono text-muted-foreground w-20">{acc.code}</TableCell>
                          <TableCell>{acc.name}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(acc.balance)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold bg-muted/50">
                        <TableCell></TableCell>
                        <TableCell>Total Liabilities</TableCell>
                        <TableCell className="text-right">{formatCurrency(summary.totalLiabilities)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Equity */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Equity</h3>
                  <Table>
                    <TableBody>
                      {equity.map(acc => (
                        <TableRow key={acc.id}>
                          <TableCell className="font-mono text-muted-foreground w-20">{acc.code}</TableCell>
                          <TableCell>{acc.name}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(acc.balance)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell></TableCell>
                        <TableCell className="italic">Current Period Net Income</TableCell>
                        <TableCell className={`text-right font-medium ${summary.netIncome >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {formatCurrency(summary.netIncome)}
                        </TableCell>
                      </TableRow>
                      <TableRow className="font-bold bg-muted/50">
                        <TableCell></TableCell>
                        <TableCell>Total Equity</TableCell>
                        <TableCell className="text-right">{formatCurrency(summary.totalEquity + summary.netIncome)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Balance Check */}
                <div className="border-t pt-4">
                  <Table>
                    <TableBody>
                      <TableRow className="font-bold text-lg">
                        <TableCell className="w-20"></TableCell>
                        <TableCell>Total Liabilities + Equity</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(summary.totalLiabilities + summary.totalEquity + summary.netIncome)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="income-statement" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Income Statement</CardTitle>
                <p className="text-sm text-muted-foreground">For the period ending {new Date().toLocaleDateString()}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Revenue */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Revenue</h3>
                  <Table>
                    <TableBody>
                      {revenue.map(acc => (
                        <TableRow key={acc.id}>
                          <TableCell className="font-mono text-muted-foreground w-20">{acc.code}</TableCell>
                          <TableCell>{acc.name}</TableCell>
                          <TableCell className="text-right font-medium text-success">{formatCurrency(acc.balance)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold bg-muted/50">
                        <TableCell></TableCell>
                        <TableCell>Total Revenue</TableCell>
                        <TableCell className="text-right text-success">{formatCurrency(summary.totalRevenue)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Expenses */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Expenses</h3>
                  <Table>
                    <TableBody>
                      {expenses.map(acc => (
                        <TableRow key={acc.id}>
                          <TableCell className="font-mono text-muted-foreground w-20">{acc.code}</TableCell>
                          <TableCell>{acc.name}</TableCell>
                          <TableCell className="text-right font-medium text-destructive">{formatCurrency(acc.balance)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold bg-muted/50">
                        <TableCell></TableCell>
                        <TableCell>Total Expenses</TableCell>
                        <TableCell className="text-right text-destructive">{formatCurrency(summary.totalExpenses)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Net Income */}
                <div className="border-t pt-4">
                  <Table>
                    <TableBody>
                      <TableRow className="font-bold text-lg">
                        <TableCell className="w-20"></TableCell>
                        <TableCell>Net Income</TableCell>
                        <TableCell className={`text-right ${summary.netIncome >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {formatCurrency(summary.netIncome)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
