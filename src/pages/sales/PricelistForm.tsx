import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
} from '@/components/ui/table';
import { ArrowLeft, Plus, Trash2, Percent } from 'lucide-react';
import { usePricelist, useSavePricelist, type SbPricelistItem } from '@/hooks/sales';
import { useProducts } from '@/hooks/inventory';
import { SALES_NAV } from '@/lib/navigation/sales';
import { useToast } from '@/hooks/use-toast';

const CURRENCIES = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'INR', label: 'Indian Rupee (₹)' },
];

export default function PricelistForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { data: products = [] } = useProducts();
  const isEdit = !!id;
  const { data: existing } = usePricelist(id);
  const saveMut = useSavePricelist();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    currency: 'INR',
    isActive: true,
    isDefault: false,
  });
  type LocalRule = Omit<SbPricelistItem, 'id' | 'pricelistId'> & { tmpId: string };
  const [rules, setRules] = useState<LocalRule[]>([]);
  const [newRule, setNewRule] = useState({
    productId: '',
    minQuantity: 1,
    discountPercentage: 0,
  });

  useEffect(() => {
    if (existing) {
      setFormData({
        name: existing.name,
        code: existing.code ?? '',
        currency: existing.currency,
        isActive: existing.isActive,
        isDefault: existing.isDefault,
      });
      setRules((existing.items ?? []).map(i => ({
        tmpId: i.id,
        productId: i.productId,
        price: i.price,
        minQty: i.minQty,
        categoryId: i.categoryId,
        discountPercentage: i.discountPercentage,
        startDate: i.startDate,
        endDate: i.endDate,
      })));
    }
  }, [existing]);

  const handleAddRule = useCallback(() => {
    if (newRule.minQuantity < 1 || newRule.discountPercentage < 0) {
      toast({ title: 'Invalid rule values', variant: 'destructive' });
      return;
    }
    setRules(prev => [...prev, {
      tmpId: crypto.randomUUID(),
      productId: newRule.productId || null,
      price: 0,
      minQty: newRule.minQuantity,
      categoryId: null,
      discountPercentage: newRule.discountPercentage,
      startDate: null,
      endDate: null,
    }]);
    setNewRule({ productId: '', minQuantity: 1, discountPercentage: 0 });
  }, [newRule, toast]);

  const handleSubmit = useCallback(() => {
    if (!formData.name || !formData.code) {
      toast({ title: 'Please fill required fields', variant: 'destructive' });
      return;
    }
    saveMut.mutate(
      {
        pricelist: {
          ...(id ? { id } : {}),
          name: formData.name,
          code: formData.code,
          currency: formData.currency,
          isActive: formData.isActive,
          isDefault: formData.isDefault,
        },
        items: rules.map(({ tmpId, ...rest }) => rest),
      },
      {
        onSuccess: () => {
          toast({ title: isEdit ? 'Pricelist updated' : 'Pricelist created' });
          navigate('/sales/pricelists');
        },
        onError: (e: any) => toast({ title: e?.message ?? 'Save failed', variant: 'destructive' }),
      },
    );
  }, [formData, rules, id, isEdit, toast, navigate, saveMut]);

  return (
    <AppLayout title="Sales" moduleNav={SALES_NAV}>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/sales/pricelists')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {isEdit ? 'Edit Pricelist' : 'New Pricelist'}
            </h1>
            <p className="text-muted-foreground">Configure pricing rules and discounts</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pricelist Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Code *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Currency</Label>
                <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-6 pt-6">
                <div className="flex items-center gap-2">
                  <Switch checked={formData.isActive} onCheckedChange={(v) => setFormData({ ...formData, isActive: v })} />
                  <Label>Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={formData.isDefault} onCheckedChange={(v) => setFormData({ ...formData, isDefault: v })} />
                  <Label>Default</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Discount Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 p-3 bg-muted/50 rounded-lg">
              <Select value={newRule.productId} onValueChange={(v) => setNewRule({ ...newRule, productId: v })}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="All products" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Products</SelectItem>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number" min="1"
                value={newRule.minQuantity}
                onChange={(e) => setNewRule({ ...newRule, minQuantity: parseInt(e.target.value) || 1 })}
                className="w-24"
              />
              <div className="flex items-center gap-1">
                <Input
                  type="number" min="0" max="100"
                  value={newRule.discountPercentage}
                  onChange={(e) => setNewRule({ ...newRule, discountPercentage: parseFloat(e.target.value) || 0 })}
                  className="w-20"
                />
                <Percent className="h-4 w-4 text-muted-foreground" />
              </div>
              <Button size="icon" onClick={handleAddRule}><Plus className="h-4 w-4" /></Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Min Qty</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      No rules added yet
                    </TableCell>
                  </TableRow>
                ) : (
                  rules.map(rule => (
                    <TableRow key={rule.tmpId}>
                      <TableCell>
                        {rule.productId
                          ? products.find(p => p.id === rule.productId)?.name || 'Unknown'
                          : 'All Products'}
                      </TableCell>
                      <TableCell className="text-right">{rule.minQty}+</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="text-success">-{rule.discountPercentage ?? 0}%</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => setRules(prev => prev.filter(r => r.tmpId !== rule.tmpId))} className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate('/sales/pricelists')}>Cancel</Button>
          <Button onClick={handleSubmit}>{isEdit ? 'Update' : 'Create'} Pricelist</Button>
        </div>
      </div>
    </AppLayout>
  );
}
