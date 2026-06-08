import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { SALES_NAV } from '@/lib/navigation/sales';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import {
  useCustomers,
  useSubscription,
  useSaveSubscriptionWithLines,
  type SbSubscription,
  type SbSubscriptionLine,
} from '@/hooks/sales';
import { generateSubscriptionReferenceRich } from '@/lib/services/sales/api';
type BillingCycle = 'monthly' | 'quarterly' | 'yearly';
import { useProducts } from '@/hooks/inventory';
import { useToast } from '@/hooks/use-toast';
import { addMonths, addQuarters, addYears } from 'date-fns';

export default function SubscriptionForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEdit = !!id;

  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();
  const { data: editingSub } = useSubscription(id);
  const saveSubMut = useSaveSubscriptionWithLines();

  const [formData, setFormData] = useState({
    customerId: '',
    billingCycle: 'monthly' as BillingCycle,
    productId: '',
    quantity: 1,
    unitPrice: 0,
  });

  useEffect(() => {
    if (editingSub) {
      const first = editingSub.lines?.[0];
      setFormData({
        customerId: editingSub.customerId ?? '',
        billingCycle: (editingSub.billingCycle as BillingCycle) || 'monthly',
        productId: first?.productId ?? '',
        quantity: first?.quantity ?? 1,
        unitPrice: first?.unitPrice ?? 0,
      });
    }
  }, [editingSub]);

  const handleProductChange = useCallback((productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setFormData((prev) => ({ ...prev, productId, unitPrice: product.salePrice }));
    }
  }, [products]);

  const subtotal = formData.unitPrice * formData.quantity;
  const taxAmount = subtotal * 0.18;
  const total = subtotal + taxAmount;

  const handleSubmit = async () => {
    if (!formData.customerId || !formData.productId) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    const customer = customers.find((c) => c.id === formData.customerId);
    const product = products.find((p) => p.id === formData.productId);
    if (!customer || !product) return;

    const getNextBillingDate = (cycle: BillingCycle, fromDate: Date) => {
      switch (cycle) {
        case 'monthly': return addMonths(fromDate, 1);
        case 'quarterly': return addQuarters(fromDate, 1);
        case 'yearly': return addYears(fromDate, 1);
      }
    };

    const now = new Date();
    const reference = editingSub?.reference || await generateSubscriptionReferenceRich();
    const customerName = customer.company ? `${customer.name} - ${customer.company}` : customer.name;

    const subscription: Partial<SbSubscription> = {
      id: editingSub?.id,
      reference,
      customerId: formData.customerId,
      customerName,
      status: editingSub?.status || 'draft',
      billingCycle: formData.billingCycle,
      billingPeriod: editingSub?.billingPeriod || formData.billingCycle,
      price: formData.unitPrice,
      productId: formData.productId,
      startDate: editingSub?.startDate || now.toISOString().split('T')[0],
      nextBillingDate: editingSub?.nextBillingDate || getNextBillingDate(formData.billingCycle, now).toISOString().split('T')[0],
      endDate: editingSub?.endDate ?? null,
      subtotal,
      taxAmount,
      total,
      currency: 'INR',
      paymentTerms: editingSub?.paymentTerms ?? null,
      lastOrderId: editingSub?.lastOrderId ?? null,
      orderHistory: editingSub?.orderHistory ?? [],
    };
    const lines: Array<Omit<SbSubscriptionLine, 'id' | 'subscriptionId'>> = [{
      productId: formData.productId,
      productName: product.name,
      quantity: formData.quantity,
      unitPrice: formData.unitPrice,
      discount: 0,
    }];
    try {
      await saveSubMut.mutateAsync({ subscription, lines });
      toast({ title: editingSub ? 'Subscription updated' : 'Subscription created' });
      navigate('/sales/subscriptions');
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message ?? String(e), variant: 'destructive' });
    }
  };

  return (
    <AppLayout title="Sales" moduleNav={SALES_NAV}>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/sales/subscriptions')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {isEdit ? 'Edit Subscription' : 'New Subscription'}
            </h1>
            <p className="text-muted-foreground">
              {isEdit ? 'Update subscription details' : 'Set up a recurring billing'}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Customer *</Label>
              <Select value={formData.customerId} onValueChange={(v) => setFormData({ ...formData, customerId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} {c.company && `- ${c.company}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Billing Cycle</Label>
              <Select value={formData.billingCycle} onValueChange={(v: BillingCycle) => setFormData({ ...formData, billingCycle: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Product/Service *</Label>
              <Select value={formData.productId} onValueChange={handleProductChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} - ₹{p.salePrice}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Unit Price</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Tax (18%)</span>
                <span>₹{taxAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total per {formData.billingCycle.replace('ly', '')}</span>
                <span>₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate('/sales/subscriptions')}>Cancel</Button>
          <Button onClick={handleSubmit}>{isEdit ? 'Update' : 'Create'} Subscription</Button>
        </div>
      </div>
    </AppLayout>
  );
}
