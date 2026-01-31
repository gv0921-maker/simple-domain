import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
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
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  Lock,
  XCircle,
  Package,
  AlertTriangle,
  ShoppingCart,
} from 'lucide-react';
import {
  getSalesOrder,
  saveSalesOrder,
  generateOrderReference,
  getPricelists,
  getTaxRules,
  calculateLineTotal,
  applyPricelistPrice,
  checkStockAvailability,
} from '@/lib/data/sales/storage';
import type { SalesOrder, SalesOrderLine, SalesOrderStatus, DiscountType } from '@/lib/data/sales/types';
import { getContacts } from '@/lib/data/sales';
import { getProducts } from '@/lib/data/inventory';
import { SALES_NAV } from '@/lib/navigation/sales';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

const PAYMENT_TERMS = [
  { value: 'immediate', label: 'Immediate Payment' },
  { value: 'net15', label: 'Net 15' },
  { value: 'net30', label: 'Net 30' },
  { value: 'net45', label: 'Net 45' },
  { value: 'net60', label: 'Net 60' },
];

const STATUS_CONFIG: Record<SalesOrderStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  confirmed: { label: 'Confirmed', className: 'bg-success/20 text-success border-success' },
  locked: { label: 'Locked', className: 'bg-primary/20 text-primary border-primary' },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/20 text-destructive border-destructive' },
};

