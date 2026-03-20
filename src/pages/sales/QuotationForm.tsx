import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Send,
  CheckCircle,
  XCircle,
  ArrowRight,
  Package,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import {
  getQuotation,
  getQuotations,
  saveQuotation,
  generateQuotationReference,
  getPricelists,
  getTaxRules,
  calculateLineTotal,
  applyPricelistPrice,
  checkStockAvailability,
  convertQuotationToOrder,
} from '@/lib/data/sales/storage';
import type { Quotation, QuotationLine, QuotationStatus, DiscountType } from '@/lib/data/sales/types';
import { getContacts } from '@/lib/data/sales';
import { getProducts } from '@/lib/data/inventory';
import { SALES_NAV } from '@/lib/navigation/sales';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useStudioConfig } from '@/hooks/useStudioConfig';
import { format, parseISO, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

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

export default function QuotationForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isNew = !id || id === 'new';
  const studio = useStudioConfig('sales', 'Quotation');
  
  const [contacts] = useState(() => getContacts());
  const [products] = useState(() => getProducts());
  const [pricelists] = useState(() => getPricelists());
  const [taxRules] = useState(() => getTaxRules());
  
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'send' | 'accept' | 'cancel' | 'convert' | null>(null);
  
  const [formData, setFormData] = useState<Partial<Quotation>>({
    customerId: '',
    customerName: '',
    quotationDate: new Date().toISOString().split('T')[0],
    validUntil: addDays(new Date(), 30).toISOString().split('T')[0],
    currency: 'INR',
    pricelistId: 'pl_standard',
    paymentTerms: 'net30',
    globalDiscount: 0,
    globalDiscountType: 'percentage',
    notes: '',
    termsAndConditions: 'Standard terms and conditions apply. Prices are valid for 30 days from the quotation date.',
    status: 'draft',
  });
  
  const [lines, setLines] = useState<QuotationLine[]>([]);
  const [newLine, setNewLine] = useState({
    productId: '',
    quantity: 1,
    discount: 0,
    discountType: 'percentage' as DiscountType,
    taxId: 'tax_18',
  });
  
  // Load existing quotation
  useEffect(() => {
    if (!isNew && id) {
      const quotation = getQuotation(id);
      if (quotation) {
        setFormData(quotation);
        setLines(quotation.lines);
      } else {
        toast({ title: 'Quotation not found', variant: 'destructive' });
        navigate('/sales/quotations');
      }
      setLoading(false);
    }
  }, [id, isNew, navigate, toast]);
  
  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
    const lineDiscount = lines.reduce((sum, line) => {
      if (line.discountType === 'percentage') {
        return sum + (line.unitPrice * line.quantity * line.discount / 100);
      }
      return sum + line.discount;
    }, 0);
    
    let globalDiscountAmount = 0;
    if (formData.globalDiscountType === 'percentage') {
      globalDiscountAmount = subtotal * (formData.globalDiscount || 0) / 100;
    } else {
      globalDiscountAmount = formData.globalDiscount || 0;
    }
    
    const taxableAmount = subtotal - globalDiscountAmount;
    const taxAmount = lines.reduce((sum, line) => sum + line.taxAmount, 0);
    const adjustedTax = taxAmount * (1 - (formData.globalDiscount || 0) / 100);
    
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discountAmount: Math.round((lineDiscount + globalDiscountAmount) * 100) / 100,
      taxAmount: Math.round(adjustedTax * 100) / 100,
      total: Math.round((taxableAmount + adjustedTax) * 100) / 100,
    };
  }, [lines, formData.globalDiscount, formData.globalDiscountType]);
  
  const handleCustomerChange = useCallback((customerId: string) => {
    const contact = contacts.find((c) => c.id === customerId);
    if (contact) {
      setFormData((prev) => ({
        ...prev,
        customerId,
        customerName: contact.company ? `${contact.name} - ${contact.company}` : contact.name,
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
    
    const line: QuotationLine = {
      id: crypto.randomUUID(),
      productId: product.id,
      productName: product.name,
      quantity: newLine.quantity,
      unitPrice,
      discount: newLine.discount,
      discountType: newLine.discountType,
      taxIds: [newLine.taxId],
      subtotal,
      taxAmount,
      total,
      stockAvailable: stockInfo.stockOnHand,
    };
    
    setLines((prev) => [...prev, line]);
    setNewLine({ productId: '', quantity: 1, discount: 0, discountType: 'percentage', taxId: 'tax_18' });
  }, [newLine, products, formData.pricelistId, toast]);
  
  const handleUpdateLine = useCallback((lineId: string, updates: Partial<QuotationLine>) => {
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
  
  const handleSave = useCallback(async (newStatus?: QuotationStatus) => {
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
      const quotationData: Quotation = {
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
        currency: formData.currency || 'USD',
        pricelistId: formData.pricelistId,
        paymentTerms: formData.paymentTerms,
        lines,
        globalDiscount: formData.globalDiscount || 0,
        globalDiscountType: formData.globalDiscountType || 'percentage',
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        taxAmount: totals.taxAmount,
        total: totals.total,
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
      };
      
      saveQuotation(quotationData);
      toast({
        title: isNew ? 'Quotation Created' : 'Quotation Updated',
        description: `${quotationData.reference} has been saved.`,
      });
      navigate('/sales/quotations');
    } catch (error) {
      toast({ title: 'Error saving quotation', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }, [formData, lines, totals, isNew, id, user, toast, navigate]);
  
  const handleConfirmAction = useCallback(() => {
    switch (confirmAction) {
      case 'send':
        handleSave('sent');
        break;
      case 'accept':
        handleSave('accepted');
        break;
      case 'cancel':
        handleSave('cancelled');
        break;
      case 'convert':
        const order = convertQuotationToOrder(id!, user?.id || '1', user?.name || 'System');
        if (order) {
          toast({ title: 'Order Created', description: `${order.reference} created` });
          navigate('/sales/orders');
        }
        break;
    }
    setConfirmDialogOpen(false);
  }, [confirmAction, handleSave, id, user, toast, navigate]);
  
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
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button onClick={() => { setConfirmAction('send'); setConfirmDialogOpen(true); }} disabled={saving}>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </>
            )}
            {formData.status === 'sent' && (
              <>
                <Button variant="outline" onClick={() => { setConfirmAction('cancel'); setConfirmDialogOpen(true); }}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button onClick={() => { setConfirmAction('accept'); setConfirmDialogOpen(true); }}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept
                </Button>
              </>
            )}
            {formData.status === 'accepted' && !formData.convertedToOrderId && (
              <Button onClick={() => { setConfirmAction('convert'); setConfirmDialogOpen(true); }}>
                <ArrowRight className="h-4 w-4 mr-2" />
                Convert to Order
              </Button>
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
                  {studio.isFieldVisible('customer') && (
                    <div className="space-y-2">
                      <Label>{studio.getFieldLabel('customer', 'Customer')} {studio.isFieldRequired('customer', true) && '*'}</Label>
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
                  )}
                  {studio.isFieldVisible('pricelist') && (
                    <div className="space-y-2">
                      <Label>{studio.getFieldLabel('pricelist', 'Pricelist')}</Label>
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
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Quotation Date</Label>
                    <Input
                      type="date"
                      value={formData.quotationDate}
                      onChange={(e) => setFormData({ ...formData, quotationDate: e.target.value })}
                      disabled={!isEditable}
                    />
                  </div>
                  {studio.isFieldVisible('expirationDate') && (
                    <div className="space-y-2">
                      <Label>{studio.getFieldLabel('expirationDate', 'Valid Until')}</Label>
                      <Input
                        type="date"
                        value={formData.validUntil}
                        onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                        disabled={!isEditable}
                      />
                    </div>
                  )}
                  {studio.isFieldVisible('paymentTerms') && (
                    <div className="space-y-2">
                      <Label>{studio.getFieldLabel('paymentTerms', 'Payment Terms')}</Label>
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
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Line Items */}
            <Card>
              <CardHeader>
                <CardTitle>Products & Services</CardTitle>
                <CardDescription>Add items to your quotation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Line */}
                {isEditable && (
                  <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg">
                    <Select
                      value={newLine.productId}
                      onValueChange={(v) => setNewLine({ ...newLine, productId: v })}
                    >
                      <SelectTrigger className="flex-1 min-w-[200px]">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              {p.name} - ₹{p.salePrice}
                              <Badge variant="outline" className="ml-2">
                                Stock: {p.stockOnHand}
                              </Badge>
                            </div>
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
                      placeholder="Qty"
                    />
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={newLine.discount}
                      onChange={(e) => setNewLine({ ...newLine, discount: parseFloat(e.target.value) || 0 })}
                      className="w-20"
                      placeholder="Disc %"
                    />
                    <Select
                      value={newLine.taxId}
                      onValueChange={(v) => setNewLine({ ...newLine, taxId: v })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Tax" />
                      </SelectTrigger>
                      <SelectContent>
                        {taxRules.filter((t) => t.isActive).map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddLine} size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                {/* Lines Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Product</TableHead>
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
                        <TableCell colSpan={isEditable ? 7 : 6} className="text-center py-8 text-muted-foreground">
                          No items added yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      lines.map((line) => {
                        const stockWarning = line.stockAvailable !== undefined && line.stockAvailable < line.quantity;
                        return (
                          <TableRow key={line.id} className="animate-fade-in">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">{line.productName}</p>
                                  {stockWarning && (
                                    <div className="flex items-center gap-1 text-xs text-warning">
                                      <AlertTriangle className="h-3 w-3" />
                                      Only {line.stockAvailable} in stock
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {isEditable ? (
                                <Input
                                  type="number"
                                  min="1"
                                  value={line.quantity}
                                  onChange={(e) => handleUpdateLine(line.id, { quantity: parseInt(e.target.value) || 1 })}
                                  className="w-20 text-right ml-auto"
                                />
                              ) : (
                                line.quantity
                              )}
                            </TableCell>
                            <TableCell className="text-right">{`₹${line.unitPrice.toLocaleString('en-IN')}`}</TableCell>
                            <TableCell className="text-right">
                              {line.discount > 0 ? (
                                <Badge variant="outline" className="text-success">
                                  -{line.discount}{line.discountType === 'percentage' ? '%' : '$'}
                                </Badge>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-right">{`₹${line.taxAmount.toLocaleString('en-IN')}`}</TableCell>
                            <TableCell className="text-right font-semibold">{`₹${line.total.toLocaleString('en-IN')}`}</TableCell>
                            {isEditable && (
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveLine(line.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                  {lines.length > 0 && (
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={isEditable ? 5 : 4} className="text-right font-medium">Subtotal</TableCell>
                        <TableCell className="text-right">{`₹${totals.subtotal.toLocaleString('en-IN')}`}</TableCell>
                        {isEditable && <TableCell />}
                      </TableRow>
                      {totals.discountAmount > 0 && (
                        <TableRow>
                          <TableCell colSpan={isEditable ? 5 : 4} className="text-right font-medium text-success">Discount</TableCell>
                          <TableCell className="text-right text-success">{`-₹${totals.discountAmount.toLocaleString('en-IN')}`}</TableCell>
                          {isEditable && <TableCell />}
                        </TableRow>
                      )}
                      <TableRow>
                        <TableCell colSpan={isEditable ? 5 : 4} className="text-right font-medium">Tax</TableCell>
                        <TableCell className="text-right">{`₹${totals.taxAmount.toLocaleString('en-IN')}`}</TableCell>
                        {isEditable && <TableCell />}
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={isEditable ? 5 : 4} className="text-right font-bold text-lg">Total</TableCell>
                        <TableCell className="text-right font-bold text-lg">{`₹${totals.total.toLocaleString('en-IN')}`}</TableCell>
                        {isEditable && <TableCell />}
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </CardContent>
            </Card>
            
            {/* Notes & Terms */}
            <Card>
              <CardHeader>
                <CardTitle>Notes & Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Add any notes for the customer..."
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    disabled={!isEditable}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Terms & Conditions</Label>
                  <Textarea
                    placeholder="Terms and conditions..."
                    value={formData.termsAndConditions || ''}
                    onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                    disabled={!isEditable}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items</span>
                  <span className="font-medium">{lines.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">₹{totals.subtotal.toLocaleString('en-IN')}</span>
                </div>
                {totals.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-success">
                    <span>Discount</span>
                    <span>-₹{totals.discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">₹{totals.taxAmount.toLocaleString('en-IN')}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold">₹{totals.total.toLocaleString('en-IN')}</span>
                </div>
              </CardContent>
            </Card>
            
            {/* Global Discount */}
            {isEditable && (
              <Card>
                <CardHeader>
                  <CardTitle>Global Discount</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      max={formData.globalDiscountType === 'percentage' ? 100 : totals.subtotal}
                      value={formData.globalDiscount || 0}
                      onChange={(e) => setFormData({ ...formData, globalDiscount: parseFloat(e.target.value) || 0 })}
                      className="flex-1"
                    />
                    <Select
                      value={formData.globalDiscountType}
                      onValueChange={(v: DiscountType) => setFormData({ ...formData, globalDiscountType: v })}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">%</SelectItem>
                        <SelectItem value="fixed">₹</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Actions */}
            {!isNew && formData.status === 'accepted' && formData.convertedToOrderId && (
              <Card>
                <CardHeader>
                  <CardTitle>Linked Order</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/sales/orders/${formData.convertedToOrderId}`)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Sales Order
                  </Button>
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
              {confirmAction === 'send' && 'Send Quotation?'}
              {confirmAction === 'accept' && 'Accept Quotation?'}
              {confirmAction === 'cancel' && 'Reject Quotation?'}
              {confirmAction === 'convert' && 'Convert to Sales Order?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'send' && 'This will mark the quotation as sent. You can still edit it until the customer responds.'}
              {confirmAction === 'accept' && 'This will mark the quotation as accepted. You can then convert it to a sales order.'}
              {confirmAction === 'cancel' && 'This will mark the quotation as rejected/cancelled.'}
              {confirmAction === 'convert' && 'This will create a new sales order from this quotation.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
