import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ACCOUNTING_NAV } from '@/lib/navigation/accounting';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAccounts, createAccount, updateAccount, Account } from '@/lib/data/accounting';
import { Plus, Search, Edit, Wallet, TrendingUp, TrendingDown, Building2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const typeIcons: Record<string, React.ReactNode> = {
  asset: <Wallet className="h-4 w-4 text-info" />,
  liability: <Building2 className="h-4 w-4 text-warning" />,
  equity: <DollarSign className="h-4 w-4 text-primary" />,
  revenue: <TrendingUp className="h-4 w-4 text-success" />,
  expense: <TrendingDown className="h-4 w-4 text-destructive" />,
};

export default function ChartOfAccounts() {
  const [accounts, setAccounts] = useState(getAccounts());
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'asset' as Account['type'],
    isReconcilable: false,
    isActive: true,
  });

  const filteredAccounts = accounts.filter(acc => {
    const matchesSearch = acc.name.toLowerCase().includes(search.toLowerCase()) ||
                          acc.code.includes(search);
    const matchesTab = activeTab === 'all' || acc.type === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleOpenDialog = (account?: Account) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        code: account.code,
        name: account.name,
        type: account.type,
        isReconcilable: account.isReconcilable,
        isActive: account.isActive,
      });
    } else {
      setEditingAccount(null);
      setFormData({
        code: '',
        name: '',
        type: 'asset',
        isReconcilable: false,
        isActive: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.code || !formData.name) {
      toast.error('Please fill in required fields');
      return;
    }

    if (editingAccount) {
      updateAccount(editingAccount.id, formData);
      toast.success('Account updated');
    } else {
      createAccount(formData);
      toast.success('Account created');
    }
    setAccounts(getAccounts());
    setDialogOpen(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const totals = {
    asset: accounts.filter(a => a.type === 'asset').reduce((sum, a) => sum + a.balance, 0),
    liability: accounts.filter(a => a.type === 'liability').reduce((sum, a) => sum + a.balance, 0),
    equity: accounts.filter(a => a.type === 'equity').reduce((sum, a) => sum + a.balance, 0),
    revenue: accounts.filter(a => a.type === 'revenue').reduce((sum, a) => sum + a.balance, 0),
    expense: accounts.filter(a => a.type === 'expense').reduce((sum, a) => sum + a.balance, 0),
  };

  return (
    <AppLayout title="Accounting" subtitle="Chart of Accounts" moduleNav={ACCOUNTING_NAV}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Chart of Accounts</h1>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            New Account
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(totals).map(([type, total]) => (
            <Card key={type}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  {typeIcons[type]}
                  <span className="text-sm text-muted-foreground capitalize">{type}</span>
                </div>
                <p className="text-lg font-bold mt-1">{formatCurrency(total)}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search accounts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="border-b px-4">
                <TabsList className="h-12">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="asset">Assets</TabsTrigger>
                  <TabsTrigger value="liability">Liabilities</TabsTrigger>
                  <TabsTrigger value="equity">Equity</TabsTrigger>
                  <TabsTrigger value="revenue">Revenue</TabsTrigger>
                  <TabsTrigger value="expense">Expenses</TabsTrigger>
                </TabsList>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Reconcilable</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-mono">{account.code}</TableCell>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {typeIcons[account.type]}
                          <span className="capitalize">{account.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(account.balance)}
                      </TableCell>
                      <TableCell>
                        {account.isReconcilable ? (
                          <Badge variant="outline">Yes</Badge>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={account.isActive ? 'default' : 'secondary'}>
                          {account.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(account)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAccount ? 'Edit Account' : 'New Account'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Account Code</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., 1000"
                />
              </div>
              <div>
                <Label>Account Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as Account['type'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asset">Asset</SelectItem>
                    <SelectItem value="liability">Liability</SelectItem>
                    <SelectItem value="equity">Equity</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Account Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Cash"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Reconcilable</Label>
              <Switch
                checked={formData.isReconcilable}
                onCheckedChange={(checked) => setFormData({ ...formData, isReconcilable: checked })}
              />
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
            <Button onClick={handleSave}>{editingAccount ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
