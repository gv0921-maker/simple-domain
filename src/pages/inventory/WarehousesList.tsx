import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
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
  Warehouse,
  MapPin,
  Package,
} from 'lucide-react';
import { getWarehouses, saveWarehouse, deleteWarehouse, type Warehouse as WarehouseType } from '@/lib/data/inventory';
import { INVENTORY_NAV } from '@/lib/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface WarehouseFormData {
  name: string;
  code: string;
  address: string;
  isActive: boolean;
}

const initialFormData: WarehouseFormData = {
  name: '',
  code: '',
  address: '',
  isActive: true,
};

export default function WarehousesList() {
  const { toast } = useToast();
  const [warehouses, setWarehouses] = useState<WarehouseType[]>(getWarehouses());
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseType | null>(null);
  const [formData, setFormData] = useState<WarehouseFormData>(initialFormData);

  const filteredWarehouses = warehouses.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenDialog = (warehouse?: WarehouseType) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setFormData({
        name: warehouse.name,
        code: warehouse.code,
        address: warehouse.address || '',
        isActive: warehouse.isActive,
      });
    } else {
      setEditingWarehouse(null);
      setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.code) {
      toast({
        title: 'Validation Error',
        description: 'Name and code are required',
        variant: 'destructive',
      });
      return;
    }

    const warehouseData: WarehouseType = {
      id: editingWarehouse?.id || '',
      name: formData.name,
      code: formData.code,
      address: formData.address,
      isActive: formData.isActive,
    };

    saveWarehouse(warehouseData);
    setWarehouses(getWarehouses());
    setIsDialogOpen(false);
    toast({
      title: editingWarehouse ? 'Warehouse Updated' : 'Warehouse Created',
      description: `${formData.name} has been ${editingWarehouse ? 'updated' : 'created'} successfully.`,
    });
  };

  const handleDelete = (id: string) => {
    deleteWarehouse(id);
    setWarehouses(getWarehouses());
    toast({ title: 'Warehouse Deleted' });
  };

  return (
    <AppLayout title="Inventory" moduleNav={INVENTORY_NAV}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Warehouses</h1>
            <p className="text-muted-foreground">Manage your warehouse locations and stock areas</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Warehouse
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingWarehouse ? 'Edit Warehouse' : 'New Warehouse'}</DialogTitle>
                <DialogDescription>
                  {editingWarehouse
                    ? 'Update the warehouse details below.'
                    : 'Create a new warehouse location.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder=""
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder=""
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder=""
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive">Active</Label>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  {editingWarehouse ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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

        {/* Warehouse Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWarehouses.map((warehouse, index) => (
            <Card
              key={warehouse.id}
              className={cn(
                'animate-slide-up transition-all duration-200 hover:shadow-md',
                !warehouse.isActive && 'opacity-60'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Warehouse className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{warehouse.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{warehouse.code}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleOpenDialog(warehouse)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(warehouse.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {warehouse.address && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{warehouse.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span>3 Locations</span>
                  </div>
                  <Badge
                    className={cn(
                      warehouse.isActive
                        ? 'bg-success/20 text-success border-success'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {warehouse.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredWarehouses.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Warehouse className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No warehouses found</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
