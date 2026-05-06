import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search,
  Plus,
  MoreHorizontal,
  Trash2,
  ShoppingCart,
  Calendar,
  Truck,
  CheckCircle,
  Eye,
  Lock,
  XCircle,
  FileText,
  Package,
} from 'lucide-react';
import { getSalesOrders, deleteSalesOrder, saveSalesOrder } from '@/lib/services/sales/storage';
import type { SalesOrder, SalesOrderStatus } from '@/lib/services/sales/types';
import { SALES_NAV } from '@/lib/navigation/sales';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { SalesImportExport } from '@/components/sales/SalesImportExport';

const STATUS_CONFIG: Record<SalesOrderStatus, { label: string; className: string; icon: typeof ShoppingCart }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground', icon: FileText },
  estimate: { label: 'Estimate', className: 'bg-muted text-muted-foreground', icon: FileText },
  confirmed: { label: 'Confirmed', className: 'bg-success/20 text-success border-success', icon: CheckCircle },
  ready_to_pick: { label: 'Ready to Pick', className: 'bg-info/20 text-info border-info', icon: ShoppingCart },
  dispatched: { label: 'Dispatched', className: 'bg-primary/20 text-primary border-primary', icon: ShoppingCart },
  delivered: { label: 'Delivered', className: 'bg-success/20 text-success border-success', icon: CheckCircle },
  locked: { label: 'Locked', className: 'bg-primary/20 text-primary border-primary', icon: Lock },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/20 text-destructive border-destructive', icon: XCircle },
};

const DELIVERY_STATUS_CONFIG = {
  pending: { label: 'Pending', className: 'bg-warning/20 text-warning-foreground' },
  partial: { label: 'Partial', className: 'bg-info/20 text-info' },
  done: { label: 'Delivered', className: 'bg-success/20 text-success' },
};

