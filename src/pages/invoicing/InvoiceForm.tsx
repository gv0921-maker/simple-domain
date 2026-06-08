import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { INVOICING_NAV } from '@/lib/navigation/invoicing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useSaveInvoice, type InvoiceType } from '@/hooks/invoicing';
import { useCustomers } from '@/hooks/sales';
import { toast } from 'sonner';

interface DraftLine {
  tmpId: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  subtotal: number;
}

const TYPE_LABEL: Record<InvoiceType, string> = {
  regular: 'Invoice',
  kh: 'KH Bill',
  minimum: 'Minimum Bill',
};

export default function InvoiceForm() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialType = (params.get('type') as InvoiceType) || 'regular';
  const TAX_RATE = 0.18;

  const { data: customers = [] } = useCustomers();
  const saveInvoice = useSaveInvoice();

  const [type, setType] = useState<InvoiceType>(
    ['regular', 'kh', 'minimum'].includes(initialType) ? initialType : 'regular',
  );
  const [customerId, setCustomerId] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState<string>('');
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [newLine, setNewLine] = useState({ description: '', quantity: 1, unit_price: 0 });

  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.subtotal, 0), [lines]);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

  const handleAddLine = () => {
    if (!newLine.description || newLine.unit_price <= 0) {
      toast.error('Please fill in line details');
      return;
    }
    setLines((curr) => [
      ...curr,
      {
        tmpId: `L-${Date.now()}`,
        description: newLine.description,
        quantity: newLine.quantity,
        unit_price: newLine.unit_price,
        tax_rate: TAX_RATE * 100,
        subtotal: newLine.quantity * newLine.unit_price,
      },
    ]);
    setNewLine({ description: '', quantity: 1, unit_price: 0 });
  };

  const handleSubmit = async () => {
    if (!customerId) {
      toast.error('Please select a customer');
      return;
    }
    if (lines.length === 0) {
      toast.error('Please add at least one line');
      return;
    }
    try {
      await saveInvoice.mutateAsync({
        customer_id: customerId,
        type,
        issue_date: issueDate,
        due_date: dueDate || null,
        status: 'draft',
        subtotal,
        tax_amount: tax,
        discount_amount: 0,
        total,
        paid_amount: 0,
        currency: 'INR',
        lines: lines.map((l) => ({
          product_id: null,
          description: l.description,
          quantity: l.quantity,
          unit_price: l.unit_price,
          discount: 0,
          tax_rate: l.tax_rate,
          subtotal: l.subtotal,
        })),
      });
      toast.success(`${TYPE_LABEL[type]} created`);
      const back = type === 'kh' ? '/invoicing/kh-bills' : type === 'minimum' ? '/invoicing/minimum-bills' : '/invoicing/bills';
      navigate(back);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to create invoice');
    }
  };

  return (
    <AppLayout title="Invoices" subtitle={`New ${TYPE_LABEL[type]}`} moduleNav={INVOICING_NAV}>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">New {TYPE_LABEL[type]}</h1>
            <p className="text-muted-foreground">Create a new customer invoice with line items</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as InvoiceType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="kh">KH</SelectItem>
                    <SelectItem value="minimum">Minimum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Customer *</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Invoice Date</Label>
                <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Due Date</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
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
                value={newLine.description}
                onChange={(e) => setNewLine({ ...newLine, description: e.target.value })}
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
                value={newLine.unit_price || ''}
                onChange={(e) => setNewLine({ ...newLine, unit_price: parseFloat(e.target.value) || 0 })}
                className="w-28"
              />
              <Button onClick={handleAddLine}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>

            {lines.length > 0 && (
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
                    {lines.map((line) => (
                      <TableRow key={line.tmpId}>
                        <TableCell>{line.description}</TableCell>
                        <TableCell className="text-right">{line.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(line.unit_price)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(line.subtotal)}</TableCell>
                        <TableCell>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setLines(lines.filter((l) => l.tmpId !== line.tmpId))}
                          >
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
          <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saveInvoice.isPending}>
            {saveInvoice.isPending ? 'Saving…' : `Create ${TYPE_LABEL[type]}`}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}