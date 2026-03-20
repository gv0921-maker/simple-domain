import { useState, useMemo, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Search,
  Plus,
  MoreHorizontal,
  Trash2,
  Tag,
  Pencil,
  Check,
  DollarSign,
  Percent,
} from 'lucide-react';
import { getPricelists, savePricelist, deletePricelist } from '@/lib/data/sales/storage';
import type { Pricelist, PricelistRule } from '@/lib/data/sales/types';
import { getProducts } from '@/lib/data/inventory';
import { SALES_NAV } from '@/lib/navigation/sales';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const CURRENCIES = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'INR', label: 'Indian Rupee (₹)' },
];

export default function PricelistsPage() {
  const { toast } = useToast();
  const [pricelists, setPricelists] = useState<Pricelist[]>(() => getPricelists());
  const [products] = useState(() => getProducts());
  const [search, setSearch] = useState('');
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPricelist, setEditingPricelist] = useState<Pricelist | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    currency: 'INR',
    isActive: true,
    isDefault: false,
  });
  const [rules, setRules] = useState<PricelistRule[]>([]);
  const [newRule, setNewRule] = useState({
    productId: '',
    minQuantity: 1,
    discountPercentage: 0,
  });
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pricelistToDelete, setPricelistToDelete] = useState<string | null>(null);

  const filteredPricelists = useMemo(() => {
    return pricelists.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase())
    );
  }, [pricelists, search]);

  const handleOpenDialog = useCallback((pricelist?: Pricelist) => {
    if (pricelist) {
      setEditingPricelist(pricelist);
      setFormData({
        name: pricelist.name,
        code: pricelist.code,
        currency: pricelist.currency,
        isActive: pricelist.isActive,
        isDefault: pricelist.isDefault,
      });
      setRules(pricelist.rules);
    } else {
      setEditingPricelist(null);
      setFormData({
        name: '',
        code: '',
        currency: 'INR',
        isActive: true,
        isDefault: false,
      });
      setRules([]);
    }
    setIsDialogOpen(true);
  }, []);

  const handleAddRule = useCallback(() => {
    if (newRule.minQuantity < 1 || newRule.discountPercentage < 0) {
      toast({ title: 'Invalid rule values', variant: 'destructive' });
      return;
    }

    const rule: PricelistRule = {
      id: crypto.randomUUID(),
      productId: newRule.productId || undefined,
      minQuantity: newRule.minQuantity,
      discountPercentage: newRule.discountPercentage,
    };

    setRules((prev) => [...prev, rule]);
    setNewRule({ productId: '', minQuantity: 1, discountPercentage: 0 });
  }, [newRule, toast]);

  const handleRemoveRule = useCallback((ruleId: string) => {
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
  }, []);

  const handleSave = useCallback(() => {
    if (!formData.name || !formData.code) {
      toast({ title: 'Please fill required fields', variant: 'destructive' });
      return;
    }

    const pricelistData: Pricelist = {
      id: editingPricelist?.id || crypto.randomUUID(),
      name: formData.name,
      code: formData.code,
      currency: formData.currency,
      isActive: formData.isActive,
      isDefault: formData.isDefault,
      rules,
      createdAt: editingPricelist?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    savePricelist(pricelistData);
    setPricelists(getPricelists());
    setIsDialogOpen(false);
    toast({ title: editingPricelist ? 'Pricelist updated' : 'Pricelist created' });
  }, [formData, rules, editingPricelist, toast]);

  const confirmDelete = useCallback(() => {
    if (pricelistToDelete) {
      try {
        deletePricelist(pricelistToDelete);
        setPricelists(getPricelists());
        toast({ title: 'Pricelist deleted' });
      } catch (error: any) {
        toast({ title: error.message, variant: 'destructive' });
      }
    }
    setDeleteDialogOpen(false);
    setPricelistToDelete(null);
  }, [pricelistToDelete, toast]);

  return (
    <AppLayout title="Sales" moduleNav={SALES_NAV}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Pricelists</h1>
            <p className="text-muted-foreground">Manage pricing rules and customer discounts</p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            New Pricelist
          </Button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder=""
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Pricelists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPricelists.map((pricelist, index) => (
            <Card
              key={pricelist.id}
              className={cn(
                'animate-slide-up cursor-pointer hover:ring-2 ring-primary/20 transition-all',
                !pricelist.isActive && 'opacity-60'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => handleOpenDialog(pricelist)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{pricelist.name}</CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenDialog(pricelist); }}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      {!pricelist.isDefault && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setPricelistToDelete(pricelist.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription>{pricelist.code} • {pricelist.currency}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-3">
                  {pricelist.isDefault && (
                    <Badge variant="secondary" className="gap-1">
                      <Check className="h-3 w-3" />
                      Default
                    </Badge>
                  )}
                  <Badge variant={pricelist.isActive ? 'default' : 'outline'}>
                    {pricelist.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {pricelist.rules.length} discount rule{pricelist.rules.length !== 1 ? 's' : ''}
                </div>
                {pricelist.rules.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {pricelist.rules.slice(0, 3).map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between text-xs bg-muted/50 rounded px-2 py-1">
                        <span>Min qty: {rule.minQuantity}+</span>
                        <Badge variant="outline" className="text-success">
                          -{rule.discountPercentage}%
                        </Badge>
                      </div>
                    ))}
                    {pricelist.rules.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{pricelist.rules.length - 3} more rules
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {filteredPricelists.length === 0 && (
            <Card className="col-span-full py-12">
              <CardContent className="text-center text-muted-foreground">
                <Tag className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No pricelists found</p>
                <Button variant="link" onClick={() => handleOpenDialog()}>
                  Create your first pricelist
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPricelist ? 'Edit Pricelist' : 'New Pricelist'}</DialogTitle>
            <DialogDescription>
              Configure pricing rules and discounts
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder=""
                />
              </div>
              <div className="grid gap-2">
                <Label>Code *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder=""
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(v) => setFormData({ ...formData, currency: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4 pt-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(v) => setFormData({ ...formData, isActive: v })}
                  />
                  <Label>Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isDefault}
                    onCheckedChange={(v) => setFormData({ ...formData, isDefault: v })}
                  />
                  <Label>Default</Label>
                </div>
              </div>
            </div>

            {/* Rules */}
            <div className="space-y-4">
              <Label>Discount Rules</Label>
              <div className="flex gap-2 p-3 bg-muted/50 rounded-lg">
                <Select
                  value={newRule.productId}
                  onValueChange={(v) => setNewRule({ ...newRule, productId: v })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="All products" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Products</SelectItem>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="1"
                  value={newRule.minQuantity}
                  onChange={(e) => setNewRule({ ...newRule, minQuantity: parseInt(e.target.value) || 1 })}
                  className="w-24"
                  placeholder=""
                />
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={newRule.discountPercentage}
                    onChange={(e) => setNewRule({ ...newRule, discountPercentage: parseFloat(e.target.value) || 0 })}
                    className="w-20"
                    placeholder=""
                  />
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </div>
                <Button size="icon" onClick={handleAddRule}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Rules Table */}
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
                    rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell>
                          {rule.productId
                            ? products.find((p) => p.id === rule.productId)?.name || 'Unknown'
                            : 'All Products'}
                        </TableCell>
                        <TableCell className="text-right">{rule.minQuantity}+</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="text-success">
                            -{rule.discountPercentage}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveRule(rule.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>
              {editingPricelist ? 'Update' : 'Create'} Pricelist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pricelist?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Default pricelists cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
