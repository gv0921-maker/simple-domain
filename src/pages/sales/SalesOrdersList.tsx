import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  ShoppingCart,
  DollarSign,
  Calendar,
  Truck,
  CheckCircle,
  Eye,
  Package,
} from 'lucide-react';
import { getSalesOrders, saveSalesOrder, getContacts, type SalesOrder, type OrderLine, type OrderStatus, type Contact } from '@/lib/data/sales';
import { getProducts, type Product } from '@/lib/data/inventory';
import { getItem, setItem } from '@/lib/storage';
import { SALES_NAV } from '@/lib/navigation/sales';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  sent: { label: 'Sent', className: 'bg-info/20 text-info border-info' },
  confirmed: { label: 'Confirmed', className: 'bg-success/20 text-success border-success' },
  done: { label: 'Done', className: 'bg-primary/20 text-primary border-primary' },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/20 text-destructive border-destructive' },
};

export default function SalesOrdersList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [orders, setOrders] = useState<SalesOrder[]>(getSalesOrders());
  const [contacts] = useState<Contact[]>(getContacts());
  const [products] = useState<Product[]>(getProducts());
  const [search, setSearch] = useState('');

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<SalesOrder | null>(null);
  const [formData, setFormData] = useState({
    customerId: '',
    deliveryDate: '',
    notes: '',
  });
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [newLine, setNewLine] = useState({
    productId: '',
    quantity: 1,
    discount: 0,
  });

  const filteredOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        o.reference.toLowerCase().includes(search.toLowerCase()) ||
        o.customerName.toLowerCase().includes(search.toLowerCase())
    );
  }, [orders, search]);

  const stats = useMemo(() => ({
    total: orders.length,
    confirmed: orders.filter((o) => o.status === 'confirmed').length,
    revenue: orders.filter((o) => o.status === 'done').reduce((sum, o) => sum + o.total, 0),
    pending: orders.filter((o) => o.status === 'confirmed').reduce((sum, o) => sum + o.total, 0),
  }), [orders]);

  const calculateLineTotal = (productId: string, quantity: number, discount: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return 0;
    return product.salePrice * quantity * (1 - discount / 100);
  };

  const handleAddLine = () => {
    if (!newLine.productId) {
      toast({ title: 'Select a product', variant: 'destructive' });
      return;
    }

    const product = products.find((p) => p.id === newLine.productId);
    if (!product) return;

    const line: OrderLine = {
      id: crypto.randomUUID(),
      productId: product.id,
      productName: product.name,
      quantity: newLine.quantity,
      unitPrice: product.salePrice,
      discount: newLine.discount,
      total: calculateLineTotal(product.id, newLine.quantity, newLine.discount),
    };

    setLines((prev) => [...prev, line]);
    setNewLine({ productId: '', quantity: 1, discount: 0 });
  };

  const handleRemoveLine = (lineId: string) => {
    setLines((prev) => prev.filter((l) => l.id !== lineId));
  };

  const handleOpenDialog = (order?: SalesOrder) => {
    if (order) {
      setEditingOrder(order);
      setFormData({
        customerId: order.customerId,
        deliveryDate: order.deliveryDate || '',
        notes: order.notes || '',
      });
      setLines(order.lines);
    } else {
      setEditingOrder(null);
      setFormData({
        customerId: '',
        deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: '',
      });
      setLines([]);
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.customerId || lines.length === 0) {
      toast({ title: 'Select a customer and add products', variant: 'destructive' });
      return;
    }

    const customer = contacts.find((c) => c.id === formData.customerId);
    const subtotal = lines.reduce((sum, l) => sum + l.total, 0);
    const tax = subtotal * 0.18;

    const orderData: SalesOrder = {
      id: editingOrder?.id || crypto.randomUUID(),
      reference: editingOrder?.reference || `SO-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, '0')}`,
      customerId: formData.customerId,
      customerName: customer ? `${customer.name}${customer.company ? ` - ${customer.company}` : ''}` : '',
      status: editingOrder?.status || 'draft',
      orderDate: editingOrder?.orderDate || new Date().toISOString().split('T')[0],
      deliveryDate: formData.deliveryDate,
      lines,
      subtotal,
      tax,
      total: subtotal + tax,
      notes: formData.notes,
      createdBy: user?.name || 'System',
      createdAt: editingOrder?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveSalesOrder(orderData);
    setOrders(getSalesOrders());
    setIsDialogOpen(false);
    toast({
      title: editingOrder ? 'Order Updated' : 'Order Created',
      description: `${orderData.reference} has been saved.`,
    });
  };

  const handleUpdateStatus = (id: string, status: OrderStatus) => {
    const order = orders.find((o) => o.id === id);
    if (order) {
      saveSalesOrder({ ...order, status, updatedAt: new Date().toISOString() });
      setOrders(getSalesOrders());
      toast({ title: `Order marked as ${status}` });
    }
  };

  const handleDelete = (id: string) => {
    const updated = orders.filter((o) => o.id !== id);
    setItem('salesOrders', updated);
    setOrders(updated);
    toast({ title: 'Order Deleted' });
  };

  return (
    <AppLayout title="CRM" moduleNav={SALES_NAV}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Sales Orders</h1>
            <p className="text-muted-foreground">Manage customer orders and fulfillment</p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            New Order
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="animate-slide-up">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '50ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                To Fulfill
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.confirmed}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{`₹${stats.pending.toLocaleString('en-IN')}`}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{`₹${stats.revenue.toLocaleString('en-IN')}`}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder=""
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
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
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order, index) => (
                  <TableRow
                    key={order.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-primary" />
                        {order.reference}
                      </div>
                    </TableCell>
                    <TableCell>{order.customerName}</TableCell>
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
                    <TableCell className="text-right font-semibold">
                      ₹{order.total.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('font-normal', STATUS_CONFIG[order.status].className)}>
                        {STATUS_CONFIG[order.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog(order)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View/Edit
                          </DropdownMenuItem>
                          {order.status === 'draft' && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'confirmed')}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Confirm Order
                            </DropdownMenuItem>
                          )}
                          {order.status === 'confirmed' && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'done')}>
                              <Package className="h-4 w-4 mr-2" />
                              Mark as Done
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDelete(order.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingOrder ? `Edit ${editingOrder.reference}` : 'New Sales Order'}
              </DialogTitle>
              <DialogDescription>
                {editingOrder ? 'Update order details' : 'Create a new sales order'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
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
                          {c.name} {c.company ? `- ${c.company}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Delivery Date</Label>
                  <Input
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Add Products */}
              <div className="space-y-4">
                <Label>Products</Label>
                <div className="flex gap-2 p-3 bg-muted/50 rounded-lg">
                  <Select
                    value={newLine.productId}
                    onValueChange={(v) => setNewLine({ ...newLine, productId: v })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} - ₹{p.salePrice} (Stock: {p.stockOnHand})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="1"
                    value={newLine.quantity}
                    onChange={(e) => setNewLine({ ...newLine, quantity: parseInt(e.target.value) || 1 })}
                    className="w-20"
                    placeholder=""
                  />
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={newLine.discount}
                    onChange={(e) => setNewLine({ ...newLine, discount: parseInt(e.target.value) || 0 })}
                    className="w-20"
                    placeholder=""
                  />
                  <Button onClick={handleAddLine}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {lines.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Disc.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-[40px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell>{line.productName}</TableCell>
                          <TableCell className="text-right">{line.quantity}</TableCell>
                          <TableCell className="text-right">₹{line.unitPrice}</TableCell>
                          <TableCell className="text-right">{line.discount}%</TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{line.total.toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleRemoveLine(line.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {lines.length > 0 && (
                  <div className="flex justify-end">
                    <div className="w-48 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>₹{lines.reduce((s, l) => s + l.total, 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax (18%)</span>
                        <span>₹{(lines.reduce((s, l) => s + l.total, 0) * 0.18).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-1">
                        <span>Total</span>
                        <span>₹{(lines.reduce((s, l) => s + l.total, 0) * 1.18).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingOrder ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