export default function SalesOrdersList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const { toast } = useToast();
  const { user } = useAuth();
  const [orders, setOrders] = useState<SalesOrder[]>(() => getSalesOrders());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SalesOrderStatus | 'all'>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ orderId: string; action: 'confirm' | 'lock' | 'cancel' } | null>(null);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        o.reference.toLowerCase().includes(search.toLowerCase()) ||
        o.customerName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const stats = useMemo(() => ({
    total: orders.length,
    draft: orders.filter((o) => o.status === 'draft').length,
    confirmed: orders.filter((o) => o.status === 'confirmed').length,
    locked: orders.filter((o) => o.status === 'locked').length,
    pendingDelivery: orders.filter((o) => o.deliveryStatus === 'pending' && o.status !== 'cancelled').length,
    totalRevenue: orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total, 0),
    pendingRevenue: orders
      .filter((o) => o.status === 'confirmed')
      .reduce((sum, o) => sum + o.total, 0),
  }), [orders]);

  const handleUpdateStatus = useCallback((orderId: string, status: SalesOrderStatus) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const updates: Partial<SalesOrder> = { status };
    if (status === 'confirmed') {
      updates.confirmedAt = new Date().toISOString();
      updates.confirmedBy = user?.name;
      updates.activities = [
        ...order.activities,
        {
          id: crypto.randomUUID(),
          userId: user?.id || '1',
          userName: user?.name || 'System',
          action: 'Order confirmed',
          timestamp: new Date().toISOString(),
        },
      ];
    }
    if (status === 'locked') {
      updates.lockedAt = new Date().toISOString();
      updates.lockedBy = user?.name;
      updates.activities = [
        ...order.activities,
        {
          id: crypto.randomUUID(),
          userId: user?.id || '1',
          userName: user?.name || 'System',
          action: 'Order locked',
          timestamp: new Date().toISOString(),
        },
      ];
    }

    saveSalesOrder({ ...order, ...updates });
    setOrders(getSalesOrders());
    toast({ title: `Order ${status}` });
    setConfirmDialogOpen(false);
  }, [orders, user, toast]);

  const confirmDelete = useCallback(() => {
    if (orderToDelete) {
      try {
        deleteSalesOrder(orderToDelete);
        setOrders(getSalesOrders());
        toast({ title: 'Order deleted' });
      } catch (error: any) {
        toast({ title: error.message, variant: 'destructive' });
      }
    }
    setDeleteDialogOpen(false);
    setOrderToDelete(null);
  }, [orderToDelete, toast]);

  return (
    <AppLayout title="Sales" moduleNav={SALES_NAV}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Sales Orders</h1>
            <p className="text-muted-foreground">Manage customer orders and fulfillment</p>
          </div>
          <Button onClick={() => navigate('/sales/orders/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            New Order
          </Button>
          <SalesImportExport type="orders" onImportComplete={() => setOrders(getSalesOrders())} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="animate-slide-up cursor-pointer hover:ring-2 ring-primary/20 transition-all" onClick={() => setStatusFilter('all')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up cursor-pointer hover:ring-2 ring-primary/20 transition-all" style={{ animationDelay: '50ms' }} onClick={() => setStatusFilter('draft')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Drafts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.draft}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up cursor-pointer hover:ring-2 ring-primary/20 transition-all" style={{ animationDelay: '100ms' }} onClick={() => setStatusFilter('confirmed')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Confirmed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.confirmed}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">To Deliver</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.pendingDelivery}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '200ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{`₹${stats.totalRevenue.toLocaleString('en-IN')}`}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '250ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-info">{`₹${stats.pendingRevenue.toLocaleString('en-IN')}`}</div>
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
            {(['all', 'draft', 'confirmed', 'locked', 'cancelled'] as const).map((status) => (
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
                <TableHead>Order Date</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No orders found</p>
                    <Button variant="link" onClick={() => navigate('/sales/orders/new')}>
                      Create your first order
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order, index) => {
                  const StatusIcon = STATUS_CONFIG[order.status].icon;
                  const isHighlighted = order.id === highlightId;
                  return (
                    <TableRow
                      key={order.id}
                      className={cn(
                        'animate-fade-in cursor-pointer hover:bg-muted/50',
                        isHighlighted && 'bg-primary/10 ring-2 ring-primary/20'
                      )}
                      style={{ animationDelay: `${index * 30}ms` }}
                      onClick={() => navigate(`/sales/orders/${order.id}`)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4 text-primary" />
                          {order.reference}
                          {order.quotationId && (
                            <Badge variant="outline" className="text-xs">From Quote</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customerName}</p>
                          {order.salespersonName && (
                            <p className="text-xs text-muted-foreground">{order.salespersonName}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(parseISO(order.orderDate), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.deliveryDate && (
                          <div className="flex items-center gap-1 text-sm">
                            <Truck className="h-3 w-3 text-muted-foreground" />
                            {format(parseISO(order.deliveryDate), 'MMM d')}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <p className="font-semibold">{`₹${order.total.toLocaleString('en-IN')}`}</p>
                          <p className="text-xs text-muted-foreground">{order.lines.length} items</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('font-normal gap-1', STATUS_CONFIG[order.status].className)}>
                          <StatusIcon className="h-3 w-3" />
                          {STATUS_CONFIG[order.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.deliveryStatus && order.status !== 'cancelled' && (
                          <Badge className={cn('font-normal', DELIVERY_STATUS_CONFIG[order.deliveryStatus].className)}>
                            <Package className="h-3 w-3 mr-1" />
                            {DELIVERY_STATUS_CONFIG[order.deliveryStatus].label}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/sales/orders/${order.id}`); }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            {order.status === 'draft' && (
                              <>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/sales/orders/${order.id}/edit`); }}>
                                  <FileText className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmAction({ orderId: order.id, action: 'confirm' });
                                  setConfirmDialogOpen(true);
                                }}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Confirm Order
                                </DropdownMenuItem>
                              </>
                            )}
                            {order.status === 'confirmed' && (
                              <>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmAction({ orderId: order.id, action: 'lock' });
                                  setConfirmDialogOpen(true);
                                }}>
                                  <Lock className="h-4 w-4 mr-2" />
                                  Lock Order
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmAction({ orderId: order.id, action: 'cancel' });
                                  setConfirmDialogOpen(true);
                                }}>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancel Order
                                </DropdownMenuItem>
                              </>
                            )}
                            {order.status === 'draft' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOrderToDelete(order.id);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Only draft orders can be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Change Confirmation */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.action === 'confirm' && 'Confirm Order?'}
              {confirmAction?.action === 'lock' && 'Lock Order?'}
              {confirmAction?.action === 'cancel' && 'Cancel Order?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action === 'confirm' && 'This will confirm the order and notify the customer. Stock will be reserved.'}
              {confirmAction?.action === 'lock' && 'Locked orders cannot be edited. This is typically done after delivery.'}
              {confirmAction?.action === 'cancel' && 'This will cancel the order and release any reserved stock.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmAction && handleUpdateStatus(confirmAction.orderId, confirmAction.action === 'confirm' ? 'confirmed' : confirmAction.action === 'lock' ? 'locked' : 'cancelled')}
              className={confirmAction?.action === 'cancel' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {confirmAction?.action === 'confirm' && 'Confirm'}
              {confirmAction?.action === 'lock' && 'Lock'}
              {confirmAction?.action === 'cancel' && 'Cancel Order'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
