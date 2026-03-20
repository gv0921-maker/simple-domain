import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  ArrowLeft,
  Save,
  Trash2,
  Package,
  Barcode,
  DollarSign,
  Layers,
  History,
  Plus,
} from 'lucide-react';
import { getProduct, saveProduct, deleteProduct, type Product, type ProductVariant } from '@/lib/data/inventory';
import { INVENTORY_NAV } from '@/lib/navigation';
import { useToast } from '@/hooks/use-toast';
import { useStudioConfig } from '@/hooks/useStudioConfig';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const CATEGORIES = ['Furniture', 'Accessories', 'Lighting', 'Electronics', 'Office Supplies'];
const UNITS = ['Units', 'Pieces', 'Kg', 'Liters', 'Meters', 'Boxes'];

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = id === 'new';
  const studio = useStudioConfig('inventory', 'Product');

  const [product, setProduct] = useState<Product>({
    id: '',
    sku: '',
    name: '',
    type: 'stockable',
    category: 'Furniture',
    unitOfMeasure: 'Units',
    costMethod: 'average',
    costPrice: 0,
    salePrice: 0,
    stockOnHand: 0,
    reorderLevel: 10,
    barcode: '',
    trackInventory: true,
    trackLots: false,
    trackSerials: false,
    variants: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [newVariant, setNewVariant] = useState({ name: '', sku: '', additionalPrice: 0 });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!isNew && id) {
      const existingProduct = getProduct(id);
      if (existingProduct) {
        setProduct(existingProduct);
        setVariants(existingProduct.variants || []);
      } else {
        navigate('/inventory/products');
      }
    }
  }, [id, isNew, navigate]);

  const handleChange = (field: keyof Product, value: any) => {
    setProduct((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleAddVariant = () => {
    if (!newVariant.name || !newVariant.sku) {
      toast({
        title: 'Validation Error',
        description: 'Variant name and SKU are required',
        variant: 'destructive',
      });
      return;
    }
    const variant: ProductVariant = {
      id: crypto.randomUUID(),
      name: newVariant.name,
      sku: newVariant.sku,
      additionalPrice: newVariant.additionalPrice,
      stockOnHand: 0,
      attributes: {},
    };
    setVariants((prev) => [...prev, variant]);
    setNewVariant({ name: '', sku: '', additionalPrice: 0 });
    setHasChanges(true);
  };

  const handleRemoveVariant = (variantId: string) => {
    setVariants((prev) => prev.filter((v) => v.id !== variantId));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!product.name || !product.sku) {
      toast({
        title: 'Validation Error',
        description: 'Name and SKU are required',
        variant: 'destructive',
      });
      return;
    }

    const productToSave = {
      ...product,
      variants,
    };

    saveProduct(productToSave);
    setHasChanges(false);
    toast({
      title: isNew ? 'Product Created' : 'Product Updated',
      description: `${product.name} has been saved successfully.`,
    });

    if (isNew) {
      navigate('/inventory/products');
    }
  };

  const stockStatus =
    product.stockOnHand === 0
      ? 'out'
      : product.stockOnHand <= product.reorderLevel
      ? 'low'
      : 'healthy';

  return (
    <AppLayout title="Inventory" moduleNav={INVENTORY_NAV}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/inventory/products')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                {isNew ? 'New Product' : product.name}
              </h1>
              {!isNew && <p className="text-muted-foreground">SKU: {product.sku}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="outline" className="text-warning border-warning">
                Unsaved Changes
              </Badge>
            )}
            {!isNew && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="gap-2 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Product?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete "{product.name}" and all its variants.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => {
                        deleteProduct(product.id);
                        toast({ title: 'Product Deleted', description: `${product.name} has been removed.` });
                        navigate('/inventory/products');
                      }}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              {isNew ? 'Create Product' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Stock Status Cards */}
        {!isNew && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="animate-slide-up">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Stock on Hand
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{product.stockOnHand}</span>
                  <Badge
                    className={cn(
                      stockStatus === 'out'
                        ? 'bg-destructive/20 text-destructive'
                        : stockStatus === 'low'
                        ? 'bg-warning/20 text-warning-foreground'
                        : 'bg-success/20 text-success'
                    )}
                  >
                    {stockStatus === 'out'
                      ? 'Out of Stock'
                      : stockStatus === 'low'
                      ? 'Low Stock'
                      : 'In Stock'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <Card className="animate-slide-up" style={{ animationDelay: '50ms' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Stock Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{(product.stockOnHand * product.costPrice).toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Variants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{variants.length}</div>
              </CardContent>
            </Card>
            <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Last Updated
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {new Date(product.updatedAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">General Information</TabsTrigger>
            <TabsTrigger value="pricing">Pricing & Inventory</TabsTrigger>
            <TabsTrigger value="variants">Variants</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {studio.isFieldVisible('name') && (
                    <div className="grid gap-2">
                      <Label htmlFor="name">{studio.getFieldLabel('name', 'Product Name')} {studio.isFieldRequired('name', true) && '*'}</Label>
                      <Input
                        id="name"
                        value={product.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder={studio.getFieldPlaceholder('name', 'Enter product name')}
                        readOnly={studio.isFieldReadOnly('name')}
                      />
                    </div>
                  )}
                  {studio.isFieldVisible('sku') && (
                    <div className="grid gap-2">
                      <Label htmlFor="sku">{studio.getFieldLabel('sku', 'SKU')} *</Label>
                      <Input
                        id="sku"
                        value={product.sku}
                        onChange={(e) => handleChange('sku', e.target.value)}
                        placeholder={studio.getFieldPlaceholder('sku', 'e.g., PROD-001')}
                        readOnly={studio.isFieldReadOnly('sku')}
                      />
                    </div>
                  )}
                  {studio.isFieldVisible('category') && (
                    <div className="grid gap-2">
                      <Label htmlFor="category">{studio.getFieldLabel('category', 'Category')}</Label>
                      <Select
                        value={product.category}
                        onValueChange={(v) => handleChange('category', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="uom">Unit of Measure</Label>
                    <Select
                      value={product.unitOfMeasure}
                      onValueChange={(v) => handleChange('unitOfMeasure', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="barcode">
                      <div className="flex items-center gap-2">
                        <Barcode className="h-4 w-4" />
                        Barcode
                      </div>
                    </Label>
                    <Input
                      id="barcode"
                      value={product.barcode || ''}
                      onChange={(e) => handleChange('barcode', e.target.value)}
                      placeholder=""
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="costPrice">Cost Price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                      <Input
                        id="costPrice"
                        type="number"
                        value={product.costPrice}
                        onChange={(e) => handleChange('costPrice', parseFloat(e.target.value) || 0)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="salePrice">Sale Price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                      <Input
                        id="salePrice"
                        type="number"
                        value={product.salePrice}
                        onChange={(e) => handleChange('salePrice', parseFloat(e.target.value) || 0)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                </div>
                {product.salePrice > product.costPrice && (
                  <div className="p-3 bg-success/10 rounded-lg">
                    <p className="text-sm text-success">
                      Margin: ₹{(product.salePrice - product.costPrice).toLocaleString()} (
                      {(((product.salePrice - product.costPrice) / product.costPrice) * 100).toFixed(1)}%)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inventory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="stockOnHand">Stock on Hand</Label>
                    <Input
                      id="stockOnHand"
                      type="number"
                      value={product.stockOnHand}
                      onChange={(e) => handleChange('stockOnHand', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="reorderLevel">Reorder Level</Label>
                    <Input
                      id="reorderLevel"
                      type="number"
                      value={product.reorderLevel}
                      onChange={(e) => handleChange('reorderLevel', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Variants Tab */}
          <TabsContent value="variants" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Product Variants</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="grid gap-2">
                    <Label>Variant Name</Label>
                    <Input
                      value={newVariant.name}
                      onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                      placeholder=""
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Variant SKU</Label>
                    <Input
                      value={newVariant.sku}
                      onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
                      placeholder=""
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Additional Price</Label>
                    <Input
                      type="number"
                      value={newVariant.additionalPrice}
                      onChange={(e) =>
                        setNewVariant({ ...newVariant, additionalPrice: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleAddVariant} className="gap-2 w-full">
                      <Plus className="h-4 w-4" />
                      Add Variant
                    </Button>
                  </div>
                </div>

                {variants.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Variant Name</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">Additional Price</TableHead>
                        <TableHead className="text-right">Total Price</TableHead>
                        <TableHead className="text-right">Stock</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {variants.map((variant) => (
                        <TableRow key={variant.id}>
                          <TableCell className="font-medium">{variant.name}</TableCell>
                          <TableCell className="text-muted-foreground">{variant.sku}</TableCell>
                          <TableCell className="text-right">
                            +₹{variant.additionalPrice.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{(product.salePrice + variant.additionalPrice).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">{variant.stockOnHand}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleRemoveVariant(variant.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No variants yet. Add variants for different sizes, colors, etc.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
