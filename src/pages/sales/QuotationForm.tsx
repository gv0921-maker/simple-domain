import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
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
import {
  ArrowLeft, Save, Send, CheckCircle, XCircle, ArrowRight, FileText,
} from 'lucide-react';
import {
  useQuotationRich, useSaveQuotationRich, usePricelists, useConvertQuotationToOrder,
} from '@/hooks/sales';
import { generateQuotationReferenceRich } from '@/lib/services/sales/api';
import type {
  Quotation, QuotationLine, QuotationStatus,
  GSTType, OrderDiscountType,
} from '@/lib/services/sales/types';
import { determineGSTType, validatePhone, validateGSTIN } from '@/lib/services/sales';
import { useCustomers } from '@/hooks/sales';
import { buildCustomerPopulationFields } from '@/lib/sales/customerCrmSync';
import { CustomerSelector } from '@/components/sales/CustomerSelector';
import {
  writeSalesReturnContext, clearStaleSalesReturnContext,
} from '@/lib/sales/contactPopulation';
import { SALES_NAV } from '@/lib/navigation/sales';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useStudioConfig } from '@/hooks/useStudioConfig';
import { format, parseISO, addDays, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { BillingSection } from '@/components/sales/BillingSection';
import { DeliverySection } from '@/components/sales/DeliverySection';
import { OrderLinesTable, type OrderSummaryValue } from '@/components/sales/OrderLinesTable';
import type { QuotationVersion } from '@/lib/services/sales/types';
import { History } from 'lucide-react';

const PAYMENT_TERMS = [
  { value: 'immediate', label: 'Immediate Payment' },
  { value: 'net15', label: 'Net 15' },
  { value: 'net30', label: 'Net 30' },
  { value: 'net45', label: 'Net 45' },
  { value: 'net60', label: 'Net 60' },
];

const STATUS_CONFIG: Record<QuotationStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  sent: { label: 'Sent', className: 'bg-info/20 text-info border-info' },
  accepted: { label: 'Accepted', className: 'bg-success/20 text-success border-success' },
  converted: { label: 'Converted', className: 'bg-primary/20 text-primary border-primary' },
  expired: { label: 'Expired', className: 'bg-warning/20 text-warning-foreground border-warning' },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/20 text-destructive border-destructive' },
};

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function QuotationForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const isNew = !id || id === 'new';
  const studio = useStudioConfig('sales', 'Quotation');

  const { data: customers = [] } = useCustomers();
  const { data: pricelists = [] } = usePricelists();
  const convertMut = useConvertQuotationToOrder();

  const urlCustomerId = searchParams.get('customerId');
  const urlOpportunityId = searchParams.get('opportunityId');

  const { data: loadedQuotation, isLoading: isLoadingQuotation } = useQuotationRich(isNew ? undefined : id);
  const saveQuotationMut = useSaveQuotationRich();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'send' | 'accept' | 'cancel' | 'convert' | null>(null);
  const billingRef = useRef<HTMLDivElement | null>(null);

  const [formData, setFormData] = useState<Partial<Quotation>>({
    customerId: '',
    customerName: '',
    opportunityId: urlOpportunityId || undefined,
    quotationDate: new Date().toISOString().split('T')[0],
    validUntil: addDays(new Date(), 30).toISOString().split('T')[0],
    currency: 'INR',
    pricelistId: undefined,
    paymentTerms: 'net30',
    notes: '',
    termsAndConditions: 'Standard terms and conditions apply. Prices are valid for 30 days from the quotation date.',
    status: 'draft',
    deliverySameAsBilling: true,
    orderDiscountType: null,
    orderDiscountValue: 0,
  });

  const [lines, setLines] = useState<QuotationLine[]>([]);

  // GST type derived from billing state vs company state
  const gstType: GSTType = useMemo(
    () => determineGSTType(formData.billingCity || '', formData.billingState || ''),
    [formData.billingCity, formData.billingState],
  );

  const userRole = (user as any)?.role as string | undefined;
  const canApplyOrderDiscount = userRole === 'admin' || userRole === 'manager' || userRole === 'super_admin';

  // Load existing quotation
  useEffect(() => {
    if (isNew) return;
    if (isLoadingQuotation) return;
    if (loadedQuotation) {
      setFormData(loadedQuotation);
      setLines(loadedQuotation.lines);
      setLoading(false);
    } else {
      toast({ title: 'Quotation not found', variant: 'destructive' });
      navigate('/sales/quotations');
    }
  }, [isNew, isLoadingQuotation, loadedQuotation, navigate, toast]);

  // Auto-populate billing from selected customer (customers table is the FK target).
  const populateFromCustomer = useCallback((customer: any) => {
    const fields = buildCustomerPopulationFields(customer);
    setFormData((prev) => ({ ...prev, ...fields }));
  }, []);

  useEffect(() => {
    if (!isNew || !urlCustomerId) return;
    const c = customers.find((x: any) => x.id === urlCustomerId);
    if (c) populateFromCustomer(c);
  }, [isNew, urlCustomerId, customers, populateFromCustomer]);

  useEffect(() => {
    if (formData.pricelistId && !UUID_RE.test(formData.pricelistId)) {
      setFormData((prev) => ({ ...prev, pricelistId: undefined }));
    }
  }, [formData.pricelistId]);

  // Clear stale return context (>30 min) on mount.
  useEffect(() => { clearStaleSalesReturnContext(); }, []);

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
        prev.totalUntaxed === t.totalUntaxed &&
        prev.totalCGST === t.totalCGST &&
        prev.totalSGST === t.totalSGST &&
        prev.totalIGST === t.totalIGST &&
        prev.totalGST === t.totalGST &&
        prev.grandTotal === t.grandTotal &&
        prev.orderDiscountAmount === t.orderDiscountAmount
      ) return prev;
      return {
        ...prev,
        totalUntaxed: t.totalUntaxed,
        totalCGST: t.totalCGST,
        totalSGST: t.totalSGST,
        totalIGST: t.totalIGST,
        totalGST: t.totalGST,
        grandTotal: t.grandTotal,
        orderDiscountAmount: t.orderDiscountAmount,
        gstType,
      };
    });
  }, [gstType]);

  const handleOrderDiscountChange = useCallback((type: OrderDiscountType, value: number) => {
    setFormData((prev) => ({ ...prev, orderDiscountType: type, orderDiscountValue: value }));
  }, []);

  const validate = useCallback((): { ok: boolean; error?: string } => {
    if (!formData.customerId) return { ok: false, error: 'Please select a customer' };
    if (lines.length === 0) return { ok: false, error: 'Please add at least one product' };
    if (!formData.billingPhone1 || !validatePhone(formData.billingPhone1)) {
      return { ok: false, error: 'Please enter a valid primary phone' };
    }
    if (formData.billingPhone2 && !validatePhone(formData.billingPhone2)) {
      return { ok: false, error: 'Please enter a valid secondary phone' };
    }
    if (!formData.billingLocationType) {
      return { ok: false, error: 'Please select a billing location type' };
    }
    if (formData.billingLocationType === 'office' && formData.billingGSTIN && !validateGSTIN(formData.billingGSTIN)) {
      return { ok: false, error: 'Invalid billing GSTIN format' };
    }
    return { ok: true };
  }, [formData, lines.length]);

  const handleSave = useCallback(async (newStatus?: QuotationStatus) => {
    const v = validate();
    if (!v.ok) {
      toast({ title: v.error!, variant: 'destructive' });
      billingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    setSaving(true);
    try {
      const subtotal = formData.totalUntaxed || 0;
      const grand = formData.grandTotal || 0;
      const tax = formData.totalGST || 0;
      const reference = formData.reference || await generateQuotationReferenceRich();
      const data: Quotation = {
        id: isNew ? crypto.randomUUID() : id!,
        reference,
        customerId: formData.customerId!,
        customerName: formData.customerName!,
        contactId: formData.contactId,
        contactName: formData.contactName,
        opportunityId: formData.opportunityId,
        quotationDate: formData.quotationDate!,
        validUntil: formData.validUntil!,
        salespersonId: user?.id,
        salespersonName: user?.name,
        salesTeam: formData.salesTeam,
        currency: formData.currency || 'INR',
        pricelistId: formData.pricelistId,
        paymentTerms: formData.paymentTerms,
        lines,
        globalDiscount: 0,
        globalDiscountType: 'percentage',
        subtotal,
        discountAmount: formData.orderDiscountAmount || 0,
        taxAmount: tax,
        total: grand,
        notes: formData.notes,
        termsAndConditions: formData.termsAndConditions,
        status: newStatus || formData.status || 'draft',
        sentAt: newStatus === 'sent' ? new Date().toISOString() : formData.sentAt,
        acceptedAt: newStatus === 'accepted' ? new Date().toISOString() : formData.acceptedAt,
        convertedToOrderId: formData.convertedToOrderId,
        currentVersion: (formData.currentVersion || 0) + (newStatus ? 0 : 1),
        versions: formData.versions || [],
        createdBy: formData.createdBy || user?.name || 'System',
        createdAt: formData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // B2C custom fields - preserve all from formData
        ...formData,
      } as Quotation;

      // Snapshot a new version on every explicit save (not status-only changes).
      if (!newStatus) {
        const prevVersions = formData.versions || [];
        const { versions: _v, ...dataNoVersions } = data;
        const snapshot: QuotationVersion = {
          version: (formData.currentVersion || 0) + 1,
          createdAt: new Date().toISOString(),
          createdBy: user?.name || 'System',
          data: dataNoVersions,
        };
        // Cap at last 20 versions for storage hygiene.
        data.versions = [...prevVersions, snapshot].slice(-20);
      }

      await saveQuotationMut.mutateAsync(data);
      toast({ title: isNew ? 'Quotation Created' : 'Quotation Updated', description: `${data.reference} saved.` });
      navigate('/sales/quotations');
    } catch (error: any) {
      toast({
        title: 'Error saving quotation',
        description: error?.message ?? String(error),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [formData, lines, isNew, id, user, toast, navigate, validate, saveQuotationMut]);

  const handleConfirmAction = useCallback(async () => {
    switch (confirmAction) {
      case 'send': handleSave('sent'); break;
      case 'accept': handleSave('accepted'); break;
      case 'cancel': handleSave('cancelled'); break;
      case 'convert': {
        try {
          const order = await convertMut.mutateAsync({
            quotationId: id!,
            userId: user?.id || '1',
            userName: user?.name || 'System',
          });
          if (order) {
            toast({ title: 'Sales Order created from Quotation', description: order.reference });
            navigate(`/sales/orders/${order.id}`);
          }
        } catch (e: any) {
          toast({ title: 'Conversion failed', description: e?.message ?? String(e), variant: 'destructive' });
        }
        break;
      }
    }
    setConfirmDialogOpen(false);
  }, [confirmAction, handleSave, id, user, toast, navigate, convertMut]);

  const isEditable = formData.status === 'draft';

  const versions = formData.versions || [];
  const expiryInfo = (() => {
    if (!formData.validUntil || formData.status !== 'sent') return null;
    const days = differenceInDays(parseISO(formData.validUntil), new Date());
    if (days < 0) return { kind: 'expired' as const, days: -days };
    if (days <= 7) return { kind: 'soon' as const, days };
    return null;
  })();

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
        {/* Header (full width) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/sales/quotations')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold text-foreground">
                  {isNew ? 'New Quotation' : formData.reference}
                </h1>
                {!isNew && (
                  <Badge className={cn('font-normal', STATUS_CONFIG[formData.status!].className)}>
                    {STATUS_CONFIG[formData.status!].label}
                  </Badge>
                )}
                {expiryInfo && (
                  <Badge variant="outline" className={cn(
                    'font-normal',
                    expiryInfo.kind === 'expired'
                      ? 'text-destructive border-destructive bg-destructive/10'
                      : 'text-warning-foreground border-warning bg-warning/10'
                  )}>
                    {expiryInfo.kind === 'expired'
                      ? `Expired ${expiryInfo.days}d ago`
                      : `Expires in ${expiryInfo.days}d`}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                {isNew ? 'Create a new sales quotation' : `Last updated ${format(parseISO(formData.updatedAt!), 'MMM d, yyyy HH:mm')}`}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {isEditable && (
              <>
                <Button variant="outline" onClick={() => handleSave()} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" /> Save Draft
                </Button>
                <Button onClick={() => { setConfirmAction('send'); setConfirmDialogOpen(true); }} disabled={saving}>
                  <Send className="h-4 w-4 mr-2" /> Send
                </Button>
              </>
            )}
            {formData.status === 'sent' && (
              <>
                <Button variant="outline" onClick={() => { setConfirmAction('cancel'); setConfirmDialogOpen(true); }}>
                  <XCircle className="h-4 w-4 mr-2" /> Reject
                </Button>
                <Button onClick={() => { setConfirmAction('accept'); setConfirmDialogOpen(true); }}>
                  <CheckCircle className="h-4 w-4 mr-2" /> Accept
                </Button>
              </>
            )}
            {(formData.status === 'sent' || formData.status === 'accepted') && !formData.convertedToOrderId && (
              <Button
                size="lg"
                onClick={() => { setConfirmAction('convert'); setConfirmDialogOpen(true); }}
                className="bg-primary hover:bg-primary/90 shadow-md"
              >
                <ArrowRight className="h-4 w-4 mr-2" /> Convert to Sales Order
              </Button>
            )}
          </div>
        </div>

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
                  {studio.isFieldVisible('pricelist') && (
                    <div className="space-y-1">
                      <Label>{studio.getFieldLabel('pricelist', 'Pricelist')}</Label>
                      <Select value={formData.pricelistId} onValueChange={(v) => setFormData({ ...formData, pricelistId: v })} disabled={!isEditable}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Select pricelist" /></SelectTrigger>
                        <SelectContent>
                          {pricelists.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name} ({p.currency})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label>Quotation Date</Label>
                    <Input type="date" className="h-9" value={formData.quotationDate}
                      onChange={(e) => setFormData({ ...formData, quotationDate: e.target.value })}
                      disabled={!isEditable} />
                  </div>
                  <div className="space-y-1">
                    <Label>Valid Until</Label>
                    <Input type="date" className="h-9" value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
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
              </CardContent>
            </Card>

            {/* Billing */}
            <div ref={billingRef}>
              <BillingSection value={formData as any} onChange={(v) => setFormData(v as any)} disabled={!isEditable} />
            </div>

            {/* Delivery */}
            <DeliverySection value={formData as any} onChange={(v) => setFormData(v as any)} disabled={!isEditable} />

            {/* Order Lines */}
            <Card>
              <CardHeader className="pb-3 p-4"><CardTitle className="text-base">Products & Services</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0">
                <OrderLinesTable<QuotationLine>
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
                    id, productId: '', productName: '', quantity: 1, units: 1,
                    unitPrice: 0, discount: 0, discountType: 'percentage',
                    taxIds: [], subtotal: 0, taxAmount: 0, total: 0, gstRate: 18,
                  } as QuotationLine)}
                />
              </CardContent>
            </Card>

            {/* Notes & Terms */}
            <Card>
              <CardHeader className="pb-3 p-4"><CardTitle className="text-base">Notes & Terms</CardTitle></CardHeader>
              <CardContent className="space-y-3 p-4 pt-0">
                <div className="space-y-1">
                  <Label>Notes</Label>
                  <Textarea placeholder="" value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    disabled={!isEditable} rows={3} className="min-h-[72px]" />
                </div>
                <div className="space-y-1">
                  <Label>Terms & Conditions</Label>
                  <Textarea placeholder="" value={formData.termsAndConditions || ''}
                    onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                    disabled={!isEditable} rows={3} className="min-h-[72px]" />
                </div>
              </CardContent>
            </Card>

          {/* Summary (full width, right-aligned numbers) */}
            <Card>
              <CardHeader className="pb-3 p-4"><CardTitle className="text-base">Summary</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex justify-end">
                  <div className="w-full max-w-sm space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items</span>
                  <span className="font-medium">{lines.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Untaxed</span>
                  <span className="font-medium">{formatINR(formData.totalUntaxed || 0)}</span>
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
                      <span className="font-medium">{formatINR(formData.totalCGST || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">SGST</span>
                      <span className="font-medium">{formatINR(formData.totalSGST || 0)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IGST</span>
                    <span className="font-medium">{formatINR(formData.totalIGST || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total GST</span>
                  <span className="font-medium">{formatINR(formData.totalGST || 0)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-semibold">Grand Total</span>
                  <span className="text-xl font-bold text-primary">{formatINR(formData.grandTotal || 0)}</span>
                </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {!isNew && formData.convertedToOrderId && (
              <Card>
                <CardHeader className="pb-3 p-4"><CardTitle className="text-base">Linked Order</CardTitle></CardHeader>
                <CardContent className="p-4 pt-0">
                  <Button variant="outline" className="w-full"
                    onClick={() => navigate(`/sales/orders/${formData.convertedToOrderId}`)}>
                    <FileText className="h-4 w-4 mr-2" /> View Sales Order
                  </Button>
                </CardContent>
              </Card>
            )}

            {!isNew && versions.length > 0 && (
              <Card>
                <CardHeader className="pb-3 p-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <History className="h-4 w-4" /> Version History
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-72 overflow-auto p-4 pt-0">
                  {versions.slice().reverse().map((v) => (
                    <div key={v.version} className="flex items-center justify-between p-2 border rounded-md text-xs">
                      <div>
                        <div className="font-medium">v{v.version}</div>
                        <div className="text-muted-foreground">
                          {format(parseISO(v.createdAt), 'MMM d, HH:mm')} · {v.createdBy}
                        </div>
                      </div>
                      <div className="text-right font-medium">
                        {formatINR(v.data.total || 0)}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
        </div>
      </div>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'send' && 'Send Quotation?'}
              {confirmAction === 'accept' && 'Accept Quotation?'}
              {confirmAction === 'cancel' && 'Reject Quotation?'}
              {confirmAction === 'convert' && 'Convert to Sales Order?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'send' && 'Mark the quotation as sent.'}
              {confirmAction === 'accept' && 'Mark the quotation as accepted.'}
              {confirmAction === 'cancel' && 'This will reject the quotation.'}
              {confirmAction === 'convert' && 'This will create a new sales order from this quotation.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
