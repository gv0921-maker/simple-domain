import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
import { ArrowLeft, Save, XCircle, ShoppingCart, CreditCard, FileText, CheckCircle2 } from 'lucide-react';
import { RecordPaymentDialog } from '@/components/sales/RecordPaymentDialog';
import { useGenerateInvoiceFromOrder } from '@/hooks/invoicing';
import { useDeliveryQC } from '@/hooks/qc';
import { PreDeliveryQCSection } from '@/components/sales/PreDeliveryQCSection';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  useSalesOrderRich, useSaveSalesOrderRich, usePricelists, useFiscalPositions,
} from '@/hooks/sales';
import { generateOrderReferenceRich } from '@/lib/services/sales/api';
import type {
  SalesOrder, SalesOrderLine, SalesOrderStatus,
  GSTType, OrderDiscountType,
} from '@/lib/services/sales/types';
import { determineGSTType, validatePhone, validateGSTIN } from '@/lib/services/sales';
import { CustomerSelector } from '@/components/sales/CustomerSelector';
import { useCustomers } from '@/hooks/sales';
import { buildCustomerPopulationFields } from '@/lib/sales/customerCrmSync';
import {
  writeSalesReturnContext, clearStaleSalesReturnContext,
} from '@/lib/sales/contactPopulation';
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
import { ReservationsSection, useOrderReservationBadge } from '@/components/sales/ReservationsSection';
import { LogNotesPanel } from '@/components/shared/LogNotesPanel';
import { logRecordCreated, logStatusChange } from '@/lib/services/activityLog';
import { trackChanges } from '@/lib/services/activityLogHelpers';

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
  paid: { label: 'Paid', className: 'bg-success/20 text-success border-success' },
  invoiced: { label: 'Invoiced', className: 'bg-primary/20 text-primary border-primary' },
  ready_to_pick: { label: 'Ready to Pick', className: 'bg-info/20 text-info border-info' },
  dispatched: { label: 'Dispatched', className: 'bg-primary/20 text-primary border-primary' },
  delivered: { label: 'Delivered', className: 'bg-success/20 text-success border-success' },
  locked: { label: 'Locked', className: 'bg-primary/20 text-primary border-primary' },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/20 text-destructive border-destructive' },
};

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function SalesOrderForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const isNew = id === 'new' || !id;
  const studio = useStudioConfig('sales', 'Sales Order');

  const { data: pricelists = [] } = usePricelists();
  const { data: allFiscalPositions = [] } = useFiscalPositions();
  const fiscalPositions = useMemo(() => allFiscalPositions.filter((f) => f.isActive), [allFiscalPositions]);

  const { data: loadedOrder, isLoading: isLoadingOrder } = useSalesOrderRich(isNew ? undefined : id);
  const saveOrderMut = useSaveSalesOrderRich();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'cancel' | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const generateInvoiceMut = useGenerateInvoiceFromOrder();
  const { data: deliveryQC } = useDeliveryQC(!isNew ? id : undefined);
  const qcPassed = deliveryQC?.status === 'passed';
  const billingRef = useRef<HTMLDivElement | null>(null);

  const [formData, setFormData] = useState<Partial<SalesOrder>>({
    customerId: '',
    customerName: '',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: addDays(new Date(), 7).toISOString().split('T')[0],
    currency: 'INR',
    pricelistId: undefined,
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
    if (isNew) return;
    if (isLoadingOrder) return;
    if (loadedOrder) {
      setFormData(loadedOrder);
      setLines(loadedOrder.lines);
      setLoading(false);
    } else {
      toast({ title: 'Order not found', variant: 'destructive' });
      navigate('/sales/orders');
    }
  }, [isNew, isLoadingOrder, loadedOrder, navigate, toast]);

  // Auto-populate billing + delivery from selected customer.
  const populateFromCustomer = useCallback((customer: any) => {
    const fields = buildCustomerPopulationFields(customer);
    setFormData((prev) => ({ ...prev, ...fields }));
  }, []);
  const { data: customers = [] } = useCustomers();

  // Clear stale return context (>30 min) on mount.
  useEffect(() => { clearStaleSalesReturnContext(); }, []);

  useEffect(() => {
    if (formData.pricelistId && !UUID_RE.test(formData.pricelistId)) {
      setFormData((prev) => ({ ...prev, pricelistId: undefined }));
    }
  }, [formData.pricelistId]);

  // Restore form state when returning from "Create New Contact" flow.
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current) return;
    const state: any = location.state;
    if (state?.restoredFormData) {
      setFormData(state.restoredFormData);
      restoredRef.current = true;
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [location.state]);

  // After customers load, re-populate from the newly created one.
  useEffect(() => {
    const newCustomerId =
      (location.state as any)?.newCustomerId ||
      (location.state as any)?.newContactId;
    if (newCustomerId && customers.length > 0) {
      const c: any = customers.find((x: any) => x.id === newCustomerId);
      if (c) populateFromCustomer(c);
    }
  }, [customers, location.state, populateFromCustomer]);

  const handleCreateNewContact = useCallback(() => {
    writeSalesReturnContext({
      returnTo: window.location.pathname,
      formData,
      timestamp: Date.now(),
    });
    navigate('/sales/customers/new?returnTo=sales_form');
  }, [formData, navigate]);

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

  const persist = useCallback(async (statusOverride?: SalesOrderStatus, extraActivityNote?: string) => {
    const newStatus = statusOverride || formData.status || 'estimate';
    const reference = formData.reference || await generateOrderReferenceRich();
    const wasNew = isNew;
    const prevSnapshot: Record<string, unknown> = {
      customerName: formData.customerName,
      orderDate: formData.orderDate,
      deliveryDate: formData.deliveryDate,
      paymentTerms: formData.paymentTerms,
      pricelistId: formData.pricelistId,
      notes: formData.notes,
      grandTotal: formData.grandTotal,
      status: formData.status,
    };
    const data: SalesOrder = {
      id: isNew ? crypto.randomUUID() : id!,
      reference,
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
      lockedAt: newStatus === 'locked' ? new Date().toISOString() : formData.lockedAt,
      lockedBy: newStatus === 'locked' ? user?.name : formData.lockedBy,
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
    data.reference = reference;
    await saveOrderMut.mutateAsync(data);
    // Activity logging (best-effort; never throws)
    try {
      if (wasNew) {
        await logRecordCreated('sales_order', data.id);
      } else {
        const next: Record<string, unknown> = {
          customerName: data.customerName,
          orderDate: data.orderDate,
          deliveryDate: data.deliveryDate,
          paymentTerms: data.paymentTerms,
          pricelistId: data.pricelistId,
          notes: data.notes,
          grandTotal: data.total,
        };
        await trackChanges('sales_order', data.id, prevSnapshot, next);
        if (prevSnapshot.status && prevSnapshot.status !== newStatus) {
          await logStatusChange('sales_order', data.id, prevSnapshot.status, newStatus);
        }
      }
    } catch {
      // swallow
    }
    return data;
  }, [formData, lines, isNew, id, user, saveOrderMut]);

  const handleSave = useCallback(async (newStatus?: SalesOrderStatus) => {
    const v = validate();
    if (!v.ok) {
      toast({ title: v.error!, variant: 'destructive' });
      billingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setSaving(true);
    try {
      const data = await persist(newStatus);
      toast({ title: isNew ? 'Order Created' : 'Order Updated', description: `${data.reference} saved.` });
      navigate('/sales/orders');
    } catch (error: any) {
      toast({
        title: 'Error saving order',
        description: error?.message ?? String(error),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [validate, persist, isNew, toast, navigate]);

  const handleStatusStepClick = useCallback(async (next: SalesOrderStatus) => {
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

    try {
      await persist(next, note);
      setFormData((prev) => ({ ...prev, status: next }));
      toast({ title: 'Status updated', description: note });
    } catch (e: any) {
      toast({ title: 'Status update failed', description: e?.message ?? String(e), variant: 'destructive' });
    }
    // Phase 4: stock reservation on confirmed wired next.
  }, [formData, lines, userRole, validate, persist, toast]);

  const handleConfirmAction = useCallback(() => {
    if (confirmAction === 'cancel') handleSave('cancelled');
    setConfirmDialogOpen(false);
  }, [confirmAction, handleSave]);

  const status = (formData.status || 'estimate') as SalesOrderStatus;
  const isEditable = status === 'estimate' || status === 'draft';
  const reservationBadge = useOrderReservationBadge(isNew ? undefined : id, lines);

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
      <div className="p-4 space-y-3">
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
                {!isNew && lines.length > 0 && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'font-normal',
                      reservationBadge === 'fully' && 'border-success text-success',
                      reservationBadge === 'partial' && 'border-warning text-warning',
                    )}
                  >
                    {reservationBadge === 'fully' ? 'Fully Reserved'
                      : reservationBadge === 'partial' ? 'Partially Reserved'
                      : 'Not Reserved'}
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
            {status === 'confirmed' && !isNew && (
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 shadow-md"
                onClick={() => setPaymentDialogOpen(true)}
              >
                <CreditCard className="h-4 w-4 mr-2" /> Record Payment
              </Button>
            )}
            {status === 'paid' && !isNew && id && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0}>
                      <Button
                        variant="outline"
                        disabled={generateInvoiceMut.isPending || !qcPassed}
                        onClick={async () => {
                          try {
                            const res = await generateInvoiceMut.mutateAsync(id);
                            try {
                              await logStatusChange('sales_order', id, 'paid', 'invoiced');
                            } catch { /* ignore */ }
                            toast({ title: 'Invoice generated successfully' });
                            navigate(`/invoicing/invoices/${res.invoiceId}`);
                          } catch (e: any) {
                            toast({
                              title: 'Failed to generate invoice',
                              description: e?.message ?? String(e),
                              variant: 'destructive',
                            });
                          }
                        }}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        {generateInvoiceMut.isPending ? 'Generating…' : 'Generate Invoice'}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!qcPassed && (
                    <TooltipContent>Complete pre-delivery QC first</TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            )}
            {status !== 'cancelled' && status !== 'delivered' && status !== 'paid' && !isNew && (
              <Button variant="outline" onClick={() => { setConfirmAction('cancel'); setConfirmDialogOpen(true); }}>
                <XCircle className="h-4 w-4 mr-2" /> Cancel Order
              </Button>
            )}
          </div>
        </div>

        {/* Paid summary */}
        {!isNew && status === 'paid' && (
          <Card className="max-w-4xl mx-auto w-full border-success/40 bg-success/5">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <div className="flex-1">
                <Badge className="bg-success text-success-foreground hover:bg-success">Paid</Badge>
                <span className="ml-3 text-sm text-foreground">
                  {formatINR(formData.paidAmount || 0)}
                  {formData.paymentDate && ` on ${format(parseISO(formData.paymentDate), 'MMM d, yyyy')}`}
                  {formData.paymentMethod && ` · ${formData.paymentMethod.replace('_', ' ')}`}
                  {formData.paymentReference && ` · Ref ${formData.paymentReference}`}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pre-delivery QC — gates Generate Invoice */}
        {!isNew && status === 'paid' && id && (
          <PreDeliveryQCSection salesOrderId={id} orderReference={formData.reference} />
        )}

        {/* Status chevrons */}
        {!isNew && (
          <Card className="max-w-4xl mx-auto w-full">
            <CardContent className="p-4">
              <OrderStatusChevrons status={status} onStepClick={handleStatusStepClick} />
            </CardContent>
          </Card>
        )}

        <div className="max-w-4xl mx-auto flex flex-col gap-3 w-full">
            {/* Customer & Details */}
            <Card>
              <CardHeader className="pb-3 p-4"><CardTitle className="text-base">Customer Details</CardTitle></CardHeader>
              <CardContent className="space-y-3 p-4 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {studio.isFieldVisible('customer') && (
                    <div className="space-y-1">
                      <Label>{studio.getFieldLabel('customer', 'Customer')} *</Label>
                      <CustomerSelector
                        value={formData.customerId}
                        onChange={populateFromCustomer}
                        disabled={!isEditable}
                        onCreateNew={handleCreateNewContact}
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label>Pricelist</Label>
                    <Select value={formData.pricelistId} onValueChange={(v) => setFormData({ ...formData, pricelistId: v })} disabled={!isEditable}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Select pricelist" /></SelectTrigger>
                      <SelectContent>
                        {pricelists.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name} ({p.currency})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label>Order Date</Label>
                    <Input type="date" className="h-9" value={formData.orderDate}
                      onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                      disabled={!isEditable} />
                  </div>
                  <div className="space-y-1">
                    <Label>Delivery Date</Label>
                    <Input type="date" className="h-9" value={formData.deliveryDate}
                      onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                      disabled={!isEditable} />
                  </div>
                  <div className="space-y-1">
                    <Label>Payment Terms</Label>
                    <Select value={formData.paymentTerms} onValueChange={(v) => setFormData({ ...formData, paymentTerms: v })} disabled={!isEditable}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Select terms" /></SelectTrigger>
                      <SelectContent>
                        {PAYMENT_TERMS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {fiscalPositions.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Fiscal Position</Label>
                      <Select
                        value={formData.fiscalPositionId || '__none__'}
                        onValueChange={(v) => setFormData({ ...formData, fiscalPositionId: v === '__none__' ? undefined : v })}
                        disabled={!isEditable}
                      >
                        <SelectTrigger className="h-9"><SelectValue placeholder="Default (no remapping)" /></SelectTrigger>
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
              <CardHeader className="pb-3 p-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShoppingCart className="h-4 w-4" /> Order Lines
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
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
              <CardHeader className="pb-3 p-4"><CardTitle className="text-base">Notes</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0">
                <Textarea value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  disabled={!isEditable} placeholder="" rows={3} className="min-h-[72px]" />
              </CardContent>
            </Card>

            {!isNew && id && (
              <ReservationsSection salesOrderId={id} lines={lines} />
            )}

          {/* Summary (full width, right-aligned) */}
            <Card>
              <CardHeader className="pb-3 p-4"><CardTitle className="text-base">Order Summary</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex justify-end">
                  <div className="w-full max-w-sm space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items</span>
                  <span>{lines.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Untaxed</span>
                  <span>{formatINR(formData.totalUntaxed || 0)}</span>
                </div>
                {(formData.orderDiscountAmount || 0) > 0 && (
                  <div className="flex justify-between text-sm text-success">
                    <span>Discount</span>
                    <span>-{formatINR(formData.orderDiscountAmount || 0)}</span>
                  </div>
                )}
                {gstType === 'cgst_sgst' ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">CGST</span>
                      <span>{formatINR(formData.totalCGST || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">SGST</span>
                      <span>{formatINR(formData.totalSGST || 0)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IGST</span>
                    <span>{formatINR(formData.totalIGST || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total GST</span>
                  <span>{formatINR(formData.totalGST || 0)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Grand Total</span>
                  <span className="text-primary">{formatINR(formData.grandTotal || 0)}</span>
                </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {!isNew && id && (
              <LogNotesPanel recordType="sales_order" recordId={id} />
            )}
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

      {!isNew && id && (
        <RecordPaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          orderId={id}
          customerId={formData.customerId}
          defaultAmount={formData.grandTotal || formData.total || 0}
        />
      )}
    </AppLayout>
  );
}
