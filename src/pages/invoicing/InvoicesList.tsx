import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { INVOICING_NAV } from '@/lib/navigation/invoicing';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useInvoices,
  useSaveInvoice,
  type Invoice,
  type InvoiceType,
} from '@/hooks/invoicing';
import { useCustomers } from '@/hooks/sales';
import { Plus, Search, DollarSign, FileText } from 'lucide-react';
import { toast } from 'sonner';

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  sent: 'outline',
  paid: 'default',
  overdue: 'destructive',
  cancelled: 'destructive',
};

interface InvoicesListProps {
  variant?: 'bills' | 'minimum' | 'kh';
  title?: string;
}

const variantLabels: Record<string, string> = {
  bills: 'Bills',
  minimum: 'Minimum Bills',
  kh: 'KH Bills',
};

const variantToType: Record<NonNullable<InvoicesListProps['variant']>, InvoiceType> = {
  bills: 'regular',
  minimum: 'minimum',
  kh: 'kh',
};

export default function InvoicesList({ variant = 'bills', title }: InvoicesListProps = {}) {
  const navigate = useNavigate();
  const type = variantToType[variant];
  const { data: invoices = [] } = useInvoices(type);
  const { data: customers = [] } = useCustomers();
  const customerMap = useMemo(
    () => Object.fromEntries(customers.map((c) => [c.id, c.name])),
    [customers],
  );
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const heading = title ?? variantLabels[variant] ?? 'Bills';
  const saveInvoice = useSaveInvoice();

  const filteredInvoices = invoices.filter((inv) => {
    const customerName = (inv.customer_id && customerMap[inv.customer_id]) || '';
    const matchesSearch =
      inv.reference.toLowerCase().includes(search.toLowerCase()) ||
      customerName.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'all' || inv.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleMarkPaid = async (inv: Invoice) => {
    try {
      await saveInvoice.mutateAsync({
        id: inv.id,
        reference: inv.reference,
        customer_id: inv.customer_id,
        sales_order_id: inv.sales_order_id,
        type: inv.type,
        issue_date: inv.issue_date,
        due_date: inv.due_date,
        status: 'paid',
        notes: inv.notes,
        subtotal: Number(inv.subtotal),
        tax_amount: Number(inv.tax_amount),
        discount_amount: Number(inv.discount_amount),
        total: Number(inv.total),
        paid_amount: Number(inv.total),
        currency: inv.currency,
        lines: (inv.invoice_lines ?? []).map((l) => ({
          product_id: l.product_id,
          description: l.description,
          quantity: Number(l.quantity),
          unit_price: Number(l.unit_price),
          discount: Number(l.discount),
          tax_rate: Number(l.tax_rate),
          subtotal: Number(l.subtotal),
        })),
      });
      toast.success('Invoice marked as paid');
    } catch {
      toast.error('Failed to update invoice');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  return (
    <AppLayout title="Invoices" moduleNav={INVOICING_NAV}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{heading}</h1>
          <Button onClick={() => navigate(`/invoicing/new?type=${type}`)}>
            <Plus className="h-4 w-4 mr-2" />
            New {heading.replace(/s$/, '')}
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Card>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="border-b px-4">
                <TabsList className="h-12">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="draft">Draft</TabsTrigger>
                  <TabsTrigger value="paid">Paid</TabsTrigger>
                  <TabsTrigger value="overdue">Overdue</TabsTrigger>
                </TabsList>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((inv) => {
                    const total = Number(inv.total);
                    const due = total - Number(inv.paid_amount);
                    return (
                      <TableRow key={inv.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{inv.reference}</span>
                          </div>
                        </TableCell>
                        <TableCell>{(inv.customer_id && customerMap[inv.customer_id]) || '—'}</TableCell>
                        <TableCell>{inv.issue_date}</TableCell>
                        <TableCell>{inv.due_date ?? ''}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(total)}</TableCell>
                        <TableCell className="text-right">
                          <span className={due > 0 ? 'text-destructive' : 'text-success'}>
                            {formatCurrency(due)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusColors[inv.status]}>{inv.status}</Badge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            {(inv.status === 'draft' || inv.status === 'overdue' || inv.status === 'sent') && (
                              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleMarkPaid(inv); }}>
                                <DollarSign className="h-4 w-4 mr-1" />
                                Paid
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
