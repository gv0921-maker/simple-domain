import { useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SALES_NAV } from '@/lib/navigation/sales';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Pencil, Tag, X } from 'lucide-react';
import {
  getPromotions, savePromotion, deletePromotion,
  type SeasonalPromotion, type PromotionDiscountType,
} from '@/lib/sales/promotionStorage';
import { useProducts } from '@/hooks/inventory';
import { useAuth } from '@/contexts/AuthContext';
import { useRoleCheck } from '@/hooks/auth/useRoleCheck';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

const emptyPromo = (): Partial<SeasonalPromotion> => ({
  name: '',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  discountType: 'percent',
  discountValue: 10,
  applicableProductIds: [],
  active: true,
});

export default function PromotionsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isAdminOrSuper, hasAnyRole } = useRoleCheck();
  const canManage = isAdminOrSuper || hasAnyRole(['manager', 'sales_manager']);

  const { data: products = [] } = useProducts();
  const [items, setItems] = useState<SeasonalPromotion[]>(() => getPromotions());
  const [editing, setEditing] = useState<Partial<SeasonalPromotion> | null>(null);

  const reload = () => setItems(getPromotions());

  const handleSave = () => {
    if (!editing) return;
    if (!editing.name?.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    savePromotion({ ...editing, createdBy: editing.createdBy || user?.name });
    setEditing(null);
    reload();
    toast({ title: 'Promotion saved' });
  };

  const handleDelete = (id: string) => {
    deletePromotion(id);
    reload();
    toast({ title: 'Promotion deleted' });
  };

  const toggleActive = (p: SeasonalPromotion) => {
    savePromotion({ ...p, active: !p.active });
    reload();
  };

  const toggleProduct = (productId: string) => {
    if (!editing) return;
    const list = editing.applicableProductIds || [];
    setEditing({
      ...editing,
      applicableProductIds: list.includes(productId)
        ? list.filter((x) => x !== productId)
        : [...list, productId],
    });
  };

  if (!canManage) {
    return (
      <AppLayout title="Sales" moduleNav={SALES_NAV}>
        <div className="p-8 text-center text-muted-foreground">
          Promotions management is restricted to managers and admins.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Sales" moduleNav={SALES_NAV}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Tag className="h-6 w-6" /> Seasonal Promotions
            </h1>
            <p className="text-muted-foreground">Create time-bound discounts on selected products.</p>
          </div>
          {!editing && (
            <Button onClick={() => setEditing(emptyPromo())}>
              <Plus className="h-4 w-4 mr-2" /> New Promotion
            </Button>
          )}
        </div>

        {editing && (
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">{editing.id ? 'Edit Promotion' : 'New Promotion'}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setEditing(null)}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="" />
                </div>
                <div className="flex items-center gap-2 sm:justify-end">
                  <Label>Active</Label>
                  <Switch checked={editing.active ?? true} onCheckedChange={(v) => setEditing({ ...editing, active: v })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={editing.startDate || ''} onChange={(e) => setEditing({ ...editing, startDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={editing.endDate || ''} onChange={(e) => setEditing({ ...editing, endDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select
                    value={editing.discountType || 'percent'}
                    onValueChange={(v) => setEditing({ ...editing, discountType: v as PromotionDiscountType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Percent (%)</SelectItem>
                      <SelectItem value="amount">Amount (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input type="number" min={0} value={editing.discountValue ?? 0}
                    onChange={(e) => setEditing({ ...editing, discountValue: Number(e.target.value) })} placeholder="" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Min Order Value (optional)</Label>
                <Input type="number" min={0} value={editing.minOrderValue ?? ''}
                  onChange={(e) => setEditing({ ...editing, minOrderValue: e.target.value === '' ? undefined : Number(e.target.value) })}
                  placeholder="" className="max-w-xs" />
              </div>
              <div className="space-y-2">
                <Label>Applicable Products ({editing.applicableProductIds?.length || 0} selected — leave empty for all)</Label>
                <div className="border border-border rounded-md max-h-56 overflow-y-auto p-2 space-y-1">
                  {products.map((p) => {
                    const selected = editing.applicableProductIds?.includes(p.id);
                    return (
                      <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded">
                        <input type="checkbox" checked={!!selected} onChange={() => toggleProduct(p.id)} />
                        {p.name}
                      </label>
                    );
                  })}
                  {products.length === 0 && (
                    <div className="text-xs text-muted-foreground p-2">No products available.</div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                <Button onClick={handleSave}>Save Promotion</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Min Order</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No promotions yet. Click "New Promotion" to create one.
                    </TableCell>
                  </TableRow>
                )}
                {items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-sm">
                      {format(parseISO(p.startDate), 'MMM d')} – {format(parseISO(p.endDate), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {p.discountType === 'percent' ? `${p.discountValue}%` : formatINR(p.discountValue)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.applicableProductIds.length === 0 ? 'All' : `${p.applicableProductIds.length} product(s)`}
                    </TableCell>
                    <TableCell className="text-sm">{p.minOrderValue ? formatINR(p.minOrderValue) : '—'}</TableCell>
                    <TableCell><Switch checked={p.active} onCheckedChange={() => toggleActive(p)} /></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setEditing(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
