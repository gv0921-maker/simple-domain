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
  MoreHorizontal,
  Eye,
  Check,
  AlertTriangle,
  Clock,
  Package,
  Filter,
} from 'lucide-react';
import { 
  getAdjustments, 
  approveAdjustment,
  getLocations,
} from '@/lib/data/inventory/storage';
import type { InventoryAdjustment } from '@/lib/data/inventory/types';
import { INVENTORY_NAV } from '@/lib/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  pending_approval: { label: 'Pending Approval', className: 'bg-warning/20 text-warning-foreground border-warning' },
  approved: { label: 'Approved', className: 'bg-info/20 text-info border-info' },
  rejected: { label: 'Rejected', className: 'bg-destructive/20 text-destructive border-destructive' },
  done: { label: 'Done', className: 'bg-success/20 text-success border-success' },
};

const REASON_LABELS: Record<string, string> = {
  count: 'Inventory Count',
  damage: 'Damaged Goods',
  theft: 'Theft/Loss',
  expiry: 'Expired Products',
  correction: 'Correction',
  other: 'Other',
};

export default function InventoryAdjustments() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>(getAdjustments());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const locations = getLocations();

  const filteredAdjustments = useMemo(() => {
    return adjustments.filter((adj) => {
      const matchesSearch = 
        adj.reference.toLowerCase().includes(search.toLowerCase()) ||
        adj.locationName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || adj.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [adjustments, search, statusFilter]);

  const stats = useMemo(() => ({
    total: adjustments.length,
    pending: adjustments.filter(a => a.status === 'pending_approval').length,
    done: adjustments.filter(a => a.status === 'done').length,
    totalValue: adjustments.filter(a => a.status === 'done').reduce((sum, a) => 
      sum + a.lines.reduce((s, l) => s + l.valueDifference, 0), 0
    ),
  }), [adjustments]);

  const handleApprove = (id: string) => {
    if (user) {
      approveAdjustment(id, user.id);
      setAdjustments(getAdjustments());
      toast({
        title: 'Adjustment Approved',
        description: 'Stock levels have been updated.',
      });
    }
  };

  return (
    <AppLayout title="Inventory" moduleNav={INVENTORY_NAV}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Inventory Adjustments</h1>
            <p className="text-muted-foreground">Manage stock counts and adjustments</p>
          </div>
          <Button onClick={() => navigate('/inventory/barcode')} className="gap-2">
            <Plus className="h-4 w-4" />
            New Adjustment
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="animate-slide-up">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Adjustments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '50ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.done}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Value Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold",
                stats.totalValue >= 0 ? "text-success" : "text-destructive"
              )}>
                {stats.totalValue >= 0 ? '+' : ''}₹{Math.abs(stats.totalValue).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending_approval">Pending</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Difference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdjustments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No adjustments found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAdjustments.map((adj, index) => {
                  const totalDiff = adj.lines.reduce((sum, l) => sum + l.difference, 0);
                  const valueDiff = adj.lines.reduce((sum, l) => sum + l.valueDifference, 0);
                  return (
                    <TableRow
                      key={adj.id}
                      className="cursor-pointer hover:bg-muted/50 animate-fade-in"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <TableCell className="font-medium text-primary">{adj.reference}</TableCell>
                      <TableCell>{adj.locationName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{REASON_LABELS[adj.reason] || adj.reason}</Badge>
                      </TableCell>
                      <TableCell>{adj.lines.length}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            totalDiff > 0 && "text-success",
                            totalDiff < 0 && "text-destructive"
                          )}>
                            {totalDiff > 0 ? '+' : ''}{totalDiff} units
                          </span>
                          <span className={cn(
                            "text-sm",
                            valueDiff > 0 && "text-success",
                            valueDiff < 0 && "text-destructive"
                          )}>
                            ({valueDiff >= 0 ? '+' : ''}₹{Math.abs(valueDiff).toLocaleString()})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('font-normal', STATUS_CONFIG[adj.status].className)}>
                          {STATUS_CONFIG[adj.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(adj.createdAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {adj.status === 'pending_approval' && (
                              <DropdownMenuItem onClick={() => handleApprove(adj.id)}>
                                <Check className="h-4 w-4 mr-2" />
                                Approve
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
