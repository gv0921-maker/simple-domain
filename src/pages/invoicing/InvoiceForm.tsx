import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ACCOUNTING_NAV } from '@/lib/navigation/accounting';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { createInvoice, type InvoiceLine } from '@/lib/services/accounting';
import { toast } from 'sonner';

export default function InvoiceForm() {
  const navigate = useNavigate();
  const TAX_RATE = 0.18;

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

  const subtotal = formData.lines.reduce((sum, l) => sum + l.subtotal, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

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

  const handleSubmit = () => {
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
    toast.success('Invoice created');
    navigate('/invoicing');
  };

  return (
    <AppLayout title="Accounting" subtitle="New Invoice" moduleNav={ACCOUNTING_NAV}>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/invoicing')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">New Invoice</h1>
            <p className="text-muted-foreground">Create a new customer invoice with line items</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Customer *</Label>
                <Input
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Invoice Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Lines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
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
              <Button onClick={handleAddLine}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
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
                    {formData.lines.map(line => (
                      <TableRow key={line.id}>
                        <TableCell>{line.productName}</TableCell>
                        <TableCell className="text-right">{line.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(line.unitPrice)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(line.subtotal)}</TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost" onClick={() => setFormData({ ...formData, lines: formData.lines.filter(l => l.id !== line.id) })}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex justify-end">
                  <div className="w-64 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span><span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax (18%):</span><span>{formatCurrency(tax)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-1">
                      <span>Total:</span><span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate('/invoicing')}>Cancel</Button>
          <Button onClick={handleSubmit}>Create Invoice</Button>
        </div>
      </div>
    </AppLayout>
  );
}
