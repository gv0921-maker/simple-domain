import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DialogTrigger,
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
  Plus,
  Trash2,
  Package,
  Settings,
  Tag,
  ArrowLeftRight,
  AlertTriangle,
  MoreHorizontal,
  Pencil,
} from 'lucide-react';
import { INVENTORY_NAV } from '@/lib/navigation';
import { getItem, setItem } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  parentId?: string;
  productCount: number;
}

interface OperationType {
  id: string;
  name: string;
  code: string;
  type: 'incoming' | 'outgoing' | 'internal';
  warehouseId: string;
  sequence: number;
  isActive: boolean;
}

interface ReorderRule {
  id: string;
  productId: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  minQty: number;
  maxQty: number;
  triggerQty: number;
  isActive: boolean;
}

const DEFAULT_CATEGORIES: Category[] = [];

const DEFAULT_OPERATION_TYPES: OperationType[] = [
  { id: '1', name: 'Receipts', code: 'IN', type: 'incoming', warehouseId: '1', sequence: 1, isActive: true },
  { id: '2', name: 'Delivery Orders', code: 'OUT', type: 'outgoing', warehouseId: '1', sequence: 2, isActive: true },
  { id: '3', name: 'Internal Transfers', code: 'INT', type: 'internal', warehouseId: '1', sequence: 3, isActive: true },
  { id: '4', name: 'Returns', code: 'RET', type: 'incoming', warehouseId: '1', sequence: 4, isActive: true },
];

const DEFAULT_REORDER_RULES: ReorderRule[] = [
];

