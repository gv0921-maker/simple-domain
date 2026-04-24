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
import { getSubscriptions, saveSubscription } from '@/lib/services/sales/storage';
import type { Subscription, SubscriptionStatus, BillingCycle } from '@/lib/services/sales/types';

import { SALES_NAV } from '@/lib/navigation/sales';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
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
  
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => getSubscriptions());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'all'>('all');

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

  const handleUpdateStatus = useCallback((id: string, status: SubscriptionStatus) => {
    const sub = subscriptions.find((s) => s.id === id);
    if (!sub) return;

    saveSubscription({ ...sub, status });
    setSubscriptions(getSubscriptions());
    toast({ title: `Subscription ${status}` });
  }, [subscriptions, toast]);
  return (
    <AppLayout title="Sales" moduleNav={SALES_NAV}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Subscriptions</h1>
            <p className="text-muted-foreground">Manage recurring billing and services</p>
          </div>
          <Button onClick={() => navigate('/sales/subscriptions/new')} className="gap-2">
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
              <div className="text-2xl font-bold">{`₹${Math.round(stats.mrr).toLocaleString('en-IN')}`}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">ARR</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{`₹${Math.round(stats.arr).toLocaleString('en-IN')}`}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder=""
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
                    <Button variant="link" onClick={() => navigate('/sales/subscriptions/new')}>
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
                    onClick={() => navigate(`/sales/subscriptions/${sub.id}/edit`)}
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
                        <p className="font-semibold">{`₹${sub.total.toLocaleString('en-IN')}`}</p>
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
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/sales/subscriptions/${sub.id}/edit`); }}>
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

    </AppLayout>
  );
}
