import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
} from 'lucide-react';
import { getPricelists, deletePricelist } from '@/lib/services/sales/storage';
import type { Pricelist } from '@/lib/services/sales/types';
import { SALES_NAV } from '@/lib/navigation/sales';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function PricelistsPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pricelists, setPricelists] = useState<Pricelist[]>(() => getPricelists());
  const [search, setSearch] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pricelistToDelete, setPricelistToDelete] = useState<string | null>(null);

  const filteredPricelists = useMemo(() => {
    return pricelists.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase())
    );
  }, [pricelists, search]);

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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Pricelists</h1>
            <p className="text-muted-foreground">Manage pricing rules and customer discounts</p>
          </div>
          <Button onClick={() => navigate('/sales/pricelists/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            New Pricelist
          </Button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pricelists..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPricelists.map((pricelist, index) => (
            <Card
              key={pricelist.id}
              className={cn(
                'animate-slide-up cursor-pointer hover:ring-2 ring-primary/20 transition-all',
                !pricelist.isActive && 'opacity-60'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => navigate(`/sales/pricelists/${pricelist.id}/edit`)}
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
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/sales/pricelists/${pricelist.id}/edit`); }}>
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
                <Button variant="link" onClick={() => navigate('/sales/pricelists/new')}>
                  Create your first pricelist
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pricelist?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the pricelist and its rules.
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