export default function SalesOrderForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isNew = id === 'new' || !id;
  
  const [contacts] = useState(() => getContacts());
  const [products] = useState(() => getProducts());
  const [pricelists] = useState(() => getPricelists());
  const [taxRules] = useState(() => getTaxRules());
  
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'confirm' | 'lock' | 'cancel' | null>(null);
  
  const [formData, setFormData] = useState<Partial<SalesOrder>>({
    customerId: '',
    customerName: '',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: addDays(new Date(), 7).toISOString().split('T')[0],
    currency: 'USD',
    pricelistId: 'pl_standard',
    paymentTerms: 'net30',
    deliveryAddress: '',
    billingAddress: '',
    notes: '',
    status: 'draft',
    deliveryStatus: 'pending',
  });
  
  const [lines, setLines] = useState<SalesOrderLine[]>([]);
  const [newLine, setNewLine] = useState({
    productId: '',
    quantity: 1,
    discount: 0,
    discountType: 'percentage' as DiscountType,
    taxId: 'tax_18',
  });
  
  // Load existing order
  useEffect(() => {
    if (!isNew && id) {
      const order = getSalesOrder(id);
      if (order) {
        setFormData(order);
        setLines(order.lines);
      } else {
        toast({ title: 'Order not found', variant: 'destructive' });
        navigate('/sales/orders');
      }
      setLoading(false);
    }
  }, [id, isNew, navigate, toast]);
  
  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
    const taxAmount = lines.reduce((sum, line) => sum + line.taxAmount, 0);
    
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      total: Math.round((subtotal + taxAmount) * 100) / 100,
    };
  }, [lines]);
  
  const handleCustomerChange = useCallback((customerId: string) => {
    const contact = contacts.find((c) => c.id === customerId);
    if (contact) {
      setFormData((prev) => ({
        ...prev,
        customerId,
        customerName: contact.company ? `${contact.name} - ${contact.company}` : contact.name,
        deliveryAddress: contact.address || '',
        billingAddress: contact.address || '',
      }));
    }
  }, [contacts]);
  
  const handleAddLine = useCallback(() => {
    if (!newLine.productId) {
      toast({ title: 'Please select a product', variant: 'destructive' });
      return;
    }
    
    const product = products.find((p) => p.id === newLine.productId);
    if (!product) return;
    
    const unitPrice = applyPricelistPrice(product.id, newLine.quantity, formData.pricelistId);
    const { subtotal, taxAmount, total } = calculateLineTotal(
      unitPrice,
      newLine.quantity,
      newLine.discount,
      newLine.discountType,
      [newLine.taxId]
    );
    
    const stockInfo = checkStockAvailability(product.id, newLine.quantity);
    
    const line: SalesOrderLine = {
      id: crypto.randomUUID(),
      productId: product.id,
      productName: product.name,
      quantity: newLine.quantity,
      deliveredQuantity: 0,
      invoicedQuantity: 0,
      unitPrice,
      discount: newLine.discount,
      discountType: newLine.discountType,
      taxIds: [newLine.taxId],
      subtotal,
      taxAmount,
      total,
      reservedStock: false,
    };
    
    setLines((prev) => [...prev, line]);
    setNewLine({ productId: '', quantity: 1, discount: 0, discountType: 'percentage', taxId: 'tax_18' });
  }, [newLine, products, formData.pricelistId, toast]);
  
  const handleUpdateLine = useCallback((lineId: string, updates: Partial<SalesOrderLine>) => {
    setLines((prev) => prev.map((line) => {
      if (line.id !== lineId) return line;
      
      const updatedLine = { ...line, ...updates };
      const { subtotal, taxAmount, total } = calculateLineTotal(
        updatedLine.unitPrice,
        updatedLine.quantity,
        updatedLine.discount,
        updatedLine.discountType,
        updatedLine.taxIds
      );
      
      return { ...updatedLine, subtotal, taxAmount, total };
    }));
  }, []);
  
  const handleRemoveLine = useCallback((lineId: string) => {
    setLines((prev) => prev.filter((line) => line.id !== lineId));
  }, []);
  
  const handleSave = useCallback(async (newStatus?: SalesOrderStatus) => {
    if (!formData.customerId) {
      toast({ title: 'Please select a customer', variant: 'destructive' });
      return;
    }
    if (lines.length === 0) {
      toast({ title: 'Please add at least one product', variant: 'destructive' });
      return;
    }
    
    setSaving(true);
    
    try {
      const orderData: SalesOrder = {
        id: isNew ? crypto.randomUUID() : id!,
        reference: formData.reference || generateOrderReference(),
        customerId: formData.customerId!,
        customerName: formData.customerName!,
        contactId: formData.contactId,
        quotationId: formData.quotationId,
        orderDate: formData.orderDate!,
        deliveryDate: formData.deliveryDate,
        salespersonId: user?.id,
        salespersonName: user?.name,
        currency: formData.currency || 'USD',
        pricelistId: formData.pricelistId,
        paymentTerms: formData.paymentTerms,
        deliveryAddress: formData.deliveryAddress,
        billingAddress: formData.billingAddress,
        lines,
        subtotal: totals.subtotal,
        discountAmount: 0,
        taxAmount: totals.taxAmount,
        total: totals.total,
        notes: formData.notes,
        status: newStatus || formData.status || 'draft',
        deliveryStatus: formData.deliveryStatus || 'pending',
        confirmedAt: newStatus === 'confirmed' ? new Date().toISOString() : formData.confirmedAt,
        confirmedBy: newStatus === 'confirmed' ? user?.name : formData.confirmedBy,
        lockedAt: newStatus === 'locked' ? new Date().toISOString() : formData.lockedAt,
        lockedBy: newStatus === 'locked' ? user?.name : formData.lockedBy,
        activities: formData.activities || [{
          id: crypto.randomUUID(),
          userId: user?.id || '1',
          userName: user?.name || 'System',
          action: isNew ? 'Order created' : 'Order updated',
          timestamp: new Date().toISOString(),
        }],
        createdBy: formData.createdBy || user?.name || 'System',
        createdAt: formData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Add status change activity
      if (newStatus && newStatus !== formData.status) {
        orderData.activities = [
          ...orderData.activities,
          {
            id: crypto.randomUUID(),
            userId: user?.id || '1',
            userName: user?.name || 'System',
            action: `Order ${newStatus}`,
            timestamp: new Date().toISOString(),
          },
        ];
      }
      
      saveSalesOrder(orderData);
      toast({
        title: isNew ? 'Order Created' : 'Order Updated',
        description: `${orderData.reference} has been saved.`,
      });
      navigate('/sales/orders');
    } catch (error) {
      toast({ title: 'Error saving order', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }, [formData, lines, totals, isNew, id, user, toast, navigate]);
  
  const handleConfirmAction = useCallback(() => {
    switch (confirmAction) {
      case 'confirm':
        handleSave('confirmed');
        break;
      case 'lock':
        handleSave('locked');
        break;
      case 'cancel':
        handleSave('cancelled');
        break;
    }
    setConfirmDialogOpen(false);
  }, [confirmAction, handleSave]);
  
  const isEditable = formData.status === 'draft';
  
  if (loading) {
    return (
      <AppLayout title="Sales" moduleNav={SALES_NAV}>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout title="Sales" moduleNav={SALES_NAV}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/sales/orders')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold text-foreground">
                  {isNew ? 'New Sales Order' : formData.reference}
                </h1>
                {!isNew && (
                  <Badge className={cn('font-normal', STATUS_CONFIG[formData.status!].className)}>
                    {STATUS_CONFIG[formData.status!].label}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                {isNew ? 'Create a new sales order' : `Last updated ${format(parseISO(formData.updatedAt!), 'MMM d, yyyy HH:mm')}`}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {isEditable && (
              <>
                <Button variant="outline" onClick={() => handleSave()} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button onClick={() => { setConfirmAction('confirm'); setConfirmDialogOpen(true); }} disabled={saving}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm
                </Button>
              </>
            )}
            {formData.status === 'confirmed' && (
              <>
                <Button variant="outline" onClick={() => { setConfirmAction('cancel'); setConfirmDialogOpen(true); }}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={() => { setConfirmAction('lock'); setConfirmDialogOpen(true); }}>
                  <Lock className="h-4 w-4 mr-2" />
                  Lock Order
                </Button>
              </>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer & Details */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Customer *</Label>
                    <Select
                      value={formData.customerId}
                      onValueChange={handleCustomerChange}
                      disabled={!isEditable}
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
                  <div className="space-y-2">
                    <Label>Pricelist</Label>
                    <Select
                      value={formData.pricelistId}
                      onValueChange={(v) => setFormData({ ...formData, pricelistId: v })}
                      disabled={!isEditable}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select pricelist" />
                      </SelectTrigger>
                      <SelectContent>
                        {pricelists.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} ({p.currency})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Order Date</Label>
                    <Input
                      type="date"
                      value={formData.orderDate}
                      onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                      disabled={!isEditable}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Delivery Date</Label>
                    <Input
                      type="date"
                      value={formData.deliveryDate}
                      onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                      disabled={!isEditable}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Terms</Label>
                    <Select
                      value={formData.paymentTerms}
                      onValueChange={(v) => setFormData({ ...formData, paymentTerms: v })}
                      disabled={!isEditable}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select terms" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_TERMS.map((term) => (
                          <SelectItem key={term.value} value={term.value}>
                            {term.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Delivery Address</Label>
                    <Textarea
                      value={formData.deliveryAddress}
                      onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                      disabled={!isEditable}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Billing Address</Label>
                    <Textarea
                      value={formData.billingAddress}
                      onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                      disabled={!isEditable}
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Order Lines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Order Lines
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditable && (
                  <div className="grid grid-cols-12 gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
                    <div className="col-span-4">
                      <Select
                        value={newLine.productId}
                        onValueChange={(v) => setNewLine({ ...newLine, productId: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min={1}
                        value={newLine.quantity}
                        onChange={(e) => setNewLine({ ...newLine, quantity: Number(e.target.value) })}
                        placeholder="Qty"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min={0}
                        value={newLine.discount}
                        onChange={(e) => setNewLine({ ...newLine, discount: Number(e.target.value) })}
                        placeholder="Disc%"
                      />
                    </div>
                    <div className="col-span-2">
                      <Select
                        value={newLine.taxId}
                        onValueChange={(v) => setNewLine({ ...newLine, taxId: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {taxRules.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Button onClick={handleAddLine} className="w-full">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Discount</TableHead>
                      <TableHead className="text-right">Tax</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      {isEditable && <TableHead className="w-[50px]"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No items added yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      lines.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              {line.productName}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {isEditable ? (
                              <Input
                                type="number"
                                min={1}
                                value={line.quantity}
                                onChange={(e) => handleUpdateLine(line.id, { quantity: Number(e.target.value) })}
                                className="w-20 ml-auto"
                              />
                            ) : (
                              line.quantity
                            )}
                          </TableCell>
                          <TableCell className="text-right">${line.unitPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            {line.discount > 0 && (
                              <span className="text-destructive">
                                -{line.discountType === 'percentage' ? `${line.discount}%` : `$${line.discount}`}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">${line.taxAmount.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">${line.total.toFixed(2)}</TableCell>
                          {isEditable && (
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveLine(line.id)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                  {lines.length > 0 && (
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={5} className="text-right font-medium">Subtotal</TableCell>
                        <TableCell className="text-right font-medium">${totals.subtotal.toFixed(2)}</TableCell>
                        {isEditable && <TableCell />}
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={5} className="text-right font-medium">Tax</TableCell>
                        <TableCell className="text-right font-medium">${totals.taxAmount.toFixed(2)}</TableCell>
                        {isEditable && <TableCell />}
                      </TableRow>
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={5} className="text-right font-bold text-lg">Total</TableCell>
                        <TableCell className="text-right font-bold text-lg">${totals.total.toFixed(2)}</TableCell>
                        {isEditable && <TableCell />}
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </CardContent>
            </Card>
            
            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  disabled={!isEditable}
                  placeholder="Internal notes about this order..."
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Items</span>
                    <span>{lines.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${totals.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>${totals.taxAmount.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">${totals.total.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Status Info */}
            {!isNew && (
              <Card>
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Current Status</span>
                    <Badge className={cn('font-normal', STATUS_CONFIG[formData.status!].className)}>
                      {STATUS_CONFIG[formData.status!].label}
                    </Badge>
                  </div>
                  {formData.confirmedAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Confirmed</span>
                      <span className="text-sm">{format(parseISO(formData.confirmedAt), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  {formData.lockedAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Locked</span>
                      <span className="text-sm">{format(parseISO(formData.lockedAt), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'confirm' && 'Confirm Order?'}
              {confirmAction === 'lock' && 'Lock Order?'}
              {confirmAction === 'cancel' && 'Cancel Order?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'confirm' && 'This will confirm the order and reserve stock for the items.'}
              {confirmAction === 'lock' && 'This will lock the order and prevent any further changes.'}
              {confirmAction === 'cancel' && 'This will cancel the order. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={confirmAction === 'cancel' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {confirmAction === 'confirm' && 'Confirm Order'}
              {confirmAction === 'lock' && 'Lock Order'}
              {confirmAction === 'cancel' && 'Cancel Order'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
