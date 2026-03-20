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
} from '@/components/ui/dialog';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  MapPin,
  ArrowRight,
  FolderTree,
  Route,
} from 'lucide-react';
import { getWarehouses, type Warehouse } from '@/lib/data/inventory';
import { getItem, setItem } from '@/lib/storage';
import { INVENTORY_NAV } from '@/lib/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Location {
  id: string;
  name: string;
  code: string;
  warehouseId: string;
  parentId?: string;
  type: 'internal' | 'customer' | 'supplier' | 'inventory' | 'transit' | 'production';
  isActive: boolean;
}

interface WarehouseRoute {
  id: string;
  name: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  operationType: string;
  isActive: boolean;
}

const DEFAULT_LOCATIONS: Location[] = [];

const DEFAULT_ROUTES: WarehouseRoute[] = [];

const LOCATION_TYPES = [
  { value: 'internal', label: 'Internal Location' },
  { value: 'customer', label: 'Customer Location' },
  { value: 'supplier', label: 'Supplier Location' },
  { value: 'inventory', label: 'Inventory Loss' },
  { value: 'transit', label: 'Transit Location' },
  { value: 'production', label: 'Production' },
];

export default function WarehouseLocations() {
  const { toast } = useToast();
  const [warehouses] = useState(getWarehouses());
  const [locations, setLocations] = useState<Location[]>(
    getItem('warehouse_locations', DEFAULT_LOCATIONS)
  );
  const [routes, setRoutes] = useState<WarehouseRoute[]>(
    getItem('warehouse_routes', DEFAULT_ROUTES)
  );
  const [search, setSearch] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');

  // Location dialog
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationForm, setLocationForm] = useState({
    name: '',
    code: '',
    warehouseId: '',
    parentId: '',
    type: 'internal' as Location['type'],
    isActive: true,
  });

  // Route dialog
  const [isRouteDialogOpen, setIsRouteDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<WarehouseRoute | null>(null);
  const [routeForm, setRouteForm] = useState({
    name: '',
    sourceWarehouseId: '',
    destinationWarehouseId: '',
    operationType: 'Internal Transfer',
    isActive: true,
  });

  const filteredLocations = locations.filter((loc) => {
    const matchesSearch =
      loc.name.toLowerCase().includes(search.toLowerCase()) ||
      loc.code.toLowerCase().includes(search.toLowerCase());
    const matchesWarehouse = selectedWarehouse === 'all' || loc.warehouseId === selectedWarehouse;
    return matchesSearch && matchesWarehouse;
  });

  const getWarehouseName = (id: string) => {
    return warehouses.find((w) => w.id === id)?.name || 'External';
  };

  const getParentLocationName = (parentId?: string) => {
    if (!parentId) return '—';
    return locations.find((l) => l.id === parentId)?.name || '—';
  };

  // Location handlers
  const handleOpenLocationDialog = (location?: Location) => {
    if (location) {
      setEditingLocation(location);
      setLocationForm({
        name: location.name,
        code: location.code,
        warehouseId: location.warehouseId,
        parentId: location.parentId || '',
        type: location.type,
        isActive: location.isActive,
      });
    } else {
      setEditingLocation(null);
      setLocationForm({
        name: '',
        code: '',
        warehouseId: warehouses[0]?.id || '',
        parentId: '',
        type: 'internal',
        isActive: true,
      });
    }
    setIsLocationDialogOpen(true);
  };

  const handleSaveLocation = () => {
    if (!locationForm.name || !locationForm.code || !locationForm.warehouseId) {
      toast({ title: 'Name, code and warehouse are required', variant: 'destructive' });
      return;
    }

    const locationData: Location = {
      id: editingLocation?.id || crypto.randomUUID(),
      name: locationForm.name,
      code: locationForm.code,
      warehouseId: locationForm.warehouseId,
      parentId: locationForm.parentId || undefined,
      type: locationForm.type,
      isActive: locationForm.isActive,
    };

    let updated: Location[];
    if (editingLocation) {
      updated = locations.map((l) => (l.id === editingLocation.id ? locationData : l));
    } else {
      updated = [...locations, locationData];
    }

    setLocations(updated);
    setItem('warehouse_locations', updated);
    setIsLocationDialogOpen(false);
    toast({
      title: editingLocation ? 'Location Updated' : 'Location Created',
      description: `${locationForm.name} has been saved.`,
    });
  };

  const handleDeleteLocation = (id: string) => {
    const updated = locations.filter((l) => l.id !== id);
    setLocations(updated);
    setItem('warehouse_locations', updated);
    toast({ title: 'Location Deleted' });
  };

  // Route handlers
  const handleOpenRouteDialog = (route?: WarehouseRoute) => {
    if (route) {
      setEditingRoute(route);
      setRouteForm({
        name: route.name,
        sourceWarehouseId: route.sourceWarehouseId,
        destinationWarehouseId: route.destinationWarehouseId,
        operationType: route.operationType,
        isActive: route.isActive,
      });
    } else {
      setEditingRoute(null);
      setRouteForm({
        name: '',
        sourceWarehouseId: '',
        destinationWarehouseId: '',
        operationType: 'Internal Transfer',
        isActive: true,
      });
    }
    setIsRouteDialogOpen(true);
  };

  const handleSaveRoute = () => {
    if (!routeForm.name || !routeForm.destinationWarehouseId) {
      toast({ title: 'Name and destination are required', variant: 'destructive' });
      return;
    }

    const routeData: WarehouseRoute = {
      id: editingRoute?.id || crypto.randomUUID(),
      name: routeForm.name,
      sourceWarehouseId: routeForm.sourceWarehouseId,
      destinationWarehouseId: routeForm.destinationWarehouseId,
      operationType: routeForm.operationType,
      isActive: routeForm.isActive,
    };

    let updated: WarehouseRoute[];
    if (editingRoute) {
      updated = routes.map((r) => (r.id === editingRoute.id ? routeData : r));
    } else {
      updated = [...routes, routeData];
    }

    setRoutes(updated);
    setItem('warehouse_routes', updated);
    setIsRouteDialogOpen(false);
    toast({
      title: editingRoute ? 'Route Updated' : 'Route Created',
      description: `${routeForm.name} has been saved.`,
    });
  };

  const handleDeleteRoute = (id: string) => {
    const updated = routes.filter((r) => r.id !== id);
    setRoutes(updated);
    setItem('warehouse_routes', updated);
    toast({ title: 'Route Deleted' });
  };

  const handleToggleRoute = (id: string, isActive: boolean) => {
    const updated = routes.map((r) => (r.id === id ? { ...r, isActive } : r));
    setRoutes(updated);
    setItem('warehouse_routes', updated);
  };

  return (
    <AppLayout title="Inventory" moduleNav={INVENTORY_NAV}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Warehouse Locations & Routes</h1>
          <p className="text-muted-foreground">Manage sub-locations and transfer routes</p>
        </div>

        <Tabs defaultValue="locations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="locations" className="gap-2">
              <FolderTree className="h-4 w-4" />
              Locations
            </TabsTrigger>
            <TabsTrigger value="routes" className="gap-2">
              <Route className="h-4 w-4" />
              Routes
            </TabsTrigger>
          </TabsList>

          {/* Locations Tab */}
          <TabsContent value="locations" className="space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search locations..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Warehouses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Warehouses</SelectItem>
                    {warehouses.map((wh) => (
                      <SelectItem key={wh.id} value={wh.id}>
                        {wh.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => handleOpenLocationDialog()} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Location
              </Button>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLocations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {location.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{location.code}</TableCell>
                      <TableCell>{getWarehouseName(location.warehouseId)}</TableCell>
                      <TableCell>{getParentLocationName(location.parentId)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {location.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            location.isActive
                              ? 'bg-success/20 text-success border-success'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {location.isActive ? 'Active' : 'Inactive'}
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
                            <DropdownMenuItem onClick={() => handleOpenLocationDialog(location)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteLocation(location.id)}
                              className="text-destructive"
                            >
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

          {/* Routes Tab */}
          <TabsContent value="routes" className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Transfer Routes</h2>
              <Button onClick={() => handleOpenRouteDialog()} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Route
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {routes.map((route, index) => (
                <Card
                  key={route.id}
                  className={cn(
                    'animate-slide-up',
                    !route.isActive && 'opacity-60'
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{route.name}</CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenRouteDialog(route)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteRoute(route.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">
                        {route.sourceWarehouseId
                          ? getWarehouseName(route.sourceWarehouseId)
                          : 'External'}
                      </span>
                      <ArrowRight className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {getWarehouseName(route.destinationWarehouseId)}
                      </span>
                    </div>
                    <Badge variant="outline">{route.operationType}</Badge>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <Label className="text-sm">Active</Label>
                      <Switch
                        checked={route.isActive}
                        onCheckedChange={(checked) => handleToggleRoute(route.id, checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Location Dialog */}
        <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingLocation ? 'Edit Location' : 'New Location'}</DialogTitle>
              <DialogDescription>
                {editingLocation ? 'Update location details' : 'Create a new warehouse sub-location'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Location Name *</Label>
                <Input
                  value={locationForm.name}
                  onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                  placeholder="e.g., Zone A"
                />
              </div>
              <div className="grid gap-2">
                <Label>Code *</Label>
                <Input
                  value={locationForm.code}
                  onChange={(e) => setLocationForm({ ...locationForm, code: e.target.value })}
                  placeholder="e.g., GLF/Stock/Zone-A"
                />
              </div>
              <div className="grid gap-2">
                <Label>Warehouse *</Label>
                <Select
                  value={locationForm.warehouseId}
                  onValueChange={(v) => setLocationForm({ ...locationForm, warehouseId: v })}
                >
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
              <div className="grid gap-2">
                <Label>Parent Location</Label>
                <Select
                  value={locationForm.parentId}
                  onValueChange={(v) => setLocationForm({ ...locationForm, parentId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None (root location)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None (root location)</SelectItem>
                    {locations
                      .filter((l) => l.warehouseId === locationForm.warehouseId)
                      .map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select
                  value={locationForm.type}
                  onValueChange={(v) =>
                    setLocationForm({ ...locationForm, type: v as Location['type'] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATION_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={locationForm.isActive}
                  onCheckedChange={(checked) =>
                    setLocationForm({ ...locationForm, isActive: checked })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsLocationDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveLocation}>
                {editingLocation ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Route Dialog */}
        <Dialog open={isRouteDialogOpen} onOpenChange={setIsRouteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRoute ? 'Edit Route' : 'New Route'}</DialogTitle>
              <DialogDescription>
                {editingRoute ? 'Update route configuration' : 'Create a transfer route between warehouses'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Route Name *</Label>
                <Input
                  value={routeForm.name}
                  onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })}
                  placeholder="e.g., Supplier to Main"
                />
              </div>
              <div className="grid gap-2">
                <Label>Source Warehouse</Label>
                <Select
                  value={routeForm.sourceWarehouseId}
                  onValueChange={(v) => setRouteForm({ ...routeForm, sourceWarehouseId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="External (Supplier)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">External (Supplier)</SelectItem>
                    {warehouses.map((wh) => (
                      <SelectItem key={wh.id} value={wh.id}>
                        {wh.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Destination Warehouse *</Label>
                <Select
                  value={routeForm.destinationWarehouseId}
                  onValueChange={(v) => setRouteForm({ ...routeForm, destinationWarehouseId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination" />
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
              <div className="grid gap-2">
                <Label>Operation Type</Label>
                <Select
                  value={routeForm.operationType}
                  onValueChange={(v) => setRouteForm({ ...routeForm, operationType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Receipt">Receipt</SelectItem>
                    <SelectItem value="Delivery">Delivery</SelectItem>
                    <SelectItem value="Internal Transfer">Internal Transfer</SelectItem>
                    <SelectItem value="Return">Return</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={routeForm.isActive}
                  onCheckedChange={(checked) => setRouteForm({ ...routeForm, isActive: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRouteDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveRoute}>{editingRoute ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