export default function InventoryConfiguration() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>(
    getItem('inventory_categories', DEFAULT_CATEGORIES)
  );
  const [operationTypes, setOperationTypes] = useState<OperationType[]>(
    getItem('operation_types', DEFAULT_OPERATION_TYPES)
  );
  const [reorderRules, setReorderRules] = useState<ReorderRule[]>(
    getItem('reorder_rules', DEFAULT_REORDER_RULES)
  );

  // Settings state
  const [settings, setSettings] = useState({
    enableLotTracking: true,
    enableSerialTracking: true,
    enableBarcodeScanning: true,
    defaultUom: 'Units',
    costingMethod: 'fifo',
    autoReserve: true,
    multiWarehouse: true,
  });

  // Dialog states
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [isOperationDialogOpen, setIsOperationDialogOpen] = useState(false);
  const [editingOperation, setEditingOperation] = useState<OperationType | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [newRule, setNewRule] = useState({
    productId: '',
    productName: '',
    minQty: '',
    maxQty: '',
    triggerQty: '',
  });
  const [operationForm, setOperationForm] = useState({
    name: '',
    code: '',
    type: 'internal' as OperationType['type'],
    sequence: 1,
    isActive: true,
  });

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    const category: Category = {
      id: crypto.randomUUID(),
      name: newCategory,
      productCount: 0,
    };
    const updated = [...categories, category];
    setCategories(updated);
    setItem('inventory_categories', updated);
    setNewCategory('');
    setIsCategoryDialogOpen(false);
    toast({ title: 'Category Added', description: `${newCategory} has been created.` });
  };

  const handleDeleteCategory = (id: string) => {
    const updated = categories.filter((c) => c.id !== id);
    setCategories(updated);
    setItem('inventory_categories', updated);
    toast({ title: 'Category Deleted' });
  };

  const handleToggleOperationType = (id: string, isActive: boolean) => {
    const updated = operationTypes.map((op) =>
      op.id === id ? { ...op, isActive } : op
    );
    setOperationTypes(updated);
    setItem('operation_types', updated);
  };

  const handleOpenOperationDialog = (op?: OperationType) => {
    if (op) {
      setEditingOperation(op);
      setOperationForm({
        name: op.name,
        code: op.code,
        type: op.type,
        sequence: op.sequence,
        isActive: op.isActive,
      });
    } else {
      setEditingOperation(null);
      setOperationForm({
        name: '',
        code: '',
        type: 'internal',
        sequence: operationTypes.length + 1,
        isActive: true,
      });
    }
    setIsOperationDialogOpen(true);
  };

  const handleSaveOperation = () => {
    if (!operationForm.name || !operationForm.code) {
      toast({ title: 'Name and code are required', variant: 'destructive' });
      return;
    }

    const opData: OperationType = {
      id: editingOperation?.id || crypto.randomUUID(),
      name: operationForm.name,
      code: operationForm.code,
      type: operationForm.type,
      warehouseId: '1',
      sequence: operationForm.sequence,
      isActive: operationForm.isActive,
    };

    let updated: OperationType[];
    if (editingOperation) {
      updated = operationTypes.map((o) => (o.id === editingOperation.id ? opData : o));
    } else {
      updated = [...operationTypes, opData];
    }

    setOperationTypes(updated);
    setItem('operation_types', updated);
    setIsOperationDialogOpen(false);
    toast({
      title: editingOperation ? 'Operation Type Updated' : 'Operation Type Created',
      description: `${operationForm.name} has been saved.`,
    });
  };

  const handleDeleteOperation = (id: string) => {
    const updated = operationTypes.filter((o) => o.id !== id);
    setOperationTypes(updated);
    setItem('operation_types', updated);
    toast({ title: 'Operation Type Deleted' });
  };

  const handleAddRule = () => {
    if (!newRule.productName || !newRule.minQty || !newRule.maxQty) {
      toast({ title: 'Validation Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    const rule: ReorderRule = {
      id: crypto.randomUUID(),
      productId: crypto.randomUUID(),
      productName: newRule.productName,
      warehouseId: '1',
      warehouseName: 'Main Warehouse',
      minQty: parseInt(newRule.minQty),
      maxQty: parseInt(newRule.maxQty),
      triggerQty: parseInt(newRule.triggerQty) || parseInt(newRule.minQty),
      isActive: true,
    };
    const updated = [...reorderRules, rule];
    setReorderRules(updated);
    setItem('reorder_rules', updated);
    setNewRule({ productId: '', productName: '', minQty: '', maxQty: '', triggerQty: '' });
    setIsRuleDialogOpen(false);
    toast({ title: 'Reorder Rule Created', description: `Rule for ${rule.productName} has been created.` });
  };

  const handleToggleRule = (id: string, isActive: boolean) => {
    const updated = reorderRules.map((r) =>
      r.id === id ? { ...r, isActive } : r
    );
    setReorderRules(updated);
    setItem('reorder_rules', updated);
  };

  return (
    <AppLayout title="Inventory" moduleNav={INVENTORY_NAV}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Inventory Configuration</h1>
          <p className="text-muted-foreground">Manage categories, operation types, and reorder rules</p>
        </div>

        <Tabs defaultValue="categories" className="space-y-6">
          <TabsList>
            <TabsTrigger value="categories" className="gap-2">
              <Tag className="h-4 w-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="operations" className="gap-2">
              <ArrowLeftRight className="h-4 w-4" />
              Operation Types
            </TabsTrigger>
            <TabsTrigger value="reorder" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Reorder Rules
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Product Categories</h2>
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>New Category</DialogTitle>
                    <DialogDescription>Create a new product category</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Category Name</Label>
                      <Input
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder=""
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddCategory}>Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((category, index) => (
                <Card key={category.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" />
                      <CardTitle className="text-sm font-medium">{category.name}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{category.productCount}</p>
                    <p className="text-sm text-muted-foreground">Products</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Operation Types Tab */}
          <TabsContent value="operations" className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Operation Types</h2>
              <Dialog open={isOperationDialogOpen} onOpenChange={setIsOperationDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2" onClick={() => handleOpenOperationDialog()}>
                    <Plus className="h-4 w-4" />
                    Add Operation Type
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingOperation ? 'Edit Operation Type' : 'New Operation Type'}</DialogTitle>
                    <DialogDescription>
                      {editingOperation ? 'Update the operation type details' : 'Create a new operation type'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Name *</Label>
                      <Input
                        value={operationForm.name}
                        onChange={(e) => setOperationForm({ ...operationForm, name: e.target.value })}
                        placeholder=""
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Code *</Label>
                      <Input
                        value={operationForm.code}
                        onChange={(e) => setOperationForm({ ...operationForm, code: e.target.value.toUpperCase() })}
                        placeholder=""
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Type</Label>
                      <Select
                        value={operationForm.type}
                        onValueChange={(v) => setOperationForm({ ...operationForm, type: v as OperationType['type'] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="incoming">Incoming</SelectItem>
                          <SelectItem value="outgoing">Outgoing</SelectItem>
                          <SelectItem value="internal">Internal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Sequence</Label>
                      <Input
                        type="number"
                        value={operationForm.sequence}
                        onChange={(e) => setOperationForm({ ...operationForm, sequence: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Active</Label>
                      <Switch
                        checked={operationForm.isActive}
                        onCheckedChange={(checked) => setOperationForm({ ...operationForm, isActive: checked })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOperationDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveOperation}>{editingOperation ? 'Update' : 'Create'}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Sequence</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operationTypes.map((op) => (
                    <TableRow key={op.id}>
                      <TableCell className="font-medium">{op.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{op.code}</Badge>
                      </TableCell>
                      <TableCell className="capitalize">{op.type}</TableCell>
                      <TableCell>{op.sequence}</TableCell>
                      <TableCell>
                        <Switch
                          checked={op.isActive}
                          onCheckedChange={(checked) => handleToggleOperationType(op.id, checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenOperationDialog(op)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteOperation(op.id)} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Reorder Rules Tab */}
          <TabsContent value="reorder" className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Reorder Rules</h2>
              <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Rule
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>New Reorder Rule</DialogTitle>
                    <DialogDescription>Set automatic reorder thresholds for products</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Product Name</Label>
                      <Input
                        value={newRule.productName}
                        onChange={(e) => setNewRule({ ...newRule, productName: e.target.value })}
                        placeholder=""
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label>Min Qty</Label>
                        <Input
                          type="number"
                          value={newRule.minQty}
                          onChange={(e) => setNewRule({ ...newRule, minQty: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Max Qty</Label>
                        <Input
                          type="number"
                          value={newRule.maxQty}
                          onChange={(e) => setNewRule({ ...newRule, maxQty: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Trigger</Label>
                        <Input
                          type="number"
                          value={newRule.triggerQty}
                          onChange={(e) => setNewRule({ ...newRule, triggerQty: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsRuleDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddRule}>Create Rule</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead className="text-right">Min Qty</TableHead>
                    <TableHead className="text-right">Max Qty</TableHead>
                    <TableHead className="text-right">Trigger</TableHead>
                    <TableHead>Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reorderRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.productName}</TableCell>
                      <TableCell>{rule.warehouseName}</TableCell>
                      <TableCell className="text-right">{rule.minQty}</TableCell>
                      <TableCell className="text-right">{rule.maxQty}</TableCell>
                      <TableCell className="text-right">{rule.triggerQty}</TableCell>
                      <TableCell>
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-medium">Inventory Settings</h2>
            <div className="grid gap-6 max-w-2xl">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Traceability</CardTitle>
                  <CardDescription>Configure lot and serial number tracking</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Lot Tracking</Label>
                      <p className="text-sm text-muted-foreground">Track products by lot/batch numbers</p>
                    </div>
                    <Switch
                      checked={settings.enableLotTracking}
                      onCheckedChange={(checked) => setSettings({ ...settings, enableLotTracking: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Serial Number Tracking</Label>
                      <p className="text-sm text-muted-foreground">Track individual items by serial number</p>
                    </div>
                    <Switch
                      checked={settings.enableSerialTracking}
                      onCheckedChange={(checked) => setSettings({ ...settings, enableSerialTracking: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Operations</CardTitle>
                  <CardDescription>Configure inventory operations behavior</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Barcode Scanning</Label>
                      <p className="text-sm text-muted-foreground">Enable barcode scanning for operations</p>
                    </div>
                    <Switch
                      checked={settings.enableBarcodeScanning}
                      onCheckedChange={(checked) => setSettings({ ...settings, enableBarcodeScanning: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Multi-Warehouse</Label>
                      <p className="text-sm text-muted-foreground">Enable multiple warehouse locations</p>
                    </div>
                    <Switch
                      checked={settings.multiWarehouse}
                      onCheckedChange={(checked) => setSettings({ ...settings, multiWarehouse: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto Reserve Stock</Label>
                      <p className="text-sm text-muted-foreground">Automatically reserve stock for orders</p>
                    </div>
                    <Switch
                      checked={settings.autoReserve}
                      onCheckedChange={(checked) => setSettings({ ...settings, autoReserve: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Costing</CardTitle>
                  <CardDescription>Configure inventory valuation method</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label>Costing Method</Label>
                    <Select
                      value={settings.costingMethod}
                      onValueChange={(v) => setSettings({ ...settings, costingMethod: v })}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fifo">FIFO (First In, First Out)</SelectItem>
                        <SelectItem value="lifo">LIFO (Last In, First Out)</SelectItem>
                        <SelectItem value="average">Average Cost</SelectItem>
                        <SelectItem value="standard">Standard Cost</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Default Unit of Measure</Label>
                    <Select
                      value={settings.defaultUom}
                      onValueChange={(v) => setSettings({ ...settings, defaultUom: v })}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Units">Units</SelectItem>
                        <SelectItem value="Pieces">Pieces</SelectItem>
                        <SelectItem value="Kg">Kilograms</SelectItem>
                        <SelectItem value="Liters">Liters</SelectItem>
                        <SelectItem value="Meters">Meters</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
