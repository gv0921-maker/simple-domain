import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ACCOUNTING_NAV } from '@/lib/navigation/accounting';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getInvoices, createInvoice, updateInvoice, Invoice, InvoiceLine } from '@/lib/data/accounting';
import { Plus, Search, Trash2, Send, DollarSign, FileText } from 'lucide-react';
import { toast } from 'sonner';

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  sent: 'outline',
  paid: 'default',
  overdue: 'destructive',
  cancelled: 'destructive',
};

export default function InvoicesList() {
  const [invoices, setInvoices] = useState(getInvoices());
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    lines: [] as InvoiceLine[],
  });

  const [newLine, setNewLine] = useState({
    productName: '',
    quantity: 1,
    unitPrice: 0,
  });

  const TAX_RATE = 0.18;

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.number.toLowerCase().includes(search.toLowerCase()) ||
                          inv.customerName.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'all' || inv.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const subtotal = formData.lines.reduce((sum, l) => sum + l.subtotal, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const handleAddLine = () => {
    if (!newLine.productName || newLine.unitPrice <= 0) {
      toast.error('Please fill in product details');
      return;
    }

    const lineSubtotal = newLine.quantity * newLine.unitPrice;
    setFormData({
      ...formData,
      lines: [...formData.lines, {
        id: `IL-${Date.now()}`,
        productId: `PROD-${Date.now()}`,
        productName: newLine.productName,
        quantity: newLine.quantity,
        unitPrice: newLine.unitPrice,
        taxRate: TAX_RATE * 100,
        subtotal: lineSubtotal,
      }],
    });
    setNewLine({ productName: '', quantity: 1, unitPrice: 0 });
  };

  const handleRemoveLine = (lineId: string) => {
    setFormData({
      ...formData,
      lines: formData.lines.filter(l => l.id !== lineId),
    });
  };

  const handleCreate = () => {
    if (!formData.customerName || formData.lines.length === 0) {
      toast.error('Please add customer and invoice lines');
      return;
    }

    createInvoice({
      customerId: `CUST-${Date.now()}`,
      customerName: formData.customerName,
      date: formData.date,
      dueDate: formData.dueDate,
      status: 'draft',
      lines: formData.lines,
      subtotal,
      tax,
      total,
      amountPaid: 0,
      amountDue: total,
    });
    setInvoices(getInvoices());
    setDialogOpen(false);
    setFormData({
      customerName: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      lines: [],
    });
    toast.success('Invoice created');
  };

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
    <AppLayout title="Accounting" subtitle="Invoices" moduleNav={ACCOUNTING_NAV}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Invoices</h1>
          <Button onClick={() => setDialogOpen(true)}>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>New Invoice</DialogTitle>
            <DialogDescription>
              Create a new customer invoice with line items
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Customer</Label>
                <Input
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="Customer name"
                />
              </div>
              <div>
                <Label>Invoice Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <Label className="mb-2 block">Invoice Lines</Label>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Product/Service"
                  value={newLine.productName}
                  onChange={(e) => setNewLine({ ...newLine, productName: e.target.value })}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Qty"
                  value={newLine.quantity}
                  onChange={(e) => setNewLine({ ...newLine, quantity: parseInt(e.target.value) || 1 })}
                  className="w-20"
                />
                <Input
                  type="number"
                  placeholder="Price"
                  value={newLine.unitPrice || ''}
                  onChange={(e) => setNewLine({ ...newLine, unitPrice: parseFloat(e.target.value) || 0 })}
                  className="w-28"
                />
                <Button onClick={handleAddLine}>Add</Button>
              </div>

              {formData.lines.length > 0 && (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product/Service</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.lines.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell>{line.productName}</TableCell>
                          <TableCell className="text-right">{line.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(line.unitPrice)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(line.subtotal)}</TableCell>
                          <TableCell>
                            <Button size="icon" variant="ghost" onClick={() => handleRemoveLine(line.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex justify-end mt-4 space-y-1">
                    <div className="w-64 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax (18%):</span>
                        <span>{formatCurrency(tax)}</span>
                      </div>
                      <div className="flex justify-between font-bold border-t pt-1">
                        <span>Total:</span>
                        <span>{formatCurrency(total)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
