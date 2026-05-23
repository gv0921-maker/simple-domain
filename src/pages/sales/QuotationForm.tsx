import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import {
  getQuotation, saveQuotation, generateQuotationReference,
  getPricelists, convertQuotationToOrder,
} from '@/lib/services/sales/storage';
import type {
  Quotation, QuotationLine, QuotationStatus,
  GSTType, OrderDiscountType,
} from '@/lib/services/sales/types';
import { determineGSTType, validatePhone, validateGSTIN } from '@/lib/services/sales';
import { useContacts } from '@/hooks/crm';
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
  expired: { label: 'Expired', className: 'bg-warning/20 text-warning-foreground border-warning' },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/20 text-destructive border-destructive' },
};

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);

export default function QuotationForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const isNew = !id || id === 'new';
  const studio = useStudioConfig('sales', 'Quotation');

  const { data: contacts = [], isLoading: contactsLoading } = useContacts();
  const [pricelists] = useState(() => getPricelists());
  const [customerOpen, setCustomerOpen] = useState(false);

  const urlCustomerId = searchParams.get('customerId');
  const urlOpportunityId = searchParams.get('opportunityId');

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
    pricelistId: 'pl_standard',
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
    if (!isNew && id) {
      const q = getQuotation(id);
      if (q) {
        setFormData(q);
        setLines(q.lines);
      } else {
        toast({ title: 'Quotation not found', variant: 'destructive' });
        navigate('/sales/quotations');
      }
      setLoading(false);
    }
  }, [id, isNew, navigate, toast]);

  // Auto-populate billing from selected contact
  const populateFromContact = useCallback((c: any) => {
    const fullName = [c.firstName, c.lastName].filter(Boolean).join(' ').trim() || c.name || '';
    const phone1 = c.phones?.[0]?.phone || c.phone || '';
    const phone2 = c.phones?.[1]?.phone || '';
    const billing = c.addresses?.find((a: any) => a.type === 'billing' || a.type === 'both') || c.addresses?.[0] || {};
    setFormData((prev) => ({
      ...prev,
      customerId: c.id,
      customerName: fullName,
      billingCustomerName: fullName,
      billingName: fullName,
      billingPhone1: phone1,
      billingPhone2: phone2,
      billingAddressLine1: billing.street || '',
      billingAddressLine2: billing.street2 || '',
      billingCity: billing.city || '',
      billingState: billing.state || '',
      billingZip: billing.postalCode || '',
    }));
  }, []);

  const handleCustomerChange = useCallback((customerId: string) => {
    const c: any = contacts.find((x) => x.id === customerId);
    if (!c) return;
    populateFromContact(c);
  }, [contacts, populateFromContact]);

  useEffect(() => {
    if (isNew && urlCustomerId) handleCustomerChange(urlCustomerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, urlCustomerId]);

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
      const data: Quotation = {
        id: isNew ? crypto.randomUUID() : id!,
        reference: formData.reference || generateQuotationReference(),
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

      saveQuotation(data);
      toast({ title: isNew ? 'Quotation Created' : 'Quotation Updated', description: `${data.reference} saved.` });
      navigate('/sales/quotations');
    } catch (error) {
      toast({ title: 'Error saving quotation', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }, [formData, lines, isNew, id, user, toast, navigate, validate]);

  const handleConfirmAction = useCallback(() => {
    switch (confirmAction) {
      case 'send': handleSave('sent'); break;
      case 'accept': handleSave('accepted'); break;
      case 'cancel': handleSave('cancelled'); break;
      case 'convert': {
        const order = convertQuotationToOrder(id!, user?.id || '1', user?.name || 'System');
        if (order) {
          toast({ title: 'Order Created', description: `${order.reference} created` });
          navigate('/sales/orders');
        }
        break;
      }
    }
    setConfirmDialogOpen(false);
  }, [confirmAction, handleSave, id, user, toast, navigate]);

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
      <div className="p-6 space-y-6">
        {/* Header */}
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
            {formData.status === 'accepted' && !formData.convertedToOrderId && (
              <Button onClick={() => { setConfirmAction('convert'); setConfirmDialogOpen(true); }}>
                <ArrowRight className="h-4 w-4 mr-2" /> Convert to Order
              </Button>
            )}
          </div>
        </div>

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
                      <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            disabled={!isEditable || contactsLoading}
                            className="w-full justify-between font-normal"
                          >
                            {contactsLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <span className="truncate">
                                {formData.customerId
                                  ? (contacts.find((c: any) => c.id === formData.customerId) &&
                                      ([(contacts.find((c: any) => c.id === formData.customerId) as any).firstName,
                                        (contacts.find((c: any) => c.id === formData.customerId) as any).lastName]
                                        .filter(Boolean).join(' ') || formData.customerName))
                                  : 'Select customer...'}
                              </span>
                            )}
                            {!contactsLoading && <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
                          <Command
                            filter={(value, search) => {
                              if (!search) return 1;
                              return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
                            }}
                          >
                            <CommandInput placeholder="Search by name, email, phone..." />
                            <CommandList>
                              <CommandEmpty>No customer found.</CommandEmpty>
                              <CommandGroup>
                                {contacts.map((c: any) => {
                                  const fullName = [c.firstName, c.lastName].filter(Boolean).join(' ').trim() || c.name || '(No name)';
                                  const email = c.email || c.emails?.[0]?.email || '';
                                  const phone = c.phone || c.phones?.[0]?.phone || '';
                                  const searchValue = `${fullName} ${email} ${phone}`;
                                  return (
                                    <CommandItem
                                      key={c.id}
                                      value={searchValue}
                                      onSelect={() => {
                                        populateFromContact(c);
                                        setCustomerOpen(false);
                                      }}
                                      className="flex items-center justify-between gap-2"
                                    >
                                      <div className="flex flex-col min-w-0">
                                        <span className="font-semibold truncate">{fullName}</span>
                                        {email && (
                                          <span className="text-xs text-muted-foreground truncate">{email}</span>
                                        )}
                                      </div>
                                      <Check
                                        className={cn(
                                          'h-4 w-4 shrink-0',
                                          formData.customerId === c.id ? 'opacity-100' : 'opacity-0',
                                        )}
                                      />
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                  {studio.isFieldVisible('pricelist') && (
                    <div className="space-y-2">
                      <Label>{studio.getFieldLabel('pricelist', 'Pricelist')}</Label>
                      <Select value={formData.pricelistId} onValueChange={(v) => setFormData({ ...formData, pricelistId: v })} disabled={!isEditable}>
                        <SelectTrigger><SelectValue placeholder="Select pricelist" /></SelectTrigger>
                        <SelectContent>
                          {pricelists.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name} ({p.currency})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Quotation Date</Label>
                    <Input type="date" value={formData.quotationDate}
                      onChange={(e) => setFormData({ ...formData, quotationDate: e.target.value })}
                      disabled={!isEditable} />
                  </div>
                  <div className="space-y-2">
                    <Label>Valid Until</Label>
                    <Input type="date" value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
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
              <CardHeader><CardTitle>Products & Services</CardTitle></CardHeader>
              <CardContent>
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
              <CardHeader><CardTitle>Notes & Terms</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea placeholder="" value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    disabled={!isEditable} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Terms & Conditions</Label>
                  <Textarea placeholder="" value={formData.termsAndConditions || ''}
                    onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                    disabled={!isEditable} rows={4} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items</span>
                  <span className="font-medium">{lines.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
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
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold">{formatINR(formData.grandTotal || 0)}</span>
                </div>
              </CardContent>
            </Card>

            {!isNew && formData.status === 'accepted' && formData.convertedToOrderId && (
              <Card>
                <CardHeader><CardTitle>Linked Order</CardTitle></CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full"
                    onClick={() => navigate(`/sales/orders/${formData.convertedToOrderId}`)}>
                    <FileText className="h-4 w-4 mr-2" /> View Sales Order
                  </Button>
                </CardContent>
              </Card>
            )}

            {!isNew && versions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <History className="h-4 w-4" /> Version History
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-72 overflow-auto">
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
