import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Plus,
  MoreHorizontal,
  Trash2,
  RefreshCw,
  Calendar,
  Play,
  Pause,
  XCircle,
  Eye,
  DollarSign,
} from 'lucide-react';
import { getContacts } from '@/lib/data/sales';
import { getSubscriptions, saveSubscription } from '@/lib/data/sales/storage';
import type { Subscription, SubscriptionStatus, BillingCycle } from '@/lib/data/sales/types';
import { getProducts } from '@/lib/data/inventory';
import { SALES_NAV } from '@/lib/navigation/sales';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO, addMonths, addQuarters, addYears } from 'date-fns';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<SubscriptionStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  active: { label: 'Active', className: 'bg-success/20 text-success border-success' },
  paused: { label: 'Paused', className: 'bg-warning/20 text-warning-foreground border-warning' },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/20 text-destructive border-destructive' },
};

const BILLING_CYCLE_CONFIG: Record<BillingCycle, { label: string; months: number }> = {
  monthly: { label: 'Monthly', months: 1 },
  quarterly: { label: 'Quarterly', months: 3 },
  yearly: { label: 'Yearly', months: 12 },
};

export default function SubscriptionsList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => getSubscriptions());
  const [contacts] = useState(() => getContacts());
  const [products] = useState(() => getProducts());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'all'>('all');
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [formData, setFormData] = useState({
    customerId: '',
    billingCycle: 'monthly' as BillingCycle,
    productId: '',
    quantity: 1,
    unitPrice: 0,
  });

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((s) => {
      const matchesSearch =
        s.reference.toLowerCase().includes(search.toLowerCase()) ||
        s.customerName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [subscriptions, search, statusFilter]);

  const stats = useMemo(() => ({
    total: subscriptions.length,
    active: subscriptions.filter((s) => s.status === 'active').length,
    paused: subscriptions.filter((s) => s.status === 'paused').length,
    mrr: subscriptions
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => {
        const monthlyValue = s.billingCycle === 'monthly' ? s.total :
          s.billingCycle === 'quarterly' ? s.total / 3 :
          s.total / 12;
        return sum + monthlyValue;
      }, 0),
    arr: subscriptions
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => {
        const yearlyValue = s.billingCycle === 'yearly' ? s.total :
          s.billingCycle === 'quarterly' ? s.total * 4 :
          s.total * 12;
        return sum + yearlyValue;
      }, 0),
  }), [subscriptions]);

  const handleOpenDialog = useCallback((sub?: Subscription) => {
    if (sub) {
      setEditingSub(sub);
      setFormData({
        customerId: sub.customerId,
        billingCycle: sub.billingCycle,
        productId: sub.lines[0]?.productId || '',
        quantity: sub.lines[0]?.quantity || 1,
        unitPrice: sub.lines[0]?.unitPrice || 0,
      });
    } else {
      setEditingSub(null);
      setFormData({
        customerId: '',
        billingCycle: 'monthly',
        productId: '',
        quantity: 1,
        unitPrice: 0,
      });
    }
    setIsDialogOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!formData.customerId || !formData.productId) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    const contact = contacts.find((c) => c.id === formData.customerId);
    const product = products.find((p) => p.id === formData.productId);
    if (!contact || !product) return;

    const subtotal = formData.unitPrice * formData.quantity;
    const taxAmount = subtotal * 0.18;

    const getNextBillingDate = (cycle: BillingCycle, fromDate: Date) => {
      switch (cycle) {
        case 'monthly': return addMonths(fromDate, 1);
        case 'quarterly': return addQuarters(fromDate, 1);
        case 'yearly': return addYears(fromDate, 1);
      }
    };

    const now = new Date();
    const subData: Subscription = {
      id: editingSub?.id || crypto.randomUUID(),
      reference: editingSub?.reference || `SUB-${now.getFullYear()}-${String(subscriptions.length + 1).padStart(4, '0')}`,
      customerId: formData.customerId,
      customerName: contact.company ? `${contact.name} - ${contact.company}` : contact.name,
      status: editingSub?.status || 'draft',
      billingCycle: formData.billingCycle,
      startDate: editingSub?.startDate || now.toISOString().split('T')[0],
      nextBillingDate: editingSub?.nextBillingDate || getNextBillingDate(formData.billingCycle, now).toISOString().split('T')[0],
      lines: [{
        id: crypto.randomUUID(),
        productId: formData.productId,
        productName: product.name,
        quantity: formData.quantity,
        unitPrice: formData.unitPrice,
        discount: 0,
      }],
      subtotal,
      taxAmount,
      total: subtotal + taxAmount,
      currency: 'USD',
      orderHistory: editingSub?.orderHistory || [],
      createdBy: editingSub?.createdBy || user?.name || 'System',
      createdAt: editingSub?.createdAt || now.toISOString(),
      updatedAt: now.toISOString(),
    };

    saveSubscription(subData);
    setSubscriptions(getSubscriptions());
    setIsDialogOpen(false);
    toast({ title: editingSub ? 'Subscription updated' : 'Subscription created' });
  }, [formData, contacts, products, editingSub, subscriptions.length, user, toast]);

  const handleUpdateStatus = useCallback((id: string, status: SubscriptionStatus) => {
    const sub = subscriptions.find((s) => s.id === id);
    if (!sub) return;

    saveSubscription({ ...sub, status });
    setSubscriptions(getSubscriptions());
    toast({ title: `Subscription ${status}` });
  }, [subscriptions, toast]);

  const handleProductChange = useCallback((productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setFormData((prev) => ({
        ...prev,
        productId,
        unitPrice: product.salePrice,
      }));
    }
  }, [products]);

  return (
    <AppLayout title="Sales" moduleNav={SALES_NAV}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Subscriptions</h1>
            <p className="text-muted-foreground">Manage recurring billing and services</p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            New Subscription
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="animate-slide-up">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.active}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '50ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Paused</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.paused}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">MRR</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${Math.round(stats.mrr).toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">ARR</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${Math.round(stats.arr).toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search subscriptions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'active', 'paused', 'draft', 'cancelled'] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className="capitalize"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        {/* Table */}
        <Card className="animate-fade-in">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Billing Cycle</TableHead>
                <TableHead>Next Billing</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No subscriptions found</p>
                    <Button variant="link" onClick={() => handleOpenDialog()}>
                      Create your first subscription
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubscriptions.map((sub, index) => (
                  <TableRow
                    key={sub.id}
                    className="animate-fade-in cursor-pointer hover:bg-muted/50"
                    style={{ animationDelay: `${index * 30}ms` }}
                    onClick={() => handleOpenDialog(sub)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 text-primary" />
                        {sub.reference}
                      </div>
                    </TableCell>
                    <TableCell>{sub.customerName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {BILLING_CYCLE_CONFIG[sub.billingCycle].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {format(parseISO(sub.nextBillingDate), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div>
                        <p className="font-semibold">${sub.total.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">/{sub.billingCycle.replace('ly', '')}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('font-normal', STATUS_CONFIG[sub.status].className)}>
                        {STATUS_CONFIG[sub.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenDialog(sub); }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View/Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {sub.status === 'draft' && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleUpdateStatus(sub.id, 'active'); }}>
                              <Play className="h-4 w-4 mr-2" />
                              Activate
                            </DropdownMenuItem>
                          )}
                          {sub.status === 'active' && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleUpdateStatus(sub.id, 'paused'); }}>
                              <Pause className="h-4 w-4 mr-2" />
                              Pause
                            </DropdownMenuItem>
                          )}
                          {sub.status === 'paused' && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleUpdateStatus(sub.id, 'active'); }}>
                              <Play className="h-4 w-4 mr-2" />
                              Resume
                            </DropdownMenuItem>
                          )}
                          {sub.status !== 'cancelled' && (
                            <DropdownMenuItem
                              onClick={(e) => { e.stopPropagation(); handleUpdateStatus(sub.id, 'cancelled'); }}
                              className="text-destructive"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingSub ? 'Edit Subscription' : 'New Subscription'}</DialogTitle>
            <DialogDescription>
              {editingSub ? 'Update subscription details' : 'Set up a recurring billing'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Customer *</Label>
              <Select
                value={formData.customerId}
                onValueChange={(v) => setFormData({ ...formData, customerId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} {c.company && `- ${c.company}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Billing Cycle</Label>
              <Select
                value={formData.billingCycle}
                onValueChange={(v: BillingCycle) => setFormData({ ...formData, billingCycle: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Product/Service *</Label>
              <Select
                value={formData.productId}
                onValueChange={handleProductChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} - ${p.salePrice}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Unit Price</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${(formData.unitPrice * formData.quantity).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Tax (18%)</span>
                <span>${((formData.unitPrice * formData.quantity) * 0.18).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total per {formData.billingCycle.replace('ly', '')}</span>
                <span>${((formData.unitPrice * formData.quantity) * 1.18).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>
              {editingSub ? 'Update' : 'Create'} Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
