import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Save, XCircle, ShoppingCart } from 'lucide-react';
import {
  getSalesOrder, saveSalesOrder, generateOrderReference, getPricelists, getFiscalPositions,
} from '@/lib/services/sales/storage';
import type {
  SalesOrder, SalesOrderLine, SalesOrderStatus,
  GSTType, OrderDiscountType,
} from '@/lib/services/sales/types';
import { getContacts, determineGSTType, validatePhone, validateGSTIN } from '@/lib/services/sales';
import { SALES_NAV } from '@/lib/navigation/sales';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useStudioConfig } from '@/hooks/useStudioConfig';
import { format, parseISO, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { BillingSection } from '@/components/sales/BillingSection';
import { DeliverySection } from '@/components/sales/DeliverySection';
import { OrderLinesTable, type OrderSummaryValue } from '@/components/sales/OrderLinesTable';
import { OrderStatusChevrons, canTransition } from '@/components/sales/OrderStatusChevrons';
import { getContact, saveContact } from '@/lib/services/crm';
import { processOrderDelivery, tierLabel } from '@/lib/sales/loyaltyService';

const PAYMENT_TERMS = [
  { value: 'immediate', label: 'Immediate Payment' },
  { value: 'net15', label: 'Net 15' },
  { value: 'net30', label: 'Net 30' },
  { value: 'net45', label: 'Net 45' },
  { value: 'net60', label: 'Net 60' },
];

const STATUS_CONFIG: Record<SalesOrderStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  estimate: { label: 'Estimate', className: 'bg-muted text-muted-foreground' },
  confirmed: { label: 'Confirmed', className: 'bg-success/20 text-success border-success' },
  ready_to_pick: { label: 'Ready to Pick', className: 'bg-info/20 text-info border-info' },
  dispatched: { label: 'Dispatched', className: 'bg-primary/20 text-primary border-primary' },
  delivered: { label: 'Delivered', className: 'bg-success/20 text-success border-success' },
  locked: { label: 'Locked', className: 'bg-primary/20 text-primary border-primary' },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/20 text-destructive border-destructive' },
};

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);

