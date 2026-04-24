import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { INVOICING_NAV } from '@/lib/navigation/invoicing';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getInvoices, updateInvoice } from '@/lib/services/accounting';
import { Plus, Search, Send, DollarSign, FileText } from 'lucide-react';
import { toast } from 'sonner';

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  sent: 'outline',
  paid: 'default',
  overdue: 'destructive',
  cancelled: 'destructive',
};

export default function InvoicesList() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState(getInvoices());
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.number.toLowerCase().includes(search.toLowerCase()) ||
                          inv.customerName.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'all' || inv.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleSend = (id: string) => {
    updateInvoice(id, { status: 'sent' });
    setInvoices(getInvoices());
    toast.success('Invoice sent');
  };

  const handleMarkPaid = (id: string) => {
    const inv = invoices.find(i => i.id === id);
    if (inv) {
      updateInvoice(id, { status: 'paid', amountPaid: inv.total, amountDue: 0 });
      setInvoices(getInvoices());
      toast.success('Invoice marked as paid');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  return (
    <AppLayout title="Invoices" moduleNav={INVOICING_NAV}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Invoices</h1>
          <Button onClick={() => navigate('/invoicing/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
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
                  <TabsTrigger value="sent">Sent</TabsTrigger>
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
                  {filteredInvoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{inv.number}</span>
                        </div>
                      </TableCell>
                      <TableCell>{inv.customerName}</TableCell>
                      <TableCell>{inv.date}</TableCell>
                      <TableCell>{inv.dueDate}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(inv.total)}</TableCell>
                      <TableCell className="text-right">
                        <span className={inv.amountDue > 0 ? 'text-destructive' : 'text-success'}>
                          {formatCurrency(inv.amountDue)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColors[inv.status]}>{inv.status}</Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          {inv.status === 'draft' && (
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleSend(inv.id); }}>
                              <Send className="h-4 w-4 mr-1" />
                              Send
                            </Button>
                          )}
                          {(inv.status === 'sent' || inv.status === 'overdue') && (
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleMarkPaid(inv.id); }}>
                              <DollarSign className="h-4 w-4 mr-1" />
                              Paid
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
