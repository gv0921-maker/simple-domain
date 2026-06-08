import { useState, useMemo, useCallback } from 'react';
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
  FileText,
  Calendar,
  Send,
  CheckCircle,
  Eye,
  XCircle,
  Download,
  Copy,
  ArrowRight,
  Clock,
  Filter,
} from 'lucide-react';
import { convertQuotationToOrder } from '@/lib/services/sales/storage';
import { useQuotationsRich, useSaveQuotationRich, useDeleteQuotationRich } from '@/hooks/sales';
import type { Quotation, QuotationStatus } from '@/lib/services/sales/types';
import { SALES_NAV } from '@/lib/navigation/sales';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO, isPast, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { autoExpireQuotations } from '@/lib/sales/automation';
import { SalesImportExport } from '@/components/sales/SalesImportExport';

const STATUS_CONFIG: Record<QuotationStatus, { label: string; className: string; icon: typeof FileText }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground', icon: FileText },
  sent: { label: 'Sent', className: 'bg-info/20 text-info border-info', icon: Send },
  accepted: { label: 'Accepted', className: 'bg-success/20 text-success border-success', icon: CheckCircle },
  expired: { label: 'Expired', className: 'bg-warning/20 text-warning-foreground border-warning', icon: Clock },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/20 text-destructive border-destructive', icon: XCircle },
};

