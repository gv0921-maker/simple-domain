import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Filter,
  MoreHorizontal,
  Eye,
  Check,
  X,
  ArrowUpDown,
  Package,
  Truck,
  ArrowLeftRight,
  RotateCcw,
  Factory,
} from 'lucide-react';
import { 
  getStockMoves, 
  deleteStockMove,
  validateStockMove,
} from '@/lib/data/inventory/storage';
import type { StockMove, StockMoveState } from '@/lib/data/inventory/types';
import { INVENTORY_NAV } from '@/lib/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useInventoryAccess } from '@/hooks/useInventoryPermissions';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const STATE_CONFIG: Record<StockMoveState, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  waiting: { label: 'Waiting', className: 'bg-warning/20 text-warning-foreground border-warning' },
  confirmed: { label: 'Confirmed', className: 'bg-info/20 text-info border-info' },
  assigned: { label: 'Assigned', className: 'bg-primary/20 text-primary border-primary' },
  done: { label: 'Done', className: 'bg-success/20 text-success border-success' },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/20 text-destructive border-destructive' },
};

const OPERATION_ICONS = {
  receipt: Package,
  delivery: Truck,
  internal: ArrowLeftRight,
  adjustment: RotateCcw,
  production: Factory,
  return: RotateCcw,
};

const OPERATION_COLORS = {
  receipt: 'text-success bg-success/10',
  delivery: 'text-info bg-info/10',
  internal: 'text-warning bg-warning/10',
  adjustment: 'text-primary bg-primary/10',
  production: 'text-purple-500 bg-purple-500/10',
  return: 'text-orange-500 bg-orange-500/10',
};

export default function StockMovesEnhanced() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { canCreateMoves, canValidateReceipts, canValidateDeliveries } = useInventoryAccess();
  
  const [moves, setMoves] = useState<StockMove[]>(getStockMoves());
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'scheduledDate' | 'reference'>('scheduledDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredMoves = useMemo(() => {
    return moves
      .filter((m) => {
        const matchesSearch =
          m.reference.toLowerCase().includes(search.toLowerCase()) ||
          m.partnerName?.toLowerCase().includes(search.toLowerCase()) ||
          m.sourceDocument?.toLowerCase().includes(search.toLowerCase());
        const matchesState = stateFilter === 'all' || m.state === stateFilter;
        const matchesType = typeFilter === 'all' || m.operationType === typeFilter;
        return matchesSearch && matchesState && matchesType;
      })
      .sort((a, b) => {
        const aVal = sortField === 'scheduledDate' ? new Date(a.scheduledDate).getTime() : a.reference;
        const bVal = sortField === 'scheduledDate' ? new Date(b.scheduledDate).getTime() : b.reference;
        if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
        return aVal < bVal ? 1 : -1;
      });
  }, [moves, search, stateFilter, typeFilter, sortField, sortOrder]);

  const stats = useMemo(() => ({
    total: moves.length,
    pending: moves.filter(m => !['done', 'cancelled'].includes(m.state)).length,
    receipts: moves.filter(m => m.operationType === 'receipt' && m.state !== 'done').length,
    deliveries: moves.filter(m => m.operationType === 'delivery' && m.state !== 'done').length,
  }), [moves]);

  const toggleSort = (field: 'scheduledDate' | 'reference') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleValidate = (moveId: string) => {
    if (user) {
      validateStockMove(moveId, user.id, user.name);
      setMoves(getStockMoves());
      toast({
        title: 'Stock Move Validated',
        description: 'Stock levels have been updated.',
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteStockMove(id);
    setMoves(getStockMoves());
    toast({ title: 'Stock Move Deleted' });
  };

  return (
    <AppLayout title="Inventory" moduleNav={INVENTORY_NAV}>
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="animate-slide-up">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Moves</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '50ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Receipts Waiting</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.receipts}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Deliveries Waiting</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-info">{stats.deliveries}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder=""
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="waiting">Waiting</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="done">Done</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="receipt">Receipts</SelectItem>
                <SelectItem value="delivery">Deliveries</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="adjustment">Adjustments</SelectItem>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="return">Returns</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {canCreateMoves && (
            <Button onClick={() => navigate('/inventory/transfers/new')} className="gap-2">
              <Plus className="h-4 w-4" />
              New Stock Move
            </Button>
          )}
        </div>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Type</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 -ml-3"
                    onClick={() => toggleSort('reference')}
                  >
                    Reference
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Partner</TableHead>
                <TableHead>From → To</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 -ml-3"
                    onClick={() => toggleSort('scheduledDate')}
                  >
                    Date
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>State</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMoves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No stock moves found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMoves.map((move, index) => {
                  const Icon = OPERATION_ICONS[move.operationType] || Package;
                  const colorClass = OPERATION_COLORS[move.operationType] || 'text-muted-foreground bg-muted';
                  const canValidate = 
                    (move.operationType === 'receipt' && canValidateReceipts) ||
                    (move.operationType === 'delivery' && canValidateDeliveries) ||
                    (['internal', 'adjustment', 'production', 'return'].includes(move.operationType) && canCreateMoves);
                  
                  return (
                    <TableRow
                      key={move.id}
                      className="cursor-pointer hover:bg-muted/50 animate-fade-in"
                      style={{ animationDelay: `${index * 30}ms` }}
                      onClick={() => navigate(`/inventory/transfers/${move.id}`)}
                    >
                      <TableCell>
                        <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center', colorClass)}>
                          <Icon className="h-5 w-5" />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-primary">{move.reference}</TableCell>
                      <TableCell>{move.partnerName || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {move.sourceLocationName} → {move.destinationLocationName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{move.lines.length} items</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(move.scheduledDate), 'MMM d, HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('font-normal', STATE_CONFIG[move.state].className)}>
                          {STATE_CONFIG[move.state].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/inventory/transfers/${move.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {canValidate && ['confirmed', 'assigned'].includes(move.state) && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleValidate(move.id); }}>
                                <Check className="h-4 w-4 mr-2" />
                                Validate
                              </DropdownMenuItem>
                            )}
                            {move.state === 'draft' && (
                              <DropdownMenuItem 
                                onClick={(e) => { e.stopPropagation(); handleDelete(move.id); }}
                                className="text-destructive"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
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
      </div>
    </AppLayout>
  );
}
