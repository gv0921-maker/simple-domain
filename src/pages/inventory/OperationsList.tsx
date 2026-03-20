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
  Pencil,
  Trash2,
  ArrowUpDown,
  Package,
  ArrowLeftRight,
  TruckIcon,
  RotateCcw,
} from 'lucide-react';
import { getTransfers, deleteTransfer, type InventoryTransfer, type TransferStatus } from '@/lib/data/inventory';
import { INVENTORY_NAV } from '@/lib/navigation';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<TransferStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  waiting: { label: 'Waiting', className: 'bg-warning/20 text-warning-foreground border-warning' },
  ready: { label: 'Ready', className: 'bg-info/20 text-info border-info' },
  done: { label: 'Done', className: 'bg-success/20 text-success border-success' },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/20 text-destructive border-destructive' },
};

const OPERATION_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'receipt', label: 'Receipts', icon: Package },
  { value: 'delivery', label: 'Deliveries', icon: TruckIcon },
  { value: 'internal', label: 'Internal Transfers', icon: ArrowLeftRight },
  { value: 'return', label: 'Returns', icon: RotateCcw },
];

export default function OperationsList() {
  const navigate = useNavigate();
  const [transfers, setTransfers] = useState<InventoryTransfer[]>(getTransfers());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'scheduledDate' | 'reference'>('scheduledDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredTransfers = useMemo(() => {
    return transfers
      .filter((t) => {
        const matchesSearch =
          t.reference.toLowerCase().includes(search.toLowerCase()) ||
          t.contact.toLowerCase().includes(search.toLowerCase()) ||
          t.sourceDocument?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
        const matchesType = typeFilter === 'all' || t.operationType.toLowerCase().includes(typeFilter);
        return matchesSearch && matchesStatus && matchesType;
      })
      .sort((a, b) => {
        const aVal = sortField === 'scheduledDate' ? new Date(a.scheduledDate).getTime() : a.reference;
        const bVal = sortField === 'scheduledDate' ? new Date(b.scheduledDate).getTime() : b.reference;
        if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
        return aVal < bVal ? 1 : -1;
      });
  }, [transfers, search, statusFilter, typeFilter, sortField, sortOrder]);

  const stats = useMemo(() => {
    return {
      total: transfers.length,
      waiting: transfers.filter((t) => t.status === 'waiting').length,
      ready: transfers.filter((t) => t.status === 'ready').length,
      late: transfers.filter((t) => new Date(t.scheduledDate) < new Date() && t.status !== 'done').length,
    };
  }, [transfers]);

  const toggleSort = (field: 'scheduledDate' | 'reference') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTransfer(id);
    setTransfers(getTransfers());
  };

  return (
    <AppLayout title="Inventory" moduleNav={INVENTORY_NAV}>
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="animate-slide-up" style={{ animationDelay: '0ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Operations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '50ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Waiting</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.waiting}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ready</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-info">{stats.ready}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Late</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.late}</div>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="waiting">Waiting</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="done">Done</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Operation Type" />
              </SelectTrigger>
              <SelectContent>
                {OPERATION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => navigate('/inventory/transfers/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            New Transfer
          </Button>
        </div>

        {/* Table */}
        <Card className="animate-fade-in">
          <Table>
            <TableHeader>
              <TableRow>
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
                <TableHead>Contact</TableHead>
                <TableHead>Operation Type</TableHead>
                <TableHead>From → To</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 -ml-3"
                    onClick={() => toggleSort('scheduledDate')}
                  >
                    Scheduled Date
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransfers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No operations found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransfers.map((transfer, index) => (
                  <TableRow
                    key={transfer.id}
                    className="cursor-pointer hover:bg-muted/50 animate-fade-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                    onClick={() => navigate(`/inventory/transfers/${transfer.id}`)}
                  >
                    <TableCell className="font-medium text-primary">
                      {transfer.reference}
                    </TableCell>
                    <TableCell>{transfer.contact}</TableCell>
                    <TableCell className="text-sm">{transfer.operationType}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {transfer.sourceLocation} → {transfer.destinationLocation}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(parseISO(transfer.scheduledDate), 'dd MMM yyyy, HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('font-normal', STATUS_CONFIG[transfer.status].className)}>
                        {STATUS_CONFIG[transfer.status].label}
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
                          <DropdownMenuItem onClick={() => navigate(`/inventory/transfers/${transfer.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/inventory/transfers/${transfer.id}/edit`)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => handleDelete(transfer.id, e)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
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
        </Card>
      </div>
    </AppLayout>
  );
}