export default function QuotationsList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: quotations = [] } = useQuotationsRich();
  const saveQuotationMut = useSaveQuotationRich();
  const deleteQuotationMut = useDeleteQuotationRich();
  useState(() => { autoExpireQuotations(); });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuotationStatus | 'all'>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState<string | null>(null);

  // Check for expired quotations
  const processedQuotations = useMemo(() => {
    return quotations.map((q) => {
      if (q.status === 'sent' && isPast(parseISO(q.validUntil))) {
        return { ...q, status: 'expired' as QuotationStatus };
      }
      return q;
    });
  }, [quotations]);

  const filteredQuotations = useMemo(() => {
    return processedQuotations.filter((q) => {
      const matchesSearch =
        q.reference.toLowerCase().includes(search.toLowerCase()) ||
        q.customerName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [processedQuotations, search, statusFilter]);

  const stats = useMemo(() => ({
    total: processedQuotations.length,
    draft: processedQuotations.filter((q) => q.status === 'draft').length,
    sent: processedQuotations.filter((q) => q.status === 'sent').length,
    accepted: processedQuotations.filter((q) => q.status === 'accepted').length,
    expired: processedQuotations.filter((q) => q.status === 'expired').length,
    pendingValue: processedQuotations
      .filter((q) => q.status === 'sent')
      .reduce((sum, q) => sum + q.total, 0),
    acceptedValue: processedQuotations
      .filter((q) => q.status === 'accepted')
      .reduce((sum, q) => sum + q.total, 0),
  }), [processedQuotations]);

  const handleUpdateStatus = useCallback(async (id: string, status: QuotationStatus) => {
    const quotation = quotations.find((q) => q.id === id);
    if (!quotation) return;
    const updates: Partial<Quotation> = { status };
    if (status === 'sent') updates.sentAt = new Date().toISOString();
    if (status === 'accepted') updates.acceptedAt = new Date().toISOString();
    try {
      await saveQuotationMut.mutateAsync({ ...quotation, ...updates });
      toast({ title: `Quotation marked as ${status}` });
    } catch (e: any) {
      toast({ title: 'Update failed', description: e?.message ?? String(e), variant: 'destructive' });
    }
  }, [quotations, toast, saveQuotationMut]);

  const handleConvertToOrder = useCallback((id: string) => {
    const order = convertQuotationToOrder(id, user?.id || '1', user?.name || 'System');
    if (order) {
      toast({
        title: 'Order Created',
        description: `Sales order ${order.reference} created successfully`,
      });
      navigate(`/sales/orders?highlight=${order.id}`);
    }
  }, [user, toast, navigate]);

  const handleDuplicate = useCallback(async (quotation: Quotation) => {
    const { id: _id, ...rest } = quotation;
    const duplicated: Partial<Quotation> & { reference: string } = {
      ...rest,
      reference: `${quotation.reference}-COPY`,
      status: 'draft',
      sentAt: undefined,
      acceptedAt: undefined,
      convertedToOrderId: undefined,
      currentVersion: 1,
      versions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      await saveQuotationMut.mutateAsync(duplicated);
      toast({ title: 'Quotation duplicated' });
    } catch (e: any) {
      toast({ title: 'Duplicate failed', description: e?.message ?? String(e), variant: 'destructive' });
    }
  }, [toast, saveQuotationMut]);

  const confirmDelete = useCallback(async () => {
    if (quotationToDelete) {
      try {
        await deleteQuotationMut.mutateAsync(quotationToDelete);
        toast({ title: 'Quotation deleted' });
      } catch (e: any) {
        toast({ title: 'Delete failed', description: e?.message ?? String(e), variant: 'destructive' });
      }
    }
    setDeleteDialogOpen(false);
    setQuotationToDelete(null);
  }, [quotationToDelete, toast, deleteQuotationMut]);

  const handleExportPDF = useCallback((quotation: Quotation) => {
    // Generate PDF content
    const content = `
QUOTATION: ${quotation.reference}
Customer: ${quotation.customerName}
Date: ${quotation.quotationDate}
Valid Until: ${quotation.validUntil}

ITEMS:
${quotation.lines.map((line) => `- ${line.productName}: ${line.quantity} x ₹${line.unitPrice} = ₹${line.total}`).join('\n')}

Subtotal: ₹${quotation.subtotal.toLocaleString('en-IN')}
Tax: ₹${quotation.taxAmount.toLocaleString('en-IN')}
Total: ₹${quotation.total.toLocaleString('en-IN')}

${quotation.termsAndConditions || ''}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${quotation.reference}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Quotation exported' });
  }, [toast]);

  return (
    <AppLayout title="Sales" moduleNav={SALES_NAV}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Quotations</h1>
            <p className="text-muted-foreground">Create and manage sales quotations</p>
          </div>
          <Button onClick={() => navigate('/sales/quotations/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            New Quotation
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="animate-slide-up cursor-pointer hover:ring-2 ring-primary/20 transition-all" onClick={() => setStatusFilter('all')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up cursor-pointer hover:ring-2 ring-primary/20 transition-all" style={{ animationDelay: '50ms' }} onClick={() => setStatusFilter('draft')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Drafts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.draft}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up cursor-pointer hover:ring-2 ring-primary/20 transition-all" style={{ animationDelay: '100ms' }} onClick={() => setStatusFilter('sent')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-info">{stats.sent}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up cursor-pointer hover:ring-2 ring-primary/20 transition-all" style={{ animationDelay: '150ms' }} onClick={() => setStatusFilter('accepted')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Accepted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.accepted}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '200ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{`₹${stats.pendingValue.toLocaleString('en-IN')}`}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '250ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Won Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{`₹${stats.acceptedValue.toLocaleString('en-IN')}`}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder=""
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'draft', 'sent', 'accepted', 'expired', 'cancelled'] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className="capitalize"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        {/* Table */}
        <Card className="animate-fade-in">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No quotations found</p>
                    <Button variant="link" onClick={() => navigate('/sales/quotations/new')}>
                      Create your first quotation
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuotations.map((quotation, index) => {
                  const StatusIcon = STATUS_CONFIG[quotation.status].icon;
                  return (
                    <TableRow
                      key={quotation.id}
                      className="animate-fade-in cursor-pointer hover:bg-muted/50"
                      style={{ animationDelay: `${index * 30}ms` }}
                      onClick={() => navigate(`/sales/quotations/${quotation.id}`)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          {quotation.reference}
                          {quotation.currentVersion > 1 && (
                            <Badge variant="outline" className="text-xs">v{quotation.currentVersion}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{quotation.customerName}</p>
                          {quotation.salespersonName && (
                            <p className="text-xs text-muted-foreground">{quotation.salespersonName}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(parseISO(quotation.quotationDate), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={cn(
                          'flex items-center gap-1 text-sm',
                          isPast(parseISO(quotation.validUntil)) && quotation.status === 'sent' && 'text-destructive'
                        )}>
                          <Clock className="h-3 w-3" />
                          {format(parseISO(quotation.validUntil), 'MMM d, yyyy')}
                          {(() => {
                            if (quotation.status !== 'sent') return null;
                            const days = differenceInDays(parseISO(quotation.validUntil), new Date());
                            if (days < 0 || days > 7) return null;
                            return (
                              <Badge variant="outline" className="ml-1 text-[10px] text-warning-foreground border-warning bg-warning/10">
                                {days === 0 ? 'today' : `${days}d`}
                              </Badge>
                            );
                          })()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <p className="font-semibold">{`₹${quotation.total.toLocaleString('en-IN')}`}</p>
                          <p className="text-xs text-muted-foreground">{quotation.lines.length} items</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('font-normal gap-1', STATUS_CONFIG[quotation.status].className)}>
                          <StatusIcon className="h-3 w-3" />
                          {STATUS_CONFIG[quotation.status].label}
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
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/sales/quotations/${quotation.id}`); }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            {quotation.status === 'draft' && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/sales/quotations/${quotation.id}/edit`); }}>
                                <FileText className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleExportPDF(quotation); }}>
                              <Download className="h-4 w-4 mr-2" />
                              Export PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicate(quotation); }}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {quotation.status === 'draft' && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleUpdateStatus(quotation.id, 'sent'); }}>
                                <Send className="h-4 w-4 mr-2" />
                                Mark as Sent
                              </DropdownMenuItem>
                            )}
                            {quotation.status === 'sent' && (
                              <>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleUpdateStatus(quotation.id, 'accepted'); }}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark as Accepted
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleUpdateStatus(quotation.id, 'cancelled'); }}>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Mark as Rejected
                                </DropdownMenuItem>
                              </>
                            )}
                            {quotation.status === 'accepted' && !quotation.convertedToOrderId && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleConvertToOrder(quotation.id); }}>
                                <ArrowRight className="h-4 w-4 mr-2" />
                                Convert to Order
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setQuotationToDelete(quotation.id);
                                setDeleteDialogOpen(true);
                              }}
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
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quotation?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the quotation.
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
