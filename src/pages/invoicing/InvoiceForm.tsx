import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { INVOICING_NAV } from '@/lib/navigation/invoicing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Plus, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react';
import {
  useSaveInvoice, useSetInvoicePriceApproval,
  type InvoiceType, type PaymentMethod,
} from '@/hooks/invoicing';
import { useCustomers } from '@/hooks/sales';
import { useProducts } from '@/hooks/inventory';
import { toast } from 'sonner';

interface DraftLine {
  tmpId: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  subtotal: number;
}

const TYPE_LABEL: Record<InvoiceType, string> = {
  regular: 'Invoice',
  warranty: 'Warranty Bill',
  factory: 'Factory Bill',
};

const TYPE_BACK: Record<InvoiceType, string> = {
  regular: '/invoicing/bills',
  warranty: '/invoicing/warranty-bills',
  factory: '/invoicing/factory-bills',
};

export default function InvoiceForm() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialType = (params.get('type') as InvoiceType) || 'regular';
  const TAX_RATE = 0.18;

  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();
  const saveInvoice = useSaveInvoice();
  const setApproval = useSetInvoicePriceApproval();

  const [type, setType] = useState<InvoiceType>(
    (['regular', 'warranty', 'factory'] as InvoiceType[]).includes(initialType) ? initialType : 'regular',
  );
  const [customerId, setCustomerId] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [newProductId, setNewProductId] = useState<string>('');
  const [newQty, setNewQty] = useState<number>(1);
  const [newPrice, setNewPrice] = useState<number>(0);

  const isRestricted = type === 'warranty' || type === 'factory';
  const showGst = type !== 'factory';

  const eligibleProducts = useMemo(() => {
    if (type === 'warranty') return products.filter((p) => p.warrantyEligible);
    if (type === 'factory') return products.filter((p) => p.factoryEligible);
    return products;
  }, [products, type]);

  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.subtotal, 0), [lines]);
  const tax = showGst ? subtotal * TAX_RATE : 0;
  const total = subtotal + tax;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

  const handleAddLine = () => {
    const product = products.find((p) => p.id === newProductId);
    if (!product) {
      toast.error('Please select a product');
      return;
    }
    if (type === 'warranty' && !product.warrantyEligible) {
      toast.error(`"${product.name}" is not warranty-eligible`);
      return;
    }
    if (type === 'factory' && !product.factoryEligible) {
      toast.error(`"${product.name}" is not factory-eligible`);
      return;
    }
    if (newPrice <= 0) {
      toast.error('Unit price must be greater than zero');
      return;
    }
    setLines((curr) => [
      ...curr,
      {
        tmpId: `L-${Date.now()}`,
        product_id: product.id,
        description: product.name,
        quantity: newQty,
        unit_price: newPrice,
        tax_rate: showGst ? TAX_RATE * 100 : 0,
        subtotal: newQty * newPrice,
      },
    ]);
    setNewProductId('');
    setNewQty(1);
    setNewPrice(0);
  };

  const doSave = async (opts: { requestApproval?: boolean } = {}) => {
    if (!customerId) {
      toast.error('Please select a customer');
      return null;
    }
    if (lines.length === 0) {
      toast.error('Please add at least one line');
      return null;
    }
    if (isRestricted && paymentMethod !== 'cash') {
      toast.error('Warranty and Factory Bills must use Cash payment only');
      return null;
    }
    try {
      const saved = await saveInvoice.mutateAsync({
        customer_id: customerId,
        type,
        issue_date: issueDate,
        due_date: dueDate || null,
        status: 'draft',
        subtotal,
        tax_amount: tax,
        discount_amount: 0,
        total,
        paid_amount: 0,
        currency: 'INR',
        price_approval_status: opts.requestApproval ? 'pending' : 'not_required',
        notes: isRestricted ? `Payment method: ${paymentMethod}` : null,
        lines: lines.map((l) => ({
          product_id: l.product_id,
          description: l.description,
          quantity: l.quantity,
          unit_price: l.unit_price,
          discount: 0,
          tax_rate: l.tax_rate,
          subtotal: l.subtotal,
        })),
      });
      toast.success(
        opts.requestApproval
          ? `${TYPE_LABEL[type]} created — sent for price approval`
          : `${TYPE_LABEL[type]} created`,
      );
      navigate(TYPE_BACK[type]);
      return saved;
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to create invoice');
      return null;
    }
  };

  const handleSubmit = () => doSave({});
  const handleRequestApproval = () => doSave({ requestApproval: true });

  return (
    <AppLayout title="Invoices" subtitle={`New ${TYPE_LABEL[type]}`} moduleNav={INVOICING_NAV}>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">New {TYPE_LABEL[type]}</h1>
            <p className="text-muted-foreground">Create a new customer invoice with line items</p>
          </div>
        </div>

        {isRestricted && (
          <Card className="border-warning">
            <CardContent className="py-3 flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span>
                <strong>Cash payment only.</strong> Only{' '}
                {type === 'warranty' ? 'warranty-eligible' : 'factory-eligible'} products may be billed.
                Prices require Super Admin approval before finalisation.
              </span>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as InvoiceType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="warranty">Warranty</SelectItem>
                    <SelectItem value="factory">Factory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Customer *</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Invoice Date</Label>
                <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Due Date</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="grid gap-2 col-span-2">
                <Label>Payment Method</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer" disabled={isRestricted}>
                      Bank Transfer{isRestricted ? ' (not allowed)' : ''}
                    </SelectItem>
                    <SelectItem value="cheque" disabled={isRestricted}>
                      Cheque{isRestricted ? ' (not allowed)' : ''}
                    </SelectItem>
                    <SelectItem value="card" disabled={isRestricted}>
                      Card{isRestricted ? ' (not allowed)' : ''}
                    </SelectItem>
                    <SelectItem value="upi" disabled={isRestricted}>
                      UPI{isRestricted ? ' (not allowed)' : ''}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Lines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Select
                value={newProductId}
                onValueChange={(v) => {
                  setNewProductId(v);
                  const p = products.find((pp) => pp.id === v);
                  if (p) setNewPrice(Number(p.salePrice) || 0);
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={
                    eligibleProducts.length
                      ? 'Select a product'
                      : isRestricted
                        ? `No ${type}-eligible products`
                        : 'Select a product'
                  } />
                </SelectTrigger>
                <SelectContent>
                  {eligibleProducts.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {p.sku}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Qty"
                value={newQty}
                onChange={(e) => setNewQty(parseInt(e.target.value) || 1)}
                className="w-20"
              />
              <Input
                type="number"
                placeholder="Price"
                value={newPrice || ''}
                onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                className="w-28"
              />
              <Button onClick={handleAddLine}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>

            {lines.length > 0 && (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product/Service</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">{showGst ? 'Subtotal' : 'Total'}</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((line) => (
                      <TableRow key={line.tmpId}>
                        <TableCell>{line.description}</TableCell>
                        <TableCell className="text-right">{line.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(line.unit_price)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(line.subtotal)}</TableCell>
                        <TableCell>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setLines(lines.filter((l) => l.tmpId !== line.tmpId))}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex justify-end">
                  <div className="w-64 space-y-1">
                    {showGst && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span><span>{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>GST (18%):</span><span>{formatCurrency(tax)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between font-bold border-t pt-1">
                      <span>{showGst ? 'Total' : 'Grand Total'}:</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          {isRestricted && (
            <Button
              variant="secondary"
              onClick={handleRequestApproval}
              disabled={saveInvoice.isPending || setApproval.isPending}
            >
              <ShieldCheck className="h-4 w-4 mr-1" />
              Request Price Approval
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={saveInvoice.isPending}>
            {saveInvoice.isPending ? 'Saving…' : `Create ${TYPE_LABEL[type]}`}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}