import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Package,
} from 'lucide-react';
import { useProducts, useDeleteProduct } from '@/hooks/inventory';
import type { Product } from '@/lib/services/inventory';
import { INVENTORY_NAV } from '@/lib/navigation';
import { useToast } from '@/hooks/use-toast';

export default function ProductsList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: products = [] } = useProducts();
  const deleteMut = useDeleteProduct();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<keyof Product>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filteredProducts = useMemo(() => {
    let result = products.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
    );

    result.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    return result;
  }, [products, search, sortBy, sortDir]);

  const handleSort = (column: keyof Product) => {
    if (sortBy === column) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const handleDelete = (id: string) => {
    deleteMut.mutate(id, {
      onSuccess: () => toast({ title: 'Product deleted', description: 'The product has been removed.' }),
      onError: (e: any) => toast({ title: 'Delete failed', description: e?.message, variant: 'destructive' }),
    });
  };

  return (
    <AppLayout title="Inventory" moduleNav={INVENTORY_NAV}>
      <div className="p-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-medium text-foreground">Products</h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder=""
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="shrink-0">
              <Filter className="h-4 w-4" />
            </Button>
            <Button onClick={() => navigate('/inventory/products/new')} className="gap-1 shrink-0">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Product</span>
            </Button>
          </div>
        </div>

        {/* Mobile card grid */}
        <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full border rounded-lg p-8 text-center text-muted-foreground bg-card">
              <Package className="h-10 w-10 mx-auto mb-2" />
              No products found
            </div>
          ) : (
            filteredProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => navigate(`/inventory/products/${product.id}`)}
                className="text-left border rounded-lg bg-card p-3 flex gap-3 hover:bg-muted/40 transition-colors min-h-[88px]"
              >
                <div className="w-14 h-14 bg-muted rounded flex items-center justify-center shrink-0">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{product.name}</div>
                  <div className="text-xs font-mono text-muted-foreground truncate">{product.sku}</div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">₹{product.salePrice.toLocaleString()}</span>
                    <Badge variant={product.stockOnHand <= product.reorderLevel ? 'destructive' : 'secondary'}>
                      {product.stockOnHand} {product.stockOnHand <= product.reorderLevel ? 'Low' : 'in stock'}
                    </Badge>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Products table (desktop / tablet) */}
        <div className="hidden md:block border rounded-lg bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 -ml-3"
                    onClick={() => handleSort('sku')}
                  >
                    SKU
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 -ml-3"
                    onClick={() => handleSort('name')}
                  >
                    Name
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 -ml-3"
                    onClick={() => handleSort('category')}
                  >
                    Category
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                    onClick={() => handleSort('costPrice')}
                  >
                    Cost
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                    onClick={() => handleSort('salePrice')}
                  >
                    Sale Price
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                    onClick={() => handleSort('stockOnHand')}
                  >
                    On Hand
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No products found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product, index) => (
                  <TableRow
                    key={product.id}
                    className="animate-fade-in cursor-pointer hover:bg-muted/50"
                    style={{ animationDelay: `${index * 30}ms` }}
                    onClick={() => navigate(`/inventory/products/${product.id}`)}
                  >
                    <TableCell>
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{product.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right">₹{product.costPrice.toLocaleString()}</TableCell>
                    <TableCell className="text-right">₹{product.salePrice.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className={product.stockOnHand <= product.reorderLevel ? 'text-destructive font-medium' : ''}>
                        {product.stockOnHand}
                      </span>
                      {product.stockOnHand <= product.reorderLevel && (
                        <Badge variant="destructive" className="ml-2 text-xs">Low</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/inventory/products/${product.id}`); }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {filteredProducts.length} of {products.length} products
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
