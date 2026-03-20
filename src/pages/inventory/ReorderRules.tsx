import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Package,
  Bell,
} from 'lucide-react';
import { 
  getReorderRules, 
  saveReorderRule,
  deleteReorderRule,
  checkReorderRules,
  getProducts,
  getWarehouses,
} from '@/lib/data/inventory/storage';
import type { ReorderRule } from '@/lib/data/inventory/types';
import { INVENTORY_NAV } from '@/lib/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function ReorderRules() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rules, setRules] = useState<ReorderRule[]>(getReorderRules());
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ReorderRule | null>(null);
  
  const products = getProducts();
  const warehouses = getWarehouses();

  const [formData, setFormData] = useState({
    productId: '',
    warehouseId: '',
    minQty: 10,
    maxQty: 100,
    reorderQty: 50,
    leadTimeDays: 7,
    isActive: true,
  });

  const filteredRules = useMemo(() => {
    return rules.filter((rule) =>
      rule.productName.toLowerCase().includes(search.toLowerCase()) ||
      rule.warehouseName.toLowerCase().includes(search.toLowerCase())
    );
  }, [rules, search]);

  const triggeredRules = useMemo(() => checkReorderRules(), [rules]);

  const stats = useMemo(() => ({
    total: rules.length,
    active: rules.filter(r => r.isActive).length,
    triggered: triggeredRules.length,
  }), [rules, triggeredRules]);

  const handleOpenDialog = (rule?: ReorderRule) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        productId: rule.productId,
        warehouseId: rule.warehouseId,
        minQty: rule.minQty,
        maxQty: rule.maxQty,
        reorderQty: rule.reorderQty,
        leadTimeDays: rule.leadTimeDays,
        isActive: rule.isActive,
      });
    } else {
      setEditingRule(null);
      setFormData({
        productId: '',
        warehouseId: warehouses[0]?.id || '',
        minQty: 10,
        maxQty: 100,
        reorderQty: 50,
        leadTimeDays: 7,
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    const product = products.find(p => p.id === formData.productId);
    const warehouse = warehouses.find(w => w.id === formData.warehouseId);
    
    if (!product || !warehouse) {
      toast({ title: 'Please select product and warehouse', variant: 'destructive' });
      return;
    }

    const rule: ReorderRule = {
      id: editingRule?.id || '',
      productId: formData.productId,
      productName: product.name,
      warehouseId: formData.warehouseId,
      warehouseName: warehouse.name,
      minQty: formData.minQty,
      maxQty: formData.maxQty,
      reorderQty: formData.reorderQty,
      leadTimeDays: formData.leadTimeDays,
      isActive: formData.isActive,
      lastTriggered: editingRule?.lastTriggered,
      createdAt: editingRule?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveReorderRule(rule);
    setRules(getReorderRules());
    setIsDialogOpen(false);
    toast({
      title: editingRule ? 'Rule Updated' : 'Rule Created',
      description: `Reorder rule for ${product.name} has been saved.`,
    });
  };

  const handleDelete = (id: string) => {
    deleteReorderRule(id);
    setRules(getReorderRules());
    toast({ title: 'Rule Deleted' });
  };

  const handleRunCheck = () => {
    const triggered = checkReorderRules();
    if (triggered.length > 0) {
      toast({
        title: 'Low Stock Alert',
        description: `${triggered.length} products need replenishment.`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Stock Levels OK',
        description: 'All products are above minimum levels.',
      });
    }
  };

  return (
    <AppLayout title="Inventory" moduleNav={INVENTORY_NAV}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Reorder Rules</h1>
            <p className="text-muted-foreground">Configure automatic stock replenishment triggers</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleRunCheck} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Check Now
            </Button>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              New Rule
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="animate-slide-up">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '50ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.active}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Triggered Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold",
                stats.triggered > 0 ? "text-destructive" : "text-muted-foreground"
              )}>
                {stats.triggered}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Triggered Alerts */}
        {triggeredRules.length > 0 && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {triggeredRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                    <div>
                      <p className="font-medium">{rule.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        {rule.warehouseName} • Reorder: {rule.reorderQty} units
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      Create Order
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder=""
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Min Qty</TableHead>
                <TableHead>Max Qty</TableHead>
                <TableHead>Reorder Qty</TableHead>
                <TableHead>Lead Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No reorder rules found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRules.map((rule, index) => {
                  const isTriggered = triggeredRules.some(t => t.id === rule.id);
                  return (
                    <TableRow
                      key={rule.id}
                      className={cn(
                        "animate-fade-in",
                        isTriggered && "bg-destructive/5"
                      )}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {isTriggered && <AlertTriangle className="h-4 w-4 text-destructive" />}
                          {rule.productName}
                        </div>
                      </TableCell>
                      <TableCell>{rule.warehouseName}</TableCell>
                      <TableCell>{rule.minQty}</TableCell>
                      <TableCell>{rule.maxQty}</TableCell>
                      <TableCell>{rule.reorderQty}</TableCell>
                      <TableCell>{rule.leadTimeDays} days</TableCell>
                      <TableCell>
                        <Badge className={cn(
                          rule.isActive
                            ? 'bg-success/20 text-success border-success'
                            : 'bg-muted text-muted-foreground'
                        )}>
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDialog(rule)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(rule.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingRule ? 'Edit Reorder Rule' : 'New Reorder Rule'}</DialogTitle>
              <DialogDescription>
                Configure automatic stock replenishment for a product
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Product</Label>
                <Select value={formData.productId} onValueChange={(v) => setFormData({ ...formData, productId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.filter(p => p.trackInventory).map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Warehouse</Label>
                <Select value={formData.warehouseId} onValueChange={(v) => setFormData({ ...formData, warehouseId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((wh) => (
                      <SelectItem key={wh.id} value={wh.id}>
                        {wh.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Min Quantity</Label>
                  <Input
                    type="number"
                    value={formData.minQty}
                    onChange={(e) => setFormData({ ...formData, minQty: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Max Quantity</Label>
                  <Input
                    type="number"
                    value={formData.maxQty}
                    onChange={(e) => setFormData({ ...formData, maxQty: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Reorder Quantity</Label>
                  <Input
                    type="number"
                    value={formData.reorderQty}
                    onChange={(e) => setFormData({ ...formData, reorderQty: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Lead Time (days)</Label>
                  <Input
                    type="number"
                    value={formData.leadTimeDays}
                    onChange={(e) => setFormData({ ...formData, leadTimeDays: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editingRule ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