export default function SalesOrderForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isNew = id === 'new' || !id;
  const studio = useStudioConfig('sales', 'Sales Order');

  const [contacts] = useState(() => getContacts());
  const [pricelists] = useState(() => getPricelists());
  const [fiscalPositions] = useState(() => getFiscalPositions().filter((f) => f.isActive));

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'cancel' | null>(null);
  const billingRef = useRef<HTMLDivElement | null>(null);

  const [formData, setFormData] = useState<Partial<SalesOrder>>({
    customerId: '',
    customerName: '',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: addDays(new Date(), 7).toISOString().split('T')[0],
    currency: 'INR',
    pricelistId: 'pl_standard',
    paymentTerms: 'net30',
    notes: '',
    status: 'estimate',
    deliveryStatus: 'pending',
    deliverySameAsBilling: true,
    orderDiscountType: null,
    orderDiscountValue: 0,
  });

  const [lines, setLines] = useState<SalesOrderLine[]>([]);

  const gstType: GSTType = useMemo(
    () => determineGSTType(formData.billingCity || '', formData.billingState || ''),
    [formData.billingCity, formData.billingState],
  );

  const userRole = (user as any)?.role as string | undefined;
  const canApplyOrderDiscount = userRole === 'admin' || userRole === 'manager' || userRole === 'super_admin';

  // Load existing order
  useEffect(() => {
    if (!isNew && id) {
      const o = getSalesOrder(id);
      if (o) {
        setFormData(o);
        setLines(o.lines);
      } else {
        toast({ title: 'Order not found', variant: 'destructive' });
        navigate('/sales/orders');
      }
      setLoading(false);
    }
  }, [id, isNew, navigate, toast]);

  const handleCustomerChange = useCallback((customerId: string) => {
    const c: any = contacts.find((x) => x.id === customerId);
    if (!c) return;
    const fullName = [c.firstName, c.lastName].filter(Boolean).join(' ').trim() || c.name || '';
    const phone1 = c.phones?.[0]?.phone || c.phone || '';
    const addr = c.addresses?.[0] || {};
    setFormData((prev) => ({
      ...prev,
      customerId,
      customerName: c.company ? `${fullName || c.name} - ${c.company}` : (fullName || c.name || ''),
      billingCustomerName: fullName,
      billingName: fullName,
      billingPhone1: phone1,
      billingAddressLine1: addr.street || '',
      billingAddressLine2: addr.street2 || '',
      billingCity: addr.city || '',
      billingState: addr.state || '',
      billingZip: addr.postalCode || '',
    }));
  }, [contacts]);

  const handleTotalsChange = useCallback((t: OrderSummaryValue) => {
    setFormData((prev) => {
      if (
        prev.totalUntaxed === t.totalUntaxed && prev.totalCGST === t.totalCGST &&
        prev.totalSGST === t.totalSGST && prev.totalIGST === t.totalIGST &&
        prev.totalGST === t.totalGST && prev.grandTotal === t.grandTotal &&
        prev.orderDiscountAmount === t.orderDiscountAmount
      ) return prev;
      return {
        ...prev,
        totalUntaxed: t.totalUntaxed, totalCGST: t.totalCGST, totalSGST: t.totalSGST,
        totalIGST: t.totalIGST, totalGST: t.totalGST, grandTotal: t.grandTotal,
        orderDiscountAmount: t.orderDiscountAmount, gstType,
      };
    });
  }, [gstType]);

  const handleOrderDiscountChange = useCallback((type: OrderDiscountType, value: number) => {
    setFormData((prev) => ({ ...prev, orderDiscountType: type, orderDiscountValue: value }));
  }, []);

  const validate = useCallback((): { ok: boolean; error?: string } => {
    if (!formData.customerId) return { ok: false, error: 'Please select a customer' };
    if (lines.length === 0) return { ok: false, error: 'Please add at least one product' };
    if (!formData.billingPhone1 || !validatePhone(formData.billingPhone1))
      return { ok: false, error: 'Please enter a valid primary phone' };
    if (formData.billingPhone2 && !validatePhone(formData.billingPhone2))
      return { ok: false, error: 'Please enter a valid secondary phone' };
    if (!formData.billingLocationType)
      return { ok: false, error: 'Please select a billing location type' };
    if (formData.billingLocationType === 'office' && formData.billingGSTIN && !validateGSTIN(formData.billingGSTIN))
      return { ok: false, error: 'Invalid billing GSTIN format' };
    return { ok: true };
  }, [formData, lines.length]);

  const persist = useCallback((statusOverride?: SalesOrderStatus, extraActivityNote?: string) => {
    const newStatus = statusOverride || formData.status || 'estimate';
    const data: SalesOrder = {
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
      currency: formData.currency || 'INR',
      pricelistId: formData.pricelistId,
      paymentTerms: formData.paymentTerms,
      lines,
      subtotal: formData.totalUntaxed || 0,
      discountAmount: formData.orderDiscountAmount || 0,
      taxAmount: formData.totalGST || 0,
      total: formData.grandTotal || 0,
      notes: formData.notes,
      status: newStatus,
      deliveryStatus: formData.deliveryStatus || 'pending',
      confirmedAt: newStatus === 'confirmed' ? new Date().toISOString() : formData.confirmedAt,
      confirmedBy: newStatus === 'confirmed' ? user?.name : formData.confirmedBy,
      activities: [
        ...(formData.activities || []),
        ...(extraActivityNote
          ? [{
              id: crypto.randomUUID(),
              userId: user?.id || '1',
              userName: user?.name || 'System',
              action: extraActivityNote,
              timestamp: new Date().toISOString(),
            }]
          : []),
      ],
      createdBy: formData.createdBy || user?.name || 'System',
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...formData,
    } as SalesOrder;
    // Force computed totals & status to win over any stale spread copies.
    data.status = newStatus;
    data.lines = lines;
    saveSalesOrder(data);
    return data;
  }, [formData, lines, isNew, id, user]);

  const handleSave = useCallback(async (newStatus?: SalesOrderStatus) => {
    const v = validate();
    if (!v.ok) {
      toast({ title: v.error!, variant: 'destructive' });
      billingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setSaving(true);
    try {
      const data = persist(newStatus);
      toast({ title: isNew ? 'Order Created' : 'Order Updated', description: `${data.reference} saved.` });
      navigate('/sales/orders');
    } catch (error) {
      toast({ title: 'Error saving order', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }, [validate, persist, isNew, toast, navigate]);

  const handleStatusStepClick = useCallback((next: SalesOrderStatus) => {
    const current = (formData.status || 'estimate') as SalesOrderStatus;
    if (current === next) return;
    if (!canTransition(current, next, userRole)) {
      toast({
        title: 'Status change not allowed',
        description: `You don't have permission to advance to "${next}".`,
        variant: 'destructive',
      });
      return;
    }
    const v = validate();
    if (!v.ok) {
      toast({ title: v.error!, variant: 'destructive' });
      return;
    }
    let note = `Status changed: ${STATUS_CONFIG[current].label} → ${STATUS_CONFIG[next].label}`;

    if (next === 'delivered' && formData.customerId) {
      const contact = getContact(formData.customerId);
      if (contact) {
        const orderForLoyalty = {
          ...formData,
          lines,
          status: 'delivered',
          grandTotal: formData.grandTotal || 0,
          pointsRedeemed: formData.pointsRedeemed || 0,
        } as any;
        const result = processOrderDelivery(orderForLoyalty, contact);
        saveContact(result.updatedContact);
        const fmt = (n: number) =>
          new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
        const tierBit = result.tierChanged
          ? ` Tier upgraded: ${tierLabel(result.oldTier)} → ${tierLabel(result.newTier)}.`
          : '';
        note += ` | Loyalty: earned ${result.pointsEarned} pts.${tierBit} Total spend: ${fmt(result.newLifetimeSpend)}`;
      }
    }

    persist(next, note);
    setFormData((prev) => ({ ...prev, status: next }));
    toast({ title: 'Status updated', description: note });
    // Phase 4: stock reservation on confirmed wired next.
  }, [formData.status, userRole, validate, persist, toast]);

  const handleConfirmAction = useCallback(() => {
    if (confirmAction === 'cancel') handleSave('cancelled');
    setConfirmDialogOpen(false);
  }, [confirmAction, handleSave]);

  const status = (formData.status || 'estimate') as SalesOrderStatus;
  const isEditable = status === 'estimate' || status === 'draft';

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
                  <Badge className={cn('font-normal', STATUS_CONFIG[status].className)}>
                    {STATUS_CONFIG[status].label}
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
              <Button variant="outline" onClick={() => handleSave()} disabled={saving}>
                <Save className="h-4 w-4 mr-2" /> Save
              </Button>
            )}
            {status !== 'cancelled' && status !== 'delivered' && !isNew && (
              <Button variant="outline" onClick={() => { setConfirmAction('cancel'); setConfirmDialogOpen(true); }}>
                <XCircle className="h-4 w-4 mr-2" /> Cancel Order
              </Button>
            )}
          </div>
        </div>

        {/* Status chevrons */}
        {!isNew && (
          <Card>
            <CardContent className="pt-6">
              <OrderStatusChevrons status={status} onStepClick={handleStatusStepClick} />
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Customer & Details */}
            <Card>
              <CardHeader><CardTitle>Customer Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {studio.isFieldVisible('customer') && (
                    <div className="space-y-2">
                      <Label>{studio.getFieldLabel('customer', 'Customer')} *</Label>
                      <Select value={formData.customerId} onValueChange={handleCustomerChange} disabled={!isEditable}>
                        <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                        <SelectContent>
                          {contacts.map((c: any) => {
                            const display = [c.firstName, c.lastName].filter(Boolean).join(' ') || c.name || '';
                            return (
                              <SelectItem key={c.id} value={c.id}>
                                {display}{c.company ? ` - ${c.company}` : ''}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Pricelist</Label>
                    <Select value={formData.pricelistId} onValueChange={(v) => setFormData({ ...formData, pricelistId: v })} disabled={!isEditable}>
                      <SelectTrigger><SelectValue placeholder="Select pricelist" /></SelectTrigger>
                      <SelectContent>
                        {pricelists.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name} ({p.currency})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Order Date</Label>
                    <Input type="date" value={formData.orderDate}
                      onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                      disabled={!isEditable} />
                  </div>
                  <div className="space-y-2">
                    <Label>Delivery Date</Label>
                    <Input type="date" value={formData.deliveryDate}
                      onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                      disabled={!isEditable} />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Terms</Label>
                    <Select value={formData.paymentTerms} onValueChange={(v) => setFormData({ ...formData, paymentTerms: v })} disabled={!isEditable}>
                      <SelectTrigger><SelectValue placeholder="Select terms" /></SelectTrigger>
                      <SelectContent>
                        {PAYMENT_TERMS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {fiscalPositions.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fiscal Position</Label>
                      <Select
                        value={formData.fiscalPositionId || '__none__'}
                        onValueChange={(v) => setFormData({ ...formData, fiscalPositionId: v === '__none__' ? undefined : v })}
                        disabled={!isEditable}
                      >
                        <SelectTrigger><SelectValue placeholder="Default (no remapping)" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Default (no remapping)</SelectItem>
                          {fiscalPositions.map((f) => (
                            <SelectItem key={f.id} value={f.id}>{f.name} ({f.code})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div ref={billingRef}>
              <BillingSection value={formData as any} onChange={(v) => setFormData(v as any)} disabled={!isEditable} />
            </div>

            <DeliverySection value={formData as any} onChange={(v) => setFormData(v as any)} disabled={!isEditable} />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" /> Order Lines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <OrderLinesTable<SalesOrderLine>
                  lines={lines}
                  onChange={setLines}
                  gstType={gstType}
                  orderDiscountType={(formData.orderDiscountType ?? null) as OrderDiscountType}
                  orderDiscountValue={formData.orderDiscountValue || 0}
                  onOrderDiscountChange={handleOrderDiscountChange}
                  canApplyOrderDiscount={canApplyOrderDiscount}
                  disabled={!isEditable}
                  onTotalsChange={handleTotalsChange}
                  newLine={(id) => ({
                    id, productId: '', productName: '',
                    quantity: 1, units: 1, deliveredQuantity: 0, invoicedQuantity: 0,
                    unitPrice: 0, discount: 0, discountType: 'percentage',
                    taxIds: [], subtotal: 0, taxAmount: 0, total: 0,
                    reservedStock: false, gstRate: 18,
                  } as SalesOrderLine)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
              <CardContent>
                <Textarea value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  disabled={!isEditable} placeholder="" rows={4} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items</span>
                  <span>{lines.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatINR(formData.totalUntaxed || 0)}</span>
                </div>
                {(formData.orderDiscountAmount || 0) > 0 && (
                  <div className="flex justify-between text-sm text-success">
                    <span>Discount</span>
                    <span>-{formatINR(formData.orderDiscountAmount || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{gstType === 'igst' ? 'IGST' : 'CGST + SGST'}</span>
                  <span>{formatINR(formData.totalGST || 0)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">{formatINR(formData.grandTotal || 0)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order?</AlertDialogTitle>
            <AlertDialogDescription>This will cancel the order. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Cancel Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
